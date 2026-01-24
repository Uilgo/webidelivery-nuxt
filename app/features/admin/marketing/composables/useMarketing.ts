/**
 * 📌 useMarketing - Composable Orquestrador Global do Marketing
 *
 * Gerencia estado global do módulo de marketing:
 * - Navegação entre abas (cupons, banners, promoções)
 * - Filtros, busca e ordenação por aba
 * - Contadores das tabs
 * - Sincronização com URL e cookies
 */

import type { MarketingTab, MarketingViewMode } from "../types/marketing";

/** Interface de retorno do composable */
export interface UseMarketingReturn {
	// Estado das abas
	activeTab: Ref<MarketingTab>;
	tabCounts: ComputedRef<{
		cuponsCount: number;
		bannersCount: number;
	}>;

	// Modo de visualização
	viewMode: Ref<MarketingViewMode>;

	// Estados de loading
	loadingStates: Ref<Record<MarketingTab, boolean>>;
	currentLoading: ComputedRef<boolean>;

	// Dados por aba
	tabData: Ref<Record<MarketingTab, unknown[]>>;
	currentHasData: ComputedRef<boolean>;

	// Filtros por aba
	searchValues: Ref<Record<MarketingTab, string>>;
	sortValues: Ref<Record<MarketingTab, string>>;
	filterValues: Ref<Record<MarketingTab, Record<string, unknown>>>;
	currentSearchValue: ComputedRef<string>;
	currentSortValue: ComputedRef<string>;
	currentFilters: ComputedRef<Record<string, unknown>>;

	// Handlers
	handleTabChange: (tab: string) => void;
	handleViewModeChange: (mode: MarketingViewMode) => void;
	handleSearch: (value: string) => void;
	handleSort: (value: string) => void;
	handleFilter: (filters: Record<string, unknown>) => void;
	handleRefresh: () => void;
	handleCreate: () => void;

	// Métodos para atualizar dados (usados pelos composables filhos)
	setTabData: (tab: MarketingTab, data: unknown[]) => void;
	setTabLoading: (tab: MarketingTab, loading: boolean) => void;
}

export const useMarketing = (): UseMarketingReturn => {
	const route = useRoute();
	const router = useRouter();

	// ========================================
	// COOKIES PARA PERSISTÊNCIA
	// ========================================

	const lastTabCookie = useCookie<MarketingTab>("marketing-last-tab", {
		default: () => "cupons",
		maxAge: 60 * 60 * 24 * 30, // 30 dias
	});

	const viewModeCookie = useCookie<MarketingViewMode>("marketing-view-mode", {
		default: () => "card",
		maxAge: 60 * 60 * 24 * 30, // 30 dias
	});

	// ========================================
	// ESTADO DAS ABAS
	// ========================================

	/**
	 * Determina a aba inicial baseado na URL ou cookie
	 */
	const getInitialTab = (): MarketingTab => {
		const queryTab = route.query.tab as string;
		const validTabs: MarketingTab[] = ["cupons", "banners"];

		if (queryTab && validTabs.includes(queryTab as MarketingTab)) {
			return queryTab as MarketingTab;
		}

		return lastTabCookie.value;
	};

	const activeTab = ref<MarketingTab>(getInitialTab());
	const viewMode = ref<MarketingViewMode>(viewModeCookie.value);

	// ========================================
	// ESTADOS DE LOADING E DADOS (compartilhados globalmente)
	// ========================================

	const loadingStates = useState<Record<MarketingTab, boolean>>("marketing-loading-states", () => ({
		cupons: false,
		banners: false,
	}));

	const tabData = useState<Record<MarketingTab, unknown[]>>("marketing-tab-data", () => ({
		cupons: [],
		banners: [],
	}));

	// ========================================
	// ESTADOS DE FILTROS
	// ========================================

	const searchValues = ref<Record<MarketingTab, string>>({
		cupons: "",
		banners: "",
	});

	const sortValues = ref<Record<MarketingTab, string>>({
		cupons: "created_at",
		banners: "ordem",
	});

	const filterValues = ref<Record<MarketingTab, Record<string, unknown>>>({
		cupons: {},
		banners: {},
	});

	// ========================================
	// COMPUTADAS
	// ========================================

	const tabCounts = computed(() => ({
		cuponsCount: tabData.value.cupons.length,
		bannersCount: tabData.value.banners.length,
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
		const newTab = tab as MarketingTab;
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
	const handleViewModeChange = (mode: MarketingViewMode): void => {
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
		// Implementado pelos composables específicos (useCupons, useBanners, etc)
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
	const setTabData = (tab: MarketingTab, data: unknown[]): void => {
		tabData.value[tab] = data;
	};

	/**
	 * Atualiza estado de loading de uma aba específica
	 */
	const setTabLoading = (tab: MarketingTab, loading: boolean): void => {
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
			const validTabs: MarketingTab[] = ["cupons", "banners"];
			const validTab = validTabs.includes(newTab as MarketingTab)
				? (newTab as MarketingTab)
				: "cupons";

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
