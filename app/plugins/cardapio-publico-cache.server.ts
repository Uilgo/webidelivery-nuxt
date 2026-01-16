/**
 * 📌 Plugin de Cache do Cardápio Público (Server-side)
 *
 * Busca os dados do cardápio público NO SERVIDOR e popula o useState.
 * Quando o cliente hidrata, os dados já estão disponíveis = carregamento instantâneo.
 *
 * IMPORTANTE: Usa RLS de leitura pública (status = 'ativo').
 */

import type {
	EstabelecimentoPublico,
	CategoriaPublica,
	ProdutoPublico,
	ComboPublico,
	GrupoAdicionalPublico,
} from "~/features/public/cardapio/types/cardapio-publico";

// Tipos auxiliares para as queries
interface GrupoQuery {
	id: string;
	nome: string;
	descricao: string | null;
	min_selecao: number;
	max_selecao: number;
	obrigatorio: boolean;
	adicionais: Array<{
		id: string;
		nome: string;
		preco: string | number;
	}>;
}

/**
 * Converte preço string para number
 */
const parsePreco = (preco: string | number | null | undefined): number => {
	if (preco === null || preco === undefined) return 0;
	if (typeof preco === "number") return preco;
	return parseFloat(preco) || 0;
};

export default defineNuxtPlugin(async (nuxtApp) => {
	// Só executar no server-side
	if (!import.meta.server) return;

	// Pegar o slug da rota atual
	const route = nuxtApp._route;
	const slug = route?.params?.slug as string | undefined;

	// Se não é uma rota de cardápio público, não fazer nada
	if (!slug || typeof slug !== "string") return;

	// Verificar se é uma rota conhecida do sistema (não é cardápio público)
	const rotasConhecidas = ["admin", "login", "signup", "forgot-password", "confirm", "super-admin"];
	if (rotasConhecidas.some((r) => slug.startsWith(r))) return;

	const supabase = useSupabaseClient();

	// Inicializar os estados globais para o cardápio público
	const estabelecimento = useState<EstabelecimentoPublico | null>(
		`cardapio-publico-estabelecimento-${slug}`,
		() => null,
	);
	const categorias = useState<CategoriaPublica[]>(`cardapio-publico-categorias-${slug}`, () => []);
	const combos = useState<ComboPublico[]>(`cardapio-publico-combos-${slug}`, () => []);
	const cacheLoaded = useState<boolean>(`cardapio-publico-cache-loaded-${slug}`, () => false);
	const cacheError = useState<string | null>(`cardapio-publico-cache-error-${slug}`, () => null);

	try {
		// 1. Buscar estabelecimento pelo slug
		const { data: estab, error: estabError } = await supabase
			.from("estabelecimentos")
			.select(
				"id, nome, slug, logo_url, descricao, whatsapp, endereco_rua, endereco_numero, endereco_bairro, endereco_cidade, endereco_estado, status, aberto, config_geral",
			)
			.eq("slug", slug)
			.eq("status", "ativo")
			.single();

		if (estabError || !estab) {
			cacheError.value = "Estabelecimento não encontrado";
			cacheLoaded.value = true;
			return;
		}

		estabelecimento.value = estab as EstabelecimentoPublico;

		// 2. Buscar categorias com produtos e variações
		const { data: cats } = await supabase
			.from("categorias")
			.select(
				`
				id,
				nome,
				descricao,
				imagem_url,
				ordem,
				produtos!inner (
					id,
					nome,
					descricao,
					imagem_url,
					destaque,
					em_promocao,
					categoria_id,
					variacoes:produto_variacoes (
						id,
						nome,
						preco,
						preco_promocional
					)
				)
			`,
			)
			.eq("estabelecimento_id", estab.id)
			.eq("ativo", true)
			.eq("produtos.ativo", true)
			.order("ordem", { ascending: true });

		const catsData = (cats || []) as unknown as Array<{
			id: string;
			nome: string;
			descricao: string | null;
			imagem_url: string | null;
			ordem: number;
			produtos: Array<{
				id: string;
				nome: string;
				descricao: string | null;
				imagem_url: string | null;
				destaque: boolean;
				em_promocao: boolean;
				categoria_id: string;
				variacoes: Array<{
					id: string;
					nome: string;
					preco: string | number;
					preco_promocional: string | number | null;
				}>;
			}>;
		}>;

		// Coletar todos os IDs de produtos
		const todosProdutoIds: string[] = [];
		for (const cat of catsData) {
			for (const prod of cat.produtos || []) {
				todosProdutoIds.push(prod.id);
			}
		}

		// 3. Buscar TODOS os grupos de adicionais de uma vez
		const gruposPorProduto = new Map<string, GrupoAdicionalPublico[]>();

		if (todosProdutoIds.length > 0) {
			const { data: todosGrupos } = await supabase
				.from("produto_grupos_adicionais")
				.select(
					`
					produto_id,
					grupo:grupos_adicionais (
						id,
						nome,
						descricao,
						min_selecao,
						max_selecao,
						obrigatorio,
						adicionais (
							id,
							nome,
							preco
						)
					)
				`,
				)
				.in("produto_id", todosProdutoIds);

			for (const item of todosGrupos || []) {
				const produtoId = item.produto_id as string;
				const grupo = item.grupo as unknown as GrupoQuery | null;

				if (!grupo) continue;

				const grupoProcessado: GrupoAdicionalPublico = {
					id: grupo.id,
					nome: grupo.nome,
					descricao: grupo.descricao,
					min_selecao: grupo.min_selecao,
					max_selecao: grupo.max_selecao,
					obrigatorio: grupo.obrigatorio,
					adicionais: (grupo.adicionais || []).map((a) => ({
						id: a.id,
						nome: a.nome,
						preco: parsePreco(a.preco),
					})),
				};

				const existentes = gruposPorProduto.get(produtoId) || [];
				existentes.push(grupoProcessado);
				gruposPorProduto.set(produtoId, existentes);
			}
		}

		// Processar categorias e produtos
		const categoriasProcessadas: CategoriaPublica[] = [];

		for (const cat of catsData) {
			const produtosRaw = cat.produtos || [];

			if (produtosRaw.length > 0) {
				const produtosProcessados: ProdutoPublico[] = produtosRaw.map((produtoRaw) => ({
					id: produtoRaw.id,
					nome: produtoRaw.nome,
					descricao: produtoRaw.descricao,
					imagem_url: produtoRaw.imagem_url,
					destaque: produtoRaw.destaque,
					em_promocao: produtoRaw.em_promocao,
					categoria_id: produtoRaw.categoria_id,
					variacoes: (produtoRaw.variacoes || []).map((v) => ({
						id: v.id,
						nome: v.nome,
						preco: parsePreco(v.preco),
						preco_promocional: v.preco_promocional ? parsePreco(v.preco_promocional) : null,
					})),
					grupos_adicionais: gruposPorProduto.get(produtoRaw.id) || [],
				}));

				categoriasProcessadas.push({
					id: cat.id,
					nome: cat.nome,
					descricao: cat.descricao,
					imagem_url: cat.imagem_url,
					ordem: cat.ordem,
					produtos: produtosProcessados,
				});
			}
		}

		categorias.value = categoriasProcessadas;

		// 4. Buscar combos ativos
		const { data: combosData } = await supabase
			.from("combos")
			.select(
				`
				id,
				nome,
				descricao,
				imagem_url,
				preco_combo,
				preco_original,
				destaque,
				combo_produtos (
					produto_id,
					quantidade,
					produto:produtos (
						nome
					)
				)
			`,
			)
			.eq("estabelecimento_id", estab.id)
			.eq("ativo", true)
			.order("ordem", { ascending: true });

		const combosRaw = (combosData || []) as unknown as Array<{
			id: string;
			nome: string;
			descricao: string | null;
			imagem_url: string | null;
			preco_combo: string | number;
			preco_original: string | number;
			destaque: boolean;
			combo_produtos: Array<{
				produto_id: string;
				quantidade: number;
				produto: { nome: string } | null;
			}>;
		}>;

		combos.value = combosRaw.map((combo) => ({
			id: combo.id,
			nome: combo.nome,
			descricao: combo.descricao,
			imagem_url: combo.imagem_url,
			preco_combo: parsePreco(combo.preco_combo),
			preco_original: parsePreco(combo.preco_original),
			destaque: combo.destaque,
			produtos: (combo.combo_produtos || []).map((cp) => ({
				produto_id: cp.produto_id,
				produto_nome: cp.produto?.nome || "Produto",
				quantidade: cp.quantidade,
			})),
		}));

		cacheLoaded.value = true;
	} catch (error) {
		console.error("[CardapioPublicoCache] Erro ao carregar dados:", error);
		cacheError.value = "Erro ao carregar cardápio";
		cacheLoaded.value = true;
	}
});
