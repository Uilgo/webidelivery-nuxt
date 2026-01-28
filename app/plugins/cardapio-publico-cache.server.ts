/**
 * 📌 Plugin: Cardápio Público Cache (Server-side)
 *
 * Carrega dados do cardápio público NO SERVIDOR para carregamento instantâneo.
 * Este é o plugin MAIS CRÍTICO pois afeta a experiência do cliente final.
 *
 * ⚡ OTIMIZAÇÕES:
 * - Cache com TTL de 2 minutos (cardápio muda frequentemente)
 * - Query única com JOINs para reduzir latência
 * - Carrega apenas dados essenciais (sem paginação no SSR)
 * - Suporta múltiplos estabelecimentos via slug
 *
 * IMPORTANTE: Dados são públicos, não requerem autenticação.
 */

import { createCacheWithTTL } from "~/lib/utils/cache";
import type {
	Estabelecimento,
	CategoriaPublica,
	ProdutoPublico,
} from "~/features/public/cardapio/types/cardapio-publico";

export default defineNuxtPlugin(async () => {
	// Só executar no server-side
	if (!import.meta.server) return;

	// Só carregar em rotas de cardápio público (/{slug})
	const route = useRoute();
	const path = route.path;

	// Ignorar rotas que não são de cardápio público
	if (
		path === "/" ||
		path.startsWith("/admin") ||
		path.startsWith("/super-admin") ||
		path.startsWith("/login") ||
		path.startsWith("/signup") ||
		path.startsWith("/forgot-password") ||
		path.startsWith("/confirm")
	) {
		return;
	}

	// Extrair slug da URL (/{slug} ou /{slug}/checkout)
	const slug = route.params.slug as string;

	// Se não tem slug, não é rota de cardápio
	if (!slug || typeof slug !== "string" || slug.length === 0) {
		return;
	}

	const supabase = useSupabaseClient();

	// Inicializar estados globais
	const estabelecimento = useState<Estabelecimento | null>("cardapio-estabelecimento", () => null);
	const categorias = useState<CategoriaPublica[]>("cardapio-categorias", () => []);
	const ofertas = useState<ProdutoPublico[]>("cardapio-ofertas", () => []);
	const destaques = useState<ProdutoPublico[]>("cardapio-destaques", () => []);
	const produtos = useState<ProdutoPublico[]>("cardapio-produtos", () => []);

	try {
		// ⚡ Cache por estabelecimento (TTL: 2 minutos)
		const estabelecimentoCache = createCacheWithTTL<Estabelecimento>(
			`cardapio-pub-estab-${slug}`,
			2 * 60 * 1000, // 2 minutos
		);

		const categoriasCache = createCacheWithTTL<CategoriaPublica[]>(
			`cardapio-pub-cats-${slug}`,
			2 * 60 * 1000,
		);

		const ofertasCache = createCacheWithTTL<ProdutoPublico[]>(
			`cardapio-pub-ofertas-${slug}`,
			2 * 60 * 1000,
		);

		const destaquesCache = createCacheWithTTL<ProdutoPublico[]>(
			`cardapio-pub-destaques-${slug}`,
			2 * 60 * 1000,
		);

		const produtosCache = createCacheWithTTL<ProdutoPublico[]>(
			`cardapio-pub-produtos-${slug}`,
			2 * 60 * 1000,
		);

		// Buscar todos os dados em paralelo com cache
		const [estabelecimentoData, categoriasData, ofertasData, destaquesData, produtosData] =
			await Promise.all([
				// 1. Estabelecimento
				estabelecimentoCache.get(async () => {
					const { data, error } = await supabase
						.from("estabelecimentos")
						.select(
							"id, nome, slug, logo_url, capa_url, descricao, whatsapp, aberto, config_geral, config_tema",
						)
						.eq("slug", slug)
						.eq("status", "ativo")
						.single();

					if (error || !data) {
						throw new Error("Estabelecimento não encontrado");
					}

					const configGeral = data.config_geral as Record<string, unknown> | null;
					const configTema = data.config_tema as Record<string, unknown> | null;

					return {
						id: data.id,
						nome: data.nome,
						slug: data.slug,
						logo: data.logo_url,
						capa: data.capa_url,
						descricao: data.descricao,
						whatsapp: data.whatsapp,
						tempo_entrega_min: (configGeral?.tempo_entrega_min as number) ?? 20,
						tempo_entrega_max: (configGeral?.tempo_entrega_max as number) ?? 40,
						entrega_gratis_acima: (configGeral?.valor_minimo_pedido as number) ?? null,
						aberto: data.aberto,
						config_tema: configTema,
					};
				}),

				// 2. Categorias
				categoriasCache.get(async () => {
					// Primeiro buscar estabelecimento para pegar o ID
					const { data: estab } = await supabase
						.from("estabelecimentos")
						.select("id")
						.eq("slug", slug)
						.single();

					if (!estab) return [];

					const { data } = await supabase
						.from("categorias")
						.select("id, nome, descricao, imagem_url, ordem, categoria_pai_id")
						.eq("estabelecimento_id", estab.id)
						.eq("ativo", true)
						.order("ordem", { ascending: true });

					return (data ?? []).map((cat) => ({
						...cat,
						produtos: [],
					}));
				}),

				// 3. Ofertas (produtos em promoção)
				ofertasCache.get(async () => {
					const { data: estab } = await supabase
						.from("estabelecimentos")
						.select("id")
						.eq("slug", slug)
						.single();

					if (!estab) return [];

					const { data } = await supabase
						.from("produtos")
						.select(
							`
						id, nome, descricao, imagem_url, destaque, em_promocao, categoria_id,
						produto_variacoes (id, nome, preco, preco_promocional)
					`,
						)
						.eq("estabelecimento_id", estab.id)
						.eq("ativo", true)
						.eq("em_promocao", true)
						.order("ordem", { ascending: true })
						.limit(8);

					return (data ?? []).map((produto) => ({
						id: produto.id,
						nome: produto.nome,
						descricao: produto.descricao,
						imagem_url: produto.imagem_url,
						destaque: produto.destaque,
						em_promocao: produto.em_promocao,
						categoria_id: produto.categoria_id,
						variacoes: ((produto.produto_variacoes as unknown[]) ?? []).map((v) => {
							const variacao = v as Record<string, unknown>;
							return {
								id: variacao.id as string,
								nome: variacao.nome as string,
								preco: parseFloat(variacao.preco as string),
								preco_promocional: variacao.preco_promocional
									? parseFloat(variacao.preco_promocional as string)
									: null,
							};
						}),
						grupos_adicionais: [],
					}));
				}),

				// 4. Destaques (produtos mais vendidos)
				destaquesCache.get(async () => {
					const { data: estab } = await supabase
						.from("estabelecimentos")
						.select("id")
						.eq("slug", slug)
						.single();

					if (!estab) return [];

					const { data } = await supabase
						.from("produtos")
						.select(
							`
						id, nome, descricao, imagem_url, destaque, em_promocao, categoria_id,
						produto_variacoes (id, nome, preco, preco_promocional)
					`,
						)
						.eq("estabelecimento_id", estab.id)
						.eq("ativo", true)
						.eq("destaque", true)
						.order("total_vendas", { ascending: false })
						.limit(9);

					return (data ?? []).map((produto) => ({
						id: produto.id,
						nome: produto.nome,
						descricao: produto.descricao,
						imagem_url: produto.imagem_url,
						destaque: produto.destaque,
						em_promocao: produto.em_promocao,
						categoria_id: produto.categoria_id,
						variacoes: ((produto.produto_variacoes as unknown[]) ?? []).map((v) => {
							const variacao = v as Record<string, unknown>;
							return {
								id: variacao.id as string,
								nome: variacao.nome as string,
								preco: parseFloat(variacao.preco as string),
								preco_promocional: variacao.preco_promocional
									? parseFloat(variacao.preco_promocional as string)
									: null,
							};
						}),
						grupos_adicionais: [],
					}));
				}),

				// 5. Produtos (primeira página - 20 itens)
				produtosCache.get(async () => {
					const { data: estab } = await supabase
						.from("estabelecimentos")
						.select("id")
						.eq("slug", slug)
						.single();

					if (!estab) return [];

					const { data } = await supabase
						.from("produtos")
						.select(
							`
						id, nome, descricao, imagem_url, destaque, em_promocao, categoria_id,
						produto_variacoes (id, nome, preco, preco_promocional)
					`,
						)
						.eq("estabelecimento_id", estab.id)
						.eq("ativo", true)
						.order("ordem", { ascending: true })
						.limit(20); // Primeira página

					return (data ?? []).map((produto) => ({
						id: produto.id,
						nome: produto.nome,
						descricao: produto.descricao,
						imagem_url: produto.imagem_url,
						destaque: produto.destaque,
						em_promocao: produto.em_promocao,
						categoria_id: produto.categoria_id,
						variacoes: ((produto.produto_variacoes as unknown[]) ?? []).map((v) => {
							const variacao = v as Record<string, unknown>;
							return {
								id: variacao.id as string,
								nome: variacao.nome as string,
								preco: parseFloat(variacao.preco as string),
								preco_promocional: variacao.preco_promocional
									? parseFloat(variacao.preco_promocional as string)
									: null,
							};
						}),
						grupos_adicionais: [],
					}));
				}),
			]);

		// Atualizar estados
		estabelecimento.value = estabelecimentoData;
		categorias.value = categoriasData;
		ofertas.value = ofertasData;
		destaques.value = destaquesData;
		produtos.value = produtosData;
	} catch (error) {
		console.error("[CardapioPublicoCache] Erro ao carregar dados:", error);
		// Em caso de erro, deixa os estados vazios
		// O composable vai tentar carregar no client-side
	}
});
