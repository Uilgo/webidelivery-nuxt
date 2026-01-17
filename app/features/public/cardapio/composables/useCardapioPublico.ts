/**
 * 📌 useCardapioPublico
 *
 * Composable para gerenciar dados do cardápio público.
 * Carrega estabelecimento, ofertas, destaques e produtos com paginação.
 */

import type {
	Estabelecimento,
	CategoriaPublica,
	ProdutoPublico,
} from "~/features/public/cardapio/types/cardapio-publico";

export const useCardapioPublico = (slug: string) => {
	// Estados
	const estabelecimento = useState<Estabelecimento | null>("cardapio-estabelecimento", () => null);
	const categorias = useState<CategoriaPublica[]>("cardapio-categorias", () => []);
	const ofertas = useState<ProdutoPublico[]>("cardapio-ofertas", () => []);
	const destaques = useState<ProdutoPublico[]>("cardapio-destaques", () => []);
	const produtos = useState<ProdutoPublico[]>("cardapio-produtos", () => []);

	const loading = ref(false);
	const error = ref<string | null>(null);

	// Paginação
	const page = ref(1);
	const limit = 20;
	const hasMore = ref(true);

	/**
	 * Carrega dados iniciais
	 * Se não existirem (client-side), busca do Supabase
	 */
	const carregarDadosIniciais = async () => {
		// Se já tem dados (SSR), apenas carrega produtos paginados
		if (estabelecimento.value) {
			if (produtos.value.length === 0) {
				await carregarProdutos();
			}
			return;
		}

		// Se não tem dados (client-side), busca tudo
		try {
			loading.value = true;
			const supabase = useSupabaseClient();

			// 1. Busca estabelecimento
			const { data: estabelecimentoData, error: estabelecimentoError } = await supabase
				.from("estabelecimentos")
				.select("id, nome, slug, logo_url, capa_url, descricao, whatsapp, aberto, config_geral")
				.eq("slug", slug)
				.eq("status", "ativo")
				.single();

			if (estabelecimentoError || !estabelecimentoData) {
				error.value = "Estabelecimento não encontrado";
				return;
			}

			const configGeral = estabelecimentoData.config_geral as Record<string, unknown> | null;
			estabelecimento.value = {
				id: estabelecimentoData.id,
				nome: estabelecimentoData.nome,
				slug: estabelecimentoData.slug,
				logo: estabelecimentoData.logo_url,
				capa: estabelecimentoData.capa_url,
				descricao: estabelecimentoData.descricao,
				whatsapp: estabelecimentoData.whatsapp,
				tempo_entrega_min: (configGeral?.tempo_entrega_min as number) ?? 20,
				tempo_entrega_max: (configGeral?.tempo_entrega_max as number) ?? 40,
				entrega_gratis_acima: (configGeral?.valor_minimo_pedido as number) ?? null,
				aberto: estabelecimentoData.aberto,
			};

			// 2. Busca categorias
			const { data: categoriasData } = await supabase
				.from("categorias")
				.select("id, nome, descricao, imagem_url, ordem, categoria_pai_id")
				.eq("estabelecimento_id", estabelecimentoData.id)
				.eq("ativo", true)
				.order("ordem", { ascending: true });

			categorias.value = (categoriasData ?? []).map((cat) => ({
				...cat,
				produtos: [],
			}));

			// 3. Busca ofertas
			const { data: ofertasData } = await supabase
				.from("produtos")
				.select(
					`
					id, nome, descricao, imagem_url, destaque, em_promocao, categoria_id,
					produto_variacoes (id, nome, preco, preco_promocional)
				`,
				)
				.eq("estabelecimento_id", estabelecimentoData.id)
				.eq("ativo", true)
				.eq("em_promocao", true)
				.order("ordem", { ascending: true })
				.limit(8);

			ofertas.value = (ofertasData ?? []).map((produto) => ({
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

			// 4. Busca destaques
			const { data: destaquesData } = await supabase
				.from("produtos")
				.select(
					`
					id, nome, descricao, imagem_url, destaque, em_promocao, categoria_id,
					produto_variacoes (id, nome, preco, preco_promocional)
				`,
				)
				.eq("estabelecimento_id", estabelecimentoData.id)
				.eq("ativo", true)
				.eq("destaque", true)
				.order("total_vendas", { ascending: false })
				.limit(9);

			destaques.value = (destaquesData ?? []).map((produto) => ({
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

			// 5. Carrega primeira página de produtos
			await carregarProdutos();
		} catch (err) {
			error.value = "Erro ao carregar cardápio";
			console.error(err);
		} finally {
			loading.value = false;
		}
	};

	/**
	 * Carrega produtos paginados
	 */
	const carregarProdutos = async () => {
		if (loading.value || !hasMore.value || !estabelecimento.value) return;

		try {
			loading.value = true;
			error.value = null;

			const supabase = useSupabaseClient();
			const offset = (page.value - 1) * limit;

			// Busca produtos paginados
			const { data: produtosData, error: produtosError } = await supabase
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
				.eq("estabelecimento_id", estabelecimento.value.id)
				.eq("ativo", true)
				.order("ordem", { ascending: true })
				.range(offset, offset + limit - 1);

			if (produtosError) {
				throw produtosError;
			}

			const novosProdutos = (produtosData ?? []).map((produto) => ({
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

			// Se retornou menos que o limite, não há mais produtos
			if (novosProdutos.length < limit) {
				hasMore.value = false;
			}

			produtos.value = [...produtos.value, ...novosProdutos];
			page.value++;
		} catch (err) {
			error.value = "Erro ao carregar produtos";
			console.error(err);
		} finally {
			loading.value = false;
		}
	};

	/**
	 * Carrega mais produtos (infinite scroll)
	 */
	const loadMore = async () => {
		await carregarProdutos();
	};

	// Carrega dados iniciais APENAS se não existirem (evita recarregar no cliente)
	const initialized = ref(false);

	if (import.meta.client) {
		onMounted(() => {
			// Só carrega se não tiver dados (não veio do SSR)
			if (!estabelecimento.value && !initialized.value) {
				initialized.value = true;
				carregarDadosIniciais();
			}
		});
	} else {
		// No servidor, nunca executa (plugin já carrega)
		// Não faz nada
	}

	return {
		estabelecimento: readonly(estabelecimento),
		categorias: readonly(categorias),
		ofertas: readonly(ofertas),
		destaques: readonly(destaques),
		produtos: readonly(produtos),
		loading: readonly(loading),
		error: readonly(error),
		hasMore: readonly(hasMore),
		loadMore,
	};
};
