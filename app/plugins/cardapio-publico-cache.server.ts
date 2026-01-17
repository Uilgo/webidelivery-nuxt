/**
 * 📌 Plugin de Cache do Cardápio Público (Server-Side)
 *
 * Carrega dados do cardápio no servidor e popula o useState.
 * Isso garante que os dados estejam disponíveis imediatamente no cliente (SSR).
 *
 * Dados carregados:
 * - Estabelecimento
 * - Categorias
 * - Ofertas (produtos em promoção)
 * - Destaques (produtos em destaque)
 */

export default defineNuxtPlugin(async (_nuxtApp) => {
	// Só executa no servidor
	if (import.meta.client) return;

	// Pega o slug da rota
	const route = useRoute();
	const slug = route.params.slug as string;

	if (!slug) return;

	try {
		const supabase = useSupabaseClient();

		// 1. Busca estabelecimento pelo slug
		const { data: estabelecimentoData, error: estabelecimentoError } = await supabase
			.from("estabelecimentos")
			.select("id, nome, slug, logo_url, capa_url, descricao, whatsapp, aberto, config_geral")
			.eq("slug", slug)
			.eq("status", "ativo")
			.single();

		if (estabelecimentoError || !estabelecimentoData) {
			console.error("Estabelecimento não encontrado:", estabelecimentoError);
			return;
		}

		// Extrai configurações
		const configGeral = estabelecimentoData.config_geral as Record<string, unknown> | null;
		const tempoEntregaMin = (configGeral?.tempo_entrega_min as number) ?? 20;
		const tempoEntregaMax = (configGeral?.tempo_entrega_max as number) ?? 40;
		const entregaGratisAcima = (configGeral?.valor_minimo_pedido as number) ?? null;

		// Monta objeto do estabelecimento
		const estabelecimento = {
			id: estabelecimentoData.id,
			nome: estabelecimentoData.nome,
			slug: estabelecimentoData.slug,
			logo: estabelecimentoData.logo_url,
			capa: estabelecimentoData.capa_url,
			descricao: estabelecimentoData.descricao,
			whatsapp: estabelecimentoData.whatsapp,
			tempo_entrega_min: tempoEntregaMin,
			tempo_entrega_max: tempoEntregaMax,
			entrega_gratis_acima: entregaGratisAcima,
			aberto: estabelecimentoData.aberto,
		};

		// 2. Busca categorias ativas
		const { data: categoriasData } = await supabase
			.from("categorias")
			.select("id, nome, descricao, imagem_url, ordem, categoria_pai_id")
			.eq("estabelecimento_id", estabelecimentoData.id)
			.eq("ativo", true)
			.order("ordem", { ascending: true });

		const categorias = (categoriasData ?? []).map((cat) => ({
			...cat,
			produtos: [],
		}));

		// 3. Busca produtos em promoção (ofertas) - limite 8
		const { data: ofertasData } = await supabase
			.from("produtos")
			.select(
				`
				id,
				nome,
				descricao,
				imagem_url,
				destaque,
				em_promocao,
				categoria_id,
				produto_variacoes (
					id,
					nome,
					preco,
					preco_promocional
				)
			`,
			)
			.eq("estabelecimento_id", estabelecimentoData.id)
			.eq("ativo", true)
			.eq("em_promocao", true)
			.order("ordem", { ascending: true })
			.limit(8);

		const ofertas = (ofertasData ?? []).map((produto) => ({
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

		// 4. Busca produtos em destaque - limite 9
		const { data: destaquesData } = await supabase
			.from("produtos")
			.select(
				`
				id,
				nome,
				descricao,
				imagem_url,
				destaque,
				em_promocao,
				categoria_id,
				produto_variacoes (
					id,
					nome,
					preco,
					preco_promocional
				)
			`,
			)
			.eq("estabelecimento_id", estabelecimentoData.id)
			.eq("ativo", true)
			.eq("destaque", true)
			.order("total_vendas", { ascending: false })
			.limit(9);

		const destaques = (destaquesData ?? []).map((produto) => ({
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

		// Popula os estados
		const estabelecimentoState = useState("cardapio-estabelecimento");
		const categoriasState = useState("cardapio-categorias");
		const ofertasState = useState("cardapio-ofertas");
		const destaquesState = useState("cardapio-destaques");
		const produtosState = useState("cardapio-produtos");

		estabelecimentoState.value = estabelecimento;
		categoriasState.value = categorias;
		ofertasState.value = ofertas;
		destaquesState.value = destaques;

		// 5. Busca primeira página de produtos (20 itens) para SSR
		const { data: produtosData } = await supabase
			.from("produtos")
			.select(
				`
				id,
				nome,
				descricao,
				imagem_url,
				destaque,
				em_promocao,
				categoria_id,
				produto_variacoes (
					id,
					nome,
					preco,
					preco_promocional
				)
			`,
			)
			.eq("estabelecimento_id", estabelecimentoData.id)
			.eq("ativo", true)
			.order("ordem", { ascending: true })
			.range(0, 19);

		produtosState.value = (produtosData ?? []).map((produto) => ({
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
	} catch (err) {
		console.error("Erro ao carregar cardápio:", err);
	}
});
