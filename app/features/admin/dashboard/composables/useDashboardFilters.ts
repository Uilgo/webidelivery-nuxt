/**
 * 📊 useDashboardFilters - Filtros de Período do Dashboard
 *
 * Responsável por:
 * - Gerenciar filtros de período (mesmo padrão de pedidos)
 * - Calcular intervalos de datas
 * - Aplicar filtros nos dados do dashboard
 * - Manter consistência UX com página de pedidos
 */

import type {
	DashboardFilters,
	DashboardPeriodo,
	PeriodoConfig,
} from "~/features/admin/dashboard/types/filters";
import { PERIODOS_DASHBOARD } from "~/features/admin/dashboard/types/filters";

export interface UseDashboardFiltersReturn {
	filters: Ref<DashboardFilters>;
	periodos: Ref<PeriodoConfig[]>;
	setPeriodo: (periodo: DashboardPeriodo) => void;
	setDataInicio: (data: Date | null) => void;
	setDataFim: (data: Date | null) => void;
	clearFilters: () => void;
	aplicarFiltro: () => { inicio: Date | null; fim: Date | null };
	isPersonalizado: ComputedRef<boolean>;
}

export const useDashboardFilters = (
	stateKey = "admin-dashboard-filtros",
): UseDashboardFiltersReturn => {
	// Estado dos filtros com cache (mesmo padrão de pedidos)
	const filters = useState<DashboardFilters>(stateKey, () => ({
		periodo: "hoje", // Padrão: hoje
		data_inicio: null,
		data_fim: null,
	}));

	// Períodos disponíveis
	const periodos = ref<PeriodoConfig[]>(PERIODOS_DASHBOARD);

	/**
	 * Verifica se o período selecionado é personalizado
	 */
	const isPersonalizado = computed(() => filters.value.periodo === "personalizado");

	/**
	 * Define o período selecionado
	 */
	const setPeriodo = (periodo: DashboardPeriodo): void => {
		filters.value.periodo = periodo;

		// Se não for personalizado, limpa as datas customizadas
		if (periodo !== "personalizado") {
			filters.value.data_inicio = null;
			filters.value.data_fim = null;
		}
	};

	/**
	 * Define data de início
	 */
	const setDataInicio = (data: Date | null): void => {
		filters.value.data_inicio = data;
	};

	/**
	 * Define data fim
	 */
	const setDataFim = (data: Date | null): void => {
		filters.value.data_fim = data;
	};

	/**
	 * Limpa todos os filtros
	 */
	const clearFilters = (): void => {
		filters.value = {
			periodo: "hoje", // Reset para hoje
			data_inicio: null,
			data_fim: null,
		};
	};

	/**
	 * Aplica o filtro atual e retorna o intervalo de datas
	 */
	const aplicarFiltro = (): { inicio: Date | null; fim: Date | null } => {
		const periodoConfig = periodos.value.find((p) => p.id === filters.value.periodo);

		if (!periodoConfig) {
			return { inicio: null, fim: null };
		}

		// Para período personalizado, usa as datas definidas pelo usuário
		if (filters.value.periodo === "personalizado") {
			return {
				inicio: filters.value.data_inicio,
				fim: filters.value.data_fim,
			};
		}

		// Para outros períodos, calcula automaticamente
		return periodoConfig.calcularIntervalo();
	};

	return {
		filters,
		periodos,
		setPeriodo,
		setDataInicio,
		setDataFim,
		clearFilters,
		aplicarFiltro,
		isPersonalizado,
	};
};
