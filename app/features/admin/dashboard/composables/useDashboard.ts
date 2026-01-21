/**
 * 📊 useDashboard - Composable Principal Orquestrador
 *
 * Responsável por:
 * - Unificar todos os composables do dashboard
 * - Fornecer interface única para componentes
 * - Gerenciar estado global do dashboard
 * - Coordenar atualizações e filtros
 *
 * NOTA: Auto-refresh temporal removido intencionalmente.
 * Dados são atualizados apenas:
 * 1. No carregamento inicial da página
 * 2. Quando filtros mudam (watch automático)
 * 3. Quando usuário clica no botão refresh manual
 */

import type {
	DashboardKpis,
	DashboardCharts,
	DashboardRealtime,
	DashboardNotificacao,
} from "~/features/admin/dashboard/types/dashboard";
import type { DashboardPeriodo } from "~/features/admin/dashboard/types/filters";
import { useDashboardFilters } from "./useDashboardFilters";
import { useDashboardKpis } from "./useDashboardKpis";
import { useDashboardCharts } from "./useDashboardCharts";
import { useDashboardRealtime } from "./useDashboardRealtime";

export interface UseDashboardReturn {
	// === DADOS ===
	kpis: Ref<DashboardKpis | null>;
	charts: Ref<DashboardCharts | null>;
	realtime: Ref<DashboardRealtime | null>;

	// === ESTADOS ===
	loading: Ref<boolean>;
	loadingKpis: Ref<boolean>;
	loadingCharts: Ref<boolean>;
	error: Ref<string | null>;
	lastUpdate: Ref<Date | null>;

	// === FILTROS ===
	periodoKpis: Ref<DashboardPeriodo>;
	periodoCharts: Ref<DashboardPeriodo>;
	isPersonalizado: ComputedRef<boolean>;
	dataInicio: Ref<Date | null>;
	dataFim: Ref<Date | null>;
	dataInicioKpis: Ref<Date | null>;
	dataFimKpis: Ref<Date | null>;

	// === MÉTODOS PRINCIPAIS ===
	carregarDados: () => Promise<void>;
	carregarKpis: () => Promise<void>;
	carregarCharts: () => Promise<void>;
	recarregarTudo: () => Promise<void>;

	// === MÉTODOS DE FILTROS ===
	setPeriodoKpis: (periodo: DashboardPeriodo) => void;
	setPeriodoCharts: (periodo: DashboardPeriodo) => void;
	setDataInicio: (data: Date | null) => void;
	setDataFim: (data: Date | null) => void;
	setDataInicioKpis: (data: Date | null) => void;
	setDataFimKpis: (data: Date | null) => void;
	clearFilters: () => void;

	// === MÉTODOS DE NOTIFICAÇÕES ===
	adicionarNotificacao: (notificacao: Omit<DashboardNotificacao, "id" | "created_at">) => void;
	marcarNotificacaoLida: (id: string) => void;
	limparNotificacoes: () => void;
}

