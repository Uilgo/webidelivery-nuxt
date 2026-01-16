/**
 * 📌 useCardapioPublico
 *
 * Composable para acessar dados do cardápio público de um estabelecimento.
 * Os dados são carregados pelo plugin server-side (cardapio-publico-cache.server.ts)
 * e ficam disponíveis via useState = carregamento instantâneo no SSR.
 */

import type {
	EstabelecimentoPublico,
	CategoriaPublica,
	ProdutoPublico,
	ComboPublico,
} from "../types/cardapio-publico";

/**
 * Composable principal do cardápio público
 * Consome dados do useState populado pelo plugin server-side
 */
export const useCardapioPublico = (slug: string) => {
	// Estados do plugin server-side (já populados no SSR)
	const estabelecimento = useState<EstabelecimentoPublico | null>(
		`cardapio-publico-estabelecimento-${slug}`,
		() => null,
	);
	const categorias = useState<CategoriaPublica[]>(`cardapio-publico-categorias-${slug}`, () => []);
	const combos = useState<ComboPublico[]>(`cardapio-publico-combos-${slug}`, () => []);
	const cacheLoaded = useState<boolean>(`cardapio-publico-cache-loaded-${slug}`, () => false);
	const cacheError = useState<string | null>(`cardapio-publico-cache-error-${slug}`, () => null);

	// Estado de UI local (não precisa de SSR)
	const categoriaSelecionada = ref<string | null>(null);
	const termoBusca = ref("");

	// Computed: loading baseado no cache
	const loading = computed(() => !cacheLoaded.value);

	// Computed: erro
	const error = computed(() => cacheError.value);

	// Selecionar primeira categoria quando dados carregarem
	watch(
		categorias,
		(cats) => {
			if (cats.length > 0 && !categoriaSelecionada.value) {
				categoriaSelecionada.value = cats[0]?.id ?? null;
			}
		},
		{ immediate: true },
	);

	// Computed: produtos agrupados por categoria
	const produtosPorCategoria = computed(() => {
		const map = new Map<string, ProdutoPublico[]>();
		for (const cat of categorias.value) {
			map.set(cat.id, cat.produtos);
		}
		return map;
	});

	// Computed: produtos filtrados por busca e categoria
	const produtosFiltrados = computed(() => {
		let produtos: ProdutoPublico[] = [];

		if (termoBusca.value.trim()) {
			const termo = termoBusca.value.toLowerCase().trim();
			for (const cat of categorias.value) {
				const filtrados = cat.produtos.filter(
					(p) => p.nome.toLowerCase().includes(termo) || p.descricao?.toLowerCase().includes(termo),
				);
				produtos.push(...filtrados);
			}
		} else if (categoriaSelecionada.value) {
			produtos = produtosPorCategoria.value.get(categoriaSelecionada.value) || [];
		} else {
			for (const cat of categorias.value) {
				produtos.push(...cat.produtos);
			}
		}

		return produtos;
	});

	/**
	 * Função para recarregar dados (client-side)
	 * Útil para atualizar após mudanças no cardápio
	 */
	const refresh = async (): Promise<void> => {
		// No client-side, podemos fazer um refresh manual se necessário
		// Por enquanto, apenas recarrega a página
		if (import.meta.client) {
			window.location.reload();
		}
	};

	return {
		estabelecimento: readonly(estabelecimento),
		categorias: readonly(categorias),
		combos: readonly(combos),
		loading,
		error,
		refresh,
		produtosPorCategoria,
		categoriaSelecionada,
		termoBusca,
		produtosFiltrados,
	};
};
