/**
 * 📌 useConfiguracoes - Composable Orquestrador Global de Configurações
 *
 * Gerencia estado global do módulo de configurações:
 * - Navegação entre abas
 * - Sincronização com URL e cookies
 * - Estados de loading por aba
 */

/** Tipos das abas disponíveis */
export type ConfiguracaoTab =
	| "dados-empresa"
	| "horarios"
	| "pagamentos"
	| "frete-entrega"
	| "personalizar"
	| "seguranca";

/** Interface de retorno do composable */
export interface UseConfiguracoesReturn {
	// Estado das abas
	activeTab: Ref<ConfiguracaoTab>;

	// Estados de loading
	loadingStates: Ref<Record<ConfiguracaoTab, boolean>>;
	currentLoading: ComputedRef<boolean>;

	// Handlers
	handleTabChange: (tab: string) => void;

	// Métodos para atualizar estados (usados pelos composables filhos)
	setTabLoading: (tab: ConfiguracaoTab, loading: boolean) => void;
}

export const useConfiguracoes = (): UseConfiguracoesReturn => {
	const route = useRoute();
	const router = useRouter();

	// ========================================
	// COOKIES PARA PERSISTÊNCIA
	// ========================================

	const lastTabCookie = useCookie<ConfiguracaoTab>("configuracoes-last-tab", {
		default: () => "dados-empresa",
		maxAge: 60 * 60 * 24 * 30, // 30 dias
	});

	// ========================================
	// ESTADO DAS ABAS
	// ========================================

	/**
	 * Determina a aba inicial baseado na URL ou cookie
	 */
	const getInitialTab = (): ConfiguracaoTab => {
		const queryTab = route.query.tab as string;
		const validTabs: ConfiguracaoTab[] = [
			"dados-empresa",
			"horarios",
			"pagamentos",
			"frete-entrega",
			"personalizar",
			"seguranca",
		];

		if (queryTab && validTabs.includes(queryTab as ConfiguracaoTab)) {
			return queryTab as ConfiguracaoTab;
		}

		return lastTabCookie.value;
	};

	const activeTab = ref<ConfiguracaoTab>(getInitialTab());

	// ========================================
	// ESTADOS DE LOADING
	// ========================================

	const loadingStates = ref<Record<ConfiguracaoTab, boolean>>({
		"dados-empresa": false,
		horarios: false,
		pagamentos: false,
		"frete-entrega": false,
		personalizar: false,
		seguranca: false,
	});

	// ========================================
	// COMPUTADAS
	// ========================================

	const currentLoading = computed(() => loadingStates.value[activeTab.value]);

	// ========================================
	// HANDLERS
	// ========================================

	/**
	 * Handler para mudança de aba
	 */
	const handleTabChange = (tab: string): void => {
		const newTab = tab as ConfiguracaoTab;
		activeTab.value = newTab;
		lastTabCookie.value = newTab;

		router.push({
			query: {
				...route.query,
				tab: newTab,
			},
		});
	};

	// ========================================
	// MÉTODOS PARA COMPOSABLES FILHOS
	// ========================================

	/**
	 * Atualiza estado de loading de uma aba específica
	 */
	const setTabLoading = (tab: ConfiguracaoTab, loading: boolean): void => {
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
			const validTabs: ConfiguracaoTab[] = [
				"dados-empresa",
				"horarios",
				"pagamentos",
				"frete-entrega",
				"personalizar",
				"seguranca",
			];
			const validTab = validTabs.includes(newTab as ConfiguracaoTab)
				? (newTab as ConfiguracaoTab)
				: "dados-empresa";

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

		// Estados de loading
		loadingStates,
		currentLoading,

		// Handlers
		handleTabChange,

		// Métodos para composables filhos
		setTabLoading,
	};
};