export const useDashboard = (): UseDashboardReturn => {
	// === COMPOSABLES ESPECIALIZADOS ===
	const filtersComposableKpis = useDashboardFilters("admin-dashboard-filtros-kpis");
	const filtersComposableCharts = useDashboardFilters("admin-dashboard-filtros-charts");
	const kpisComposable = useDashboardKpis();
	const chartsComposable = useDashboardCharts();
	const realtimeComposable = useDashboardRealtime();

	// === ESTADOS PRINCIPAIS (COMPARTILHADOS COM O PLUGIN) ===
	const kpis = useState<DashboardKpis | null>("admin-dashboard-kpis", () => null);
	const charts = useState<DashboardCharts | null>("admin-dashboard-charts", () => null);
	const realtime = useState<DashboardRealtime | null>("admin-dashboard-realtime", () => null);
	const loading = useState<boolean>("admin-dashboard-loading", () => false);
	const loadingKpis = ref(false);
	const loadingCharts = ref(false);
	const error = ref<string | null>(null);
	const lastUpdate = ref<Date | null>(null);

	// === FILTROS (SEPARADOS PARA KPIs E GRÁFICOS) ===
	const periodoKpis = computed({
		get: () => filtersComposableKpis.filters.value.periodo,
		set: (value: DashboardPeriodo) => filtersComposableKpis.setPeriodo(value),
	});

	const periodoCharts = computed({
		get: () => filtersComposableCharts.filters.value.periodo,
		set: (value: DashboardPeriodo) => filtersComposableCharts.setPeriodo(value),
	});

	const isPersonalizado = computed(() => filtersComposableCharts.isPersonalizado.value);

	const dataInicio = computed({
		get: () => filtersComposableCharts.filters.value.data_inicio,
		set: (value: Date | null) => filtersComposableCharts.setDataInicio(value),
	});

	const dataFim = computed({
		get: () => filtersComposableCharts.filters.value.data_fim,
		set: (value: Date | null) => filtersComposableCharts.setDataFim(value),
	});

	const dataInicioKpis = computed({
		get: () => filtersComposableKpis.filters.value.data_inicio,
		set: (value: Date | null) => filtersComposableKpis.setDataInicio(value),
	});

	const dataFimKpis = computed({
		get: () => filtersComposableKpis.filters.value.data_fim,
		set: (value: Date | null) => filtersComposableKpis.setDataFim(value),
	});

	// === MÉTODOS PRINCIPAIS ===

	/**
	 * Carrega apenas os KPIs
	 */
	const carregarKpis = async (): Promise<void> => {
		try {
			loadingKpis.value = true;
			error.value = null;

			// Aplica filtro dos KPIs
			const intervaloKpis = filtersComposableKpis.aplicarFiltro();

			// Carrega KPIs (o cache é gerenciado internamente pelo composable)
			const kpisData = await kpisComposable.carregarKpis(intervaloKpis);

			// Atualiza estado
			kpis.value = kpisData;
			lastUpdate.value = new Date();
		} catch (err) {
			console.error("[Dashboard] Erro ao carregar KPIs:", err);
			error.value = err instanceof Error ? err.message : "Erro ao carregar KPIs";
		} finally {
			loadingKpis.value = false;
		}
	};

	/**
	 * Carrega apenas os gráficos
	 */
	const carregarCharts = async (): Promise<void> => {
		try {
			loadingCharts.value = true;
			error.value = null;

			// Aplica filtro dos gráficos
			const intervaloCharts = filtersComposableCharts.aplicarFiltro();

			// Carrega gráficos
			const chartsData = await chartsComposable.carregarCharts(intervaloCharts);

			// Atualiza estado
			charts.value = chartsData;
			lastUpdate.value = new Date();
		} catch (err) {
			error.value = err instanceof Error ? err.message : "Erro ao carregar gráficos";
		} finally {
			loadingCharts.value = false;
		}
	};

	/**
	 * Carrega todos os dados do dashboard
	 * NOTA: Cache individual é gerenciado pelos composables especializados (TTL 5min)
	 */
	const carregarDados = async (): Promise<void> => {
		try {
			loading.value = true;
			error.value = null;

			// Aplica filtros separados
			const intervaloKpis = filtersComposableKpis.aplicarFiltro();
			const intervaloCharts = filtersComposableCharts.aplicarFiltro();

			// Carrega dados em paralelo para melhor performance
			// O cache é gerenciado internamente por cada composable (TTL de 5 minutos)
			const [kpisData, chartsData, realtimeData] = await Promise.all([
				kpisComposable.carregarKpis(intervaloKpis),
				chartsComposable.carregarCharts(intervaloCharts),
				realtimeComposable.carregarRealtime(),
			]);

			// Atualiza estados - sempre atualiza com os dados retornados
			kpis.value = kpisData;
			charts.value = chartsData;
			realtime.value = realtimeData;
			lastUpdate.value = new Date();
			dashboardCacheLoaded.value = true;
		} catch (err) {
			console.error("[Dashboard] Erro ao carregar dados:", err);
			error.value = err instanceof Error ? err.message : "Erro desconhecido";
		} finally {
			loading.value = false;
		}
	};

	/**
	 * Recarrega todos os dados forçando refresh
	 */
	const recarregarTudo = async (): Promise<void> => {
		// Limpa cache dos composables
		kpisComposable.limparCache();
		chartsComposable.limparCache();
		realtimeComposable.limparCache();

		// Recarrega dados
		await carregarDados();
	};

	// === MÉTODOS DE FILTROS (PROXY) ===

	/**
	 * Define o período dos KPIs (Afeta APENAS os cards de cima)
	 */
	const setPeriodoKpis = (novoPeriodo: DashboardPeriodo): void => {
		filtersComposableKpis.setPeriodo(novoPeriodo);
	};

	/**
	 * Define o período dos gráficos (Afeta APENAS a seção de análises)
	 */
	const setPeriodoCharts = (novoPeriodo: DashboardPeriodo): void => {
		filtersComposableCharts.setPeriodo(novoPeriodo);
	};

	/**
	 * Define data de início dos KPIs
	 */
	const setDataInicioKpis = (data: Date | null): void => {
		filtersComposableKpis.setDataInicio(data);
	};

	/**
	 * Define data fim dos KPIs
	 */
	const setDataFimKpis = (data: Date | null): void => {
		filtersComposableKpis.setDataFim(data);
	};

	/**
	 * Define data de início dos Gráficos
	 */
	const setDataInicio = (data: Date | null): void => {
		filtersComposableCharts.setDataInicio(data);
	};

	/**
	 * Define data fim dos Gráficos
	 */
	const setDataFim = (data: Date | null): void => {
		filtersComposableCharts.setDataFim(data);
	};

	/**
	 * Limpa todos os filtros
	 */
	const clearFilters = (): void => {
		filtersComposableKpis.clearFilters();
		filtersComposableCharts.clearFilters();
	};

	// === MÉTODOS DE NOTIFICAÇÕES (PROXY) ===

	/**
	 * Adiciona nova notificação
	 */
	const adicionarNotificacao = (
		notificacao: Omit<DashboardNotificacao, "id" | "created_at">,
	): void => {
		realtimeComposable.adicionarNotificacao(notificacao);
	};

	/**
	 * Marca notificação como lida
	 */
	const marcarNotificacaoLida = (id: string): void => {
		realtimeComposable.marcarNotificacaoLida(id);
	};

	/**
	 * Limpa todas as notificações
	 */
	const limparNotificacoes = (): void => {
		realtimeComposable.limparNotificacoes();
	};

	// === WATCHERS E LIFECYCLE (REGISTRAR APENAS UMA VEZ) ===
	// Usamos um estado compartilhado para garantir que side-effects rodem apenas uma vez
	const isInitialized = useState("admin-dashboard-initialized", () => false);
	const dashboardCacheLoaded = useState<boolean>("admin-dashboard-cache-loaded", () => false);

	if (!isInitialized.value) {
		// Só roda no lado do cliente
		if (import.meta.client) {
			isInitialized.value = true;

			// Carrega dados iniciais APENAS se não vieram do servidor
			onMounted(async () => {
				// Se o cache já foi carregado (mesmo que vazio), não mostrar loading
				if (dashboardCacheLoaded.value) {
					loading.value = false;
					return;
				}

				// Caso contrário (SPA puro), carrega
				await carregarDados();
			});

			// Watchers globais para filtros - recarrega quando filtros mudam
			watch(
				() => filtersComposableKpis.filters.value,
				async () => {
					await carregarKpis();
				},
				{ deep: true },
			);

			watch(
				() => filtersComposableCharts.filters.value,
				async () => {
					await carregarCharts();
				},
				{ deep: true },
			);
		}
	}

	// === RETORNO UNIFICADO ===
	return {
		// Dados
		kpis,
		charts,
		realtime,

		// Estados
		loading,
		loadingKpis,
		loadingCharts,
		error,
		lastUpdate,

		// Filtros
		periodoKpis,
		periodoCharts,
		isPersonalizado,
		dataInicio,
		dataFim,
		dataInicioKpis,
		dataFimKpis,

		// Métodos principais
		carregarDados,
		carregarKpis,
		carregarCharts,
		recarregarTudo,

		// Métodos de filtros
		setPeriodoKpis,
		setPeriodoCharts,
		setDataInicio,
		setDataFim,
		setDataInicioKpis,
		setDataFimKpis,
		clearFilters,

		// Métodos de notificações
		adicionarNotificacao,
		marcarNotificacaoLida,
		limparNotificacoes,
	};
};
