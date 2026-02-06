/**
 * 📌 Plugin de Cache do Cardápio (Server-side)
 *
 * Busca os dados do cardápio NO SERVIDOR e popula o useState.
 * Quando o cliente hidrata, os dados já estão disponíveis = carregamento instantâneo.
 *
 * IMPORTANTE: Os dados são protegidos por RLS, então só carrega se o usuário estiver autenticado.
 *
 * ⚡ OTIMIZAÇÃO: Cache com TTL de 5 minutos para categorias (mudam raramente)
 */

import type { CategoriaComputada } from "~/features/admin/types/categoria";
import type { ProdutoComputado } from "~/features/admin/types/produto";
import type { GrupoAdicionalComputado } from "~/features/admin/types/adicional";
import type { Combo } from "~/features/admin/types/combo";
import { createCacheWithTTL } from "~/lib/utils/cache";

export default defineNuxtPlugin(async () => {
	// Só executar no server-side
	if (!import.meta.server) return;

	// Só carregar dados de cardápio na rota de cardápio
	const route = useRoute();
	if (!route.path.includes("/admin/cardapio")) return;

	const user = useSupabaseUser();
	const userId = user.value?.id ?? (user.value as { sub?: string } | null)?.sub;

	// Se não há usuário logado, não carregar dados do cardápio
	if (!userId) return;

	const supabase = useSupabaseClient();

	// Inicializar os estados globais
	const categorias = useState<CategoriaComputada[]>("categorias", () => []);
	useState<boolean>("categorias-loading", () => false); // Inicializa loading como false
	const categoriasCacheLoaded = useState<boolean>("categorias-cache-loaded", () => false);

	const produtos = useState<ProdutoComputado[]>("produtos", () => []);
	useState<boolean>("produtos-loading", () => false); // Inicializa loading como false
	const produtosCacheLoaded = useState<boolean>("produtos-cache-loaded", () => false);

	const gruposAdicionais = useState<GrupoAdicionalComputado[]>("grupos-adicionais", () => []);
	useState<boolean>("grupos-adicionais-loading", () => false); // Inicializa loading como false
	const gruposAdicionaisCacheLoaded = useState<boolean>(
		"grupos-adicionais-cache-loaded",
		() => false,
	);

	const combos = useState<Combo[]>("combos", () => []);
	useState<boolean>("combos-loading", () => false); // Inicializa loading como false
	const combosCacheLoaded = useState<boolean>("combos-cache-loaded", () => false);

	try {
		// Buscar estabelecimento_id do usuário
		const { data: perfil } = await supabase
			.from("perfis")
			.select("estabelecimento_id")
			.eq("id", userId)
			.single();

		if (!perfil?.estabelecimento_id) {
			console.warn("[CardapioCache] Estabelecimento não encontrado");
			return;
		}

		const estabelecimentoId = perfil.estabelecimento_id;

		// ⚡ Cache para categorias (TTL: 5 minutos - mudam raramente)
		const categoriasCache = createCacheWithTTL<unknown[]>(
			`categorias-${estabelecimentoId}`,
			5 * 60 * 1000, // 5 minutos
		);

		// Buscar todos os dados em paralelo
		const [categoriasRes, produtosRes, gruposRes, combosRes] = await Promise.all([
			// Categorias com cache
			categoriasCache.get(async () => {
				const { data, error } = await supabase
					.from("categorias")
					.select(
						`
						*,
						produtos:produtos(count)
					`,
					)
					.eq("estabelecimento_id", estabelecimentoId)
					.order("ordem", { ascending: true });

				if (error) throw error;
				return data || [];
			}),

			// Produtos com categoria e variações
			supabase
				.from("produtos")
				.select(
					`
					*,
					categoria:categorias!produtos_categoria_id_fkey(id, nome),
					variacoes:produto_variacoes(id)
				`,
				)
				.eq("estabelecimento_id", estabelecimentoId)
				.order("ordem", { ascending: true }),

			// Grupos de adicionais com adicionais
			supabase
				.from("grupos_adicionais")
				.select(
					`
					*,
					adicionais (id, nome, preco, ativo, permite_multiplas_unidades)
				`,
				)
				.eq("estabelecimento_id", estabelecimentoId)
				.order("ordem", { ascending: true }),

			// Combos
			supabase
				.from("combos")
				.select("*")
				.eq("estabelecimento_id", estabelecimentoId)
				.order("ordem", { ascending: true }),
		]);

		// Processar categorias (já vem do cache ou da query)
		if (categoriasRes && Array.isArray(categoriasRes)) {
			const processedCategorias = (categoriasRes as Array<Record<string, unknown>>).map((cat) => {
				const produtos_count =
					((cat.produtos as Array<{ count: number }> | undefined)?.[0]?.count as number) ?? 0;
				return {
					...cat,
					produtos_count,
					status_display: (cat.ativo as boolean) ? "Ativa" : "Inativa",
					pode_excluir: produtos_count === 0,
				} as CategoriaComputada;
			});
			categorias.value = processedCategorias;
			categoriasCacheLoaded.value = true;
		}

		// Processar produtos
		if (!produtosRes.error && produtosRes.data) {
			const processedProdutos = produtosRes.data.map(
				(produto: {
					categoria?: { nome: string };
					variacoes?: unknown[];
					ativo: boolean;
					[key: string]: unknown;
				}) => ({
					...produto,
					categoria_nome: produto.categoria?.nome || "Sem categoria",
					variacoes_count: produto.variacoes?.length || 0,
					status_display: produto.ativo ? "Ativo" : "Inativo",
					pode_excluir: true,
				}),
			) as ProdutoComputado[];
			produtos.value = processedProdutos;
			produtosCacheLoaded.value = true;
		}

		// Processar grupos de adicionais
		if (!gruposRes.error && gruposRes.data) {
			const processedGrupos = gruposRes.data.map(
				(grupo: {
					adicionais?: Array<{ ativo: boolean; preco: number }>;
					ativo: boolean;
					obrigatorio: boolean;
					min_selecao: number;
					max_selecao: number;
					[key: string]: unknown;
				}) => {
					const adicionais = grupo.adicionais || [];
					const adicionaisAtivos = adicionais.filter((a) => a.ativo);
					const precos = adicionais.map((a) => a.preco).filter((p) => p > 0);

					return {
						...grupo,
						adicionais,
						adicionais_count: adicionais.length,
						adicionais_ativos_count: adicionaisAtivos.length,
						preco_minimo: precos.length > 0 ? Math.min(...precos) : undefined,
						preco_maximo: precos.length > 0 ? Math.max(...precos) : undefined,
						status_display: grupo.ativo ? "Ativo" : "Inativo",
						obrigatorio_display: grupo.obrigatorio ? "Obrigatório" : "Opcional",
						selecao_display: `Min: ${grupo.min_selecao} | Max: ${grupo.max_selecao}`,
						pode_excluir: adicionais.length === 0,
					} as GrupoAdicionalComputado;
				},
			);
			gruposAdicionais.value = processedGrupos;
			gruposAdicionaisCacheLoaded.value = true;
		}

		// Processar combos
		if (!combosRes.error && combosRes.data) {
			combos.value = combosRes.data as Combo[];
			combosCacheLoaded.value = true;
		}
	} catch (error) {
		console.error("[CardapioCache] Erro ao carregar dados:", error);
	}
});
