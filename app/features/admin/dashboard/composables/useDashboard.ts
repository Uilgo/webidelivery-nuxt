/**
 * 📊 useDashboard - Composable Principal Orquestrador
 *
 * Responsável por:
 * - Unificar todos os composables do dashboard
 * - Fornecer interface única para componentes
 * - Gerenciar estado global do dashboard
 * - Coordenar atualizações e filtros
 */

import { useIntervalFn } from "@vueuse/core";
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
	error: Ref<string | null>;
	lastUpdate: Ref<Date | null>;

	// === FILTROS ===
	periodo: Ref<DashboardPeriodo>;
	isPersonalizado: ComputedRef<boolean>;
	dataInicio: Ref<Date | null>;
	dataFim: Ref<Date | null>;

	// === MÉTODOS PRINCIPAIS ===
	carregarDados: () => Promise<void>;
	recarregarTudo: () => Promise<void>;

	// === MÉTODOS DE FILTROS ===
	setPeriodo: (periodo: DashboardPeriodo) => void;
	setDataInicio: (data: Date | null) => void;
	setDataFim: (data: Date | null) => void;
	clearFilters: () => void;

	// === MÉTODOS DE CONTROLE ===
	pauseAutoRefresh: () => void;
	resumeAutoRefresh: () => void;

	// === MÉTODOS DE NOTIFICAÇÕES ===
	adicionarNotificacao: (notificacao: Omit<DashboardNotificacao, "id" | "created_at">) => void;
	marcarNotificacaoLida: (id: string) => void;
	limparNotificacoes: () => void;
}

export const useDashboard = (): UseDashboardReturn => {
	// === COMPOSABLES ESPECIALIZADOS ===
	const filtersComposable = useDashboardFilters();
	const kpisComposable = useDashboardKpis();
	const chartsComposable = useDashboardCharts();
	const realtimeComposable = useDashboardRealtime();

	// === ESTADOS PRINCIPAIS ===
	const kpis = ref<DashboardKpis | null>(null);
	const charts = ref<DashboardCharts | null>(null);
	const realtime = ref<DashboardRealtime | null>(null);
	const loading = ref(false);
	const error = ref<string | null>(null);
	const lastUpdate = ref<Date | null>(null);

	// === FILTROS (PROXY DOS COMPOSABLES) ===
	const periodo = computed({
		get: () => filtersComposable.filters.value.periodo,
		set: (value: DashboardPeriodo) => filtersComposable.setPeriodo(value),
	});

	const isPersonalizado = computed(() => filtersComposable.isPersonalizado.value);

	const dataInicio = computed({
		get: () => filtersComposable.filters.value.data_inicio,
		set: (value: Date | null) => filtersComposable.setDataInicio(value),
	});

	const dataFim = computed({
		get: () => filtersComposable.filters.value.data_fim,
		set: (value: Date | null) => filtersComposable.setDataFim(value),
	});

	// === MÉTODOS PRINCIPAIS ===

	/**
	 * Carrega todos os dados do dashboard
	 */
	const carregarDados = async (): Promise<void> => {
		try {
			loading.value = true;
			error.value = null;

			// Aplica filtros atuais
			const intervalo = filtersComposable.aplicarFiltro();

			// Carrega dados em paralelo para melhor performance
			const [kpisData, chartsData, realtimeData] = await Promise.all([
				kpisComposable.carregarKpis(intervalo),
				chartsComposable.carregarCharts(intervalo),
				realtimeComposable.carregarRealtime(),
			]);

			// Atualiza estados
			kpis.value = kpisData;
			charts.value = chartsData;
			realtime.value = realtimeData;
			lastUpdate.value = new Date();
		} catch (err) {
			console.error("Erro ao carregar dados do dashboard:", err);
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

	// === AUTO-REFRESH ===
	const { pause, resume } = useIntervalFn(carregarDados, 30000, { immediate: false });

	/**
	 * Pausa auto-refresh
	 */
	const pauseAutoRefresh = (): void => {
		pause();
	};

	/**
	 * Resume auto-refresh
	 */
	const resumeAutoRefresh = (): void => {
		resume();
	};

	// === MÉTODOS DE FILTROS (PROXY) ===

	/**
	 * Define o período selecionado
	 */
	const setPeriodo = (novoPeriodo: DashboardPeriodo): void => {
		filtersComposable.setPeriodo(novoPeriodo);
	};

	/**
	 * Define data de início
	 */
	const setDataInicio = (data: Date | null): void => {
		filtersComposable.setDataInicio(data);
	};

	/**
	 * Define data fim
	 */
	const setDataFim = (data: Date | null): void => {
		filtersComposable.setDataFim(data);
	};

	/**
	 * Limpa todos os filtros
	 */
	const clearFilters = (): void => {
		filtersComposable.clearFilters();
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

	// === WATCHERS ===

	// Recarrega dados quando filtros mudam
	watch(
		() => filtersComposable.filters.value,
		async () => {
			await carregarDados();
		},
		{ deep: true },
	);

	// === LIFECYCLE ===

	// Carrega dados iniciais
	onMounted(async () => {
		await carregarDados();
		resume(); // Inicia auto-refresh
	});

	// Pausa auto-refresh quando componente é desmontado
	onUnmounted(() => {
		pauseAutoRefresh();
	});

	// === RETORNO UNIFICADO ===
	return {
		// Dados
		kpis,
		charts,
		realtime,

		// Estados
		loading,
		error,
		lastUpdate,

		// Filtros
		periodo,
		isPersonalizado,
		dataInicio,
		dataFim,

		// Métodos principais
		carregarDados,
		recarregarTudo,

		// Métodos de filtros
		setPeriodo,
		setDataInicio,
		setDataFim,
		clearFilters,

		// Métodos de controle
		pauseAutoRefresh,
		resumeAutoRefresh,

		// Métodos de notificações
		adicionarNotificacao,
		marcarNotificacaoLida,
		limparNotificacoes,
	};
};
