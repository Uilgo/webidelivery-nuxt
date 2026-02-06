/**
 * 📌 useCardapio - Composable Orquestrador Global do Cardápio
 *
 * Gerencia estado global do módulo de cardápio:
 * - Navegação entre abas
 * - Modo de visualização (card/list)
 * - Filtros, busca e ordenação por aba
 * - Contadores das tabs
 * - Sincronização com URL e cookies
 */

/** Tipos das abas disponíveis */
export type CardapioTab = "categorias" | "produtos" | "adicionais" | "combos";

/** Tipo do modo de visualização */
export type CardapioViewMode = "card" | "list";

/** Interface de retorno do composable */
export interface UseCardapioReturn {
	// Estado das abas
	activeTab: Ref<CardapioTab>;
	tabCounts: ComputedRef<{
		categoriasCount: number;
		produtosCount: number;
		adicionaisCount: number;
		combosCount: number;
	}>;

	// Modo de visualização
	viewMode: Ref<CardapioViewMode>;

	// Estados de loading
	loadingStates: Ref<Record<CardapioTab, boolean>>;
	currentLoading: ComputedRef<boolean>;

	// Dados por aba
	tabData: Ref<Record<CardapioTab, unknown[]>>;
	currentHasData: ComputedRef<boolean>;

	// Filtros por aba
	searchValues: Ref<Record<CardapioTab, string>>;
	sortValues: Ref<Record<CardapioTab, string>>;
	filterValues: Ref<Record<CardapioTab, Record<string, unknown>>>;
	currentSearchValue: ComputedRef<string>;
	currentSortValue: ComputedRef<string>;
	currentFilters: ComputedRef<Record<string, unknown>>;

	// Handlers
	handleTabChange: (tab: string) => void;
	handleViewModeChange: (mode: CardapioViewMode) => void;
	handleSearch: (value: string) => void;
	handleSort: (value: string) => void;
	handleFilter: (filters: Record<string, unknown>) => void;
	handleRefresh: () => void;
	handleCreate: () => void;

	// Métodos para atualizar dados (usados pelos composables filhos)
	setTabData: (tab: CardapioTab, data: unknown[]) => void;
	setTabLoading: (tab: CardapioTab, loading: boolean) => void;
}

export const useCardapio = (): UseCardapioReturn => {
	const route = useRoute();
	const router = useRouter();

	// ========================================
	// COOKIES PARA PERSISTÊNCIA
	// ========================================

	const lastTabCookie = useCookie<CardapioTab>("cardapio-last-tab", {
		default: () => "categorias",
		maxAge: 60 * 60 * 24 * 30, // 30 dias
	});

	const viewModeCookie = useCookie<CardapioViewMode>("cardapio-view-mode", {
		default: () => "card",
		maxAge: 60 * 60 * 24 * 30, // 30 dias
	});

	// ========================================
	// ESTADO DAS ABAS
	// ========================================

	/**
	 * Determina a aba inicial baseado na URL ou cookie
	 */
	const getInitialTab = (): CardapioTab => {
		const queryTab = route.query.tab as string;
		const validTabs: CardapioTab[] = ["categorias", "produtos", "adicionais", "combos"];

		if (queryTab && validTabs.includes(queryTab as CardapioTab)) {
			return queryTab as CardapioTab;
		}

		return lastTabCookie.value;
	};

	const activeTab = ref<CardapioTab>(getInitialTab());
	const viewMode = ref<CardapioViewMode>(viewModeCookie.value);

	// ========================================
	// ESTADOS DE LOADING E DADOS
	// ========================================

	const loadingStates = ref<Record<CardapioTab, boolean>>({
		categorias: false,
		produtos: false,
		adicionais: false,
		combos: false,
	});

	const tabData = ref<Record<CardapioTab, unknown[]>>({
		categorias: [],
		produtos: [],
		adicionais: [],
		combos: [],
	});

	// ========================================
	// ESTADOS DE FILTROS
	// ========================================

	const searchValues = ref<Record<CardapioTab, string>>({
		categorias: "",
		produtos: "",
		adicionais: "",
		combos: "",
	});

	const sortValues = ref<Record<CardapioTab, string>>({
		categorias: "",
		produtos: "",
		adicionais: "",
		combos: "",
	});

	const filterValues = ref<Record<CardapioTab, Record<string, unknown>>>({
		categorias: {},
		produtos: {},
		adicionais: {},
		combos: {},
	});

	// ========================================
	// COMPUTADAS
	// ========================================

	const tabCounts = computed(() => ({
		categoriasCount: tabData.value.categorias.length,
		produtosCount: tabData.value.produtos.length,
		adicionaisCount: tabData.value.adicionais.length,
		combosCount: tabData.value.combos.length,
	}));

	const currentLoading = computed(() => loadingStates.value[activeTab.value]);
	const currentHasData = computed(() => tabData.value[activeTab.value].length > 0);
	const currentSearchValue = computed(() => searchValues.value[activeTab.value]);
	const currentSortValue = computed(() => sortValues.value[activeTab.value]);
	const currentFilters = computed(() => filterValues.value[activeTab.value]);

	// ========================================
	// HANDLERS
	// ========================================

	/**
	 * Handler para mudança de aba
	 */
	const handleTabChange = (tab: string): void => {
		const newTab = tab as CardapioTab;
		activeTab.value = newTab;
		lastTabCookie.value = newTab;

		router.push({
			query: {
				...route.query,
				tab: newTab,
			},
		});
	};

	/**
	 * Handler para mudança de modo de visualização
	 */
	const handleViewModeChange = (mode: CardapioViewMode): void => {
		viewMode.value = mode;
		viewModeCookie.value = mode;
	};

	/**
	 * Handler para busca
	 */
	const handleSearch = (value: string): void => {
		searchValues.value[activeTab.value] = value;
	};

	/**
	 * Handler para ordenação
	 */
	const handleSort = (value: string): void => {
		sortValues.value[activeTab.value] = value;
	};

	/**
	 * Handler para filtros
	 */
	const handleFilter = (filters: Record<string, unknown>): void => {
		filterValues.value[activeTab.value] = filters;
	};

	/**
	 * Handler para refresh - será sobrescrito pelos composables filhos
	 */
	const handleRefresh = (): void => {
		// Implementado pelos composables específicos (useCategorias, useProdutos, etc)
	};

	/**
	 * Handler para criar - será sobrescrito pelos composables filhos
	 */
	const handleCreate = (): void => {
		// Implementado pelos composables específicos
	};

	// ========================================
	// MÉTODOS PARA COMPOSABLES FILHOS
	// ========================================

	/**
	 * Atualiza dados de uma aba específica
	 */
	const setTabData = (tab: CardapioTab, data: unknown[]): void => {
		tabData.value[tab] = data;
	};

	/**
	 * Atualiza estado de loading de uma aba específica
	 */
	const setTabLoading = (tab: CardapioTab, loading: boolean): void => {
		loadingStates.value[tab] = loading;
	};

	// ========================================
	// SINCRONIZAÇÃO COM URL
	// ========================================

	// Forçar parâmetro tab na URL se não existir
	if (import.meta.client && !route.query.tab) {
		router.replace({
			query: {
				...route.query,
				tab: activeTab.value,
			},
		});
	}

	// Watch para sincronizar aba ativa com mudanças na URL
	watch(
		() => route.query.tab,
		(newTab) => {
			const validTabs: CardapioTab[] = ["categorias", "produtos", "adicionais", "combos"];
			const validTab = validTabs.includes(newTab as CardapioTab)
				? (newTab as CardapioTab)
				: "categorias";

			if (activeTab.value !== validTab) {
				activeTab.value = validTab;
			}
		},
	);

	// ========================================
	// RETORNO
	// ========================================

	return {
		// Estado das abas
		activeTab,
		tabCounts,

		// Modo de visualização
		viewMode,

		// Estados de loading
		loadingStates,
		currentLoading,

		// Dados por aba
		tabData,
		currentHasData,

		// Filtros por aba
		searchValues,
		sortValues,
		filterValues,
		currentSearchValue,
		currentSortValue,
		currentFilters,

		// Handlers
		handleTabChange,
		handleViewModeChange,
		handleSearch,
		handleSort,
		handleFilter,
		handleRefresh,
		handleCreate,

		// Métodos para composables filhos
		setTabData,
		setTabLoading,
	};
};
