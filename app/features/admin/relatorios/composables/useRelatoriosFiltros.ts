/**
 * 📌 useRelatoriosFiltros
 *
 * Composable para gerenciar filtros globais dos relatórios (período).
 * Todos os relatórios compartilham o mesmo filtro de período.
 */

import type { FiltrosPeriodo, PeriodoPreset } from "../types/relatorios";
import { PERIODOS_PRESET } from "#shared/constants/relatorios";

export const useRelatoriosFiltros = () => {
	/**
	 * Calcula a data de início baseado no preset
	 */
	const calcularDataInicio = (preset: PeriodoPreset): string => {
		const hoje = new Date();
		hoje.setHours(0, 0, 0, 0);

		const config = PERIODOS_PRESET[preset];

		if ("dias" in config) {
			const dataInicio = new Date(hoje);
			dataInicio.setDate(dataInicio.getDate() - config.dias);
			return dataInicio.toISOString();
		}

		switch (config.tipo) {
			case "mes_atual": {
				// Este mês: primeiro dia do mês atual
				const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
				return primeiroDiaMes.toISOString();
			}

			case "mes_anterior": {
				// Mês passado: primeiro dia do mês anterior
				const primeiroDiaMesAnterior = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
				return primeiroDiaMesAnterior.toISOString();
			}

			case "ano_atual": {
				// Este ano: primeiro dia do ano atual
				const primeiroDiaAno = new Date(hoje.getFullYear(), 0, 1);
				return primeiroDiaAno.toISOString();
			}

			case "ano_anterior": {
				// Ano passado: 01/01 do ano anterior
				const primeiroDiaAnoAnterior = new Date(hoje.getFullYear() - 1, 0, 1);
				return primeiroDiaAnoAnterior.toISOString();
			}

			default:
				return hoje.toISOString();
		}
	};

	/**
	 * Calcula a data de fim baseado no preset
	 */
	const calcularDataFim = (preset: PeriodoPreset): string => {
		const hoje = new Date();
		hoje.setHours(23, 59, 59, 999);

		const config = PERIODOS_PRESET[preset];

		// Para presets com dias, sempre usa hoje
		if ("dias" in config) {
			return hoje.toISOString();
		}

		switch (config.tipo) {
			case "mes_atual":
				// Este mês: até hoje (inteligente)
				return hoje.toISOString();

			case "mes_anterior": {
				// Mês passado: último dia do mês anterior (completo)
				const ultimoDiaMesAnterior = new Date(hoje.getFullYear(), hoje.getMonth(), 0);
				ultimoDiaMesAnterior.setHours(23, 59, 59, 999);
				return ultimoDiaMesAnterior.toISOString();
			}

			case "ano_atual":
				// Este ano: até hoje (inteligente)
				return hoje.toISOString();

			case "ano_anterior": {
				// Ano passado: 31/12 do ano anterior (completo)
				const ultimoDiaAnoAnterior = new Date(hoje.getFullYear() - 1, 11, 31);
				ultimoDiaAnoAnterior.setHours(23, 59, 59, 999);
				return ultimoDiaAnoAnterior.toISOString();
			}

			default:
				return hoje.toISOString();
		}
	};

	/**
	 * Cookie para persistir o último período selecionado
	 */
	const periodoCookie = useCookie<PeriodoPreset>("relatorios-periodo", {
		default: () => "este_mes",
		maxAge: 60 * 60 * 24 * 30, // 30 dias
	});

	/**
	 * Estado do período selecionado
	 * Inicializa com o valor do cookie para evitar hydration mismatch
	 */
	const periodo = useState<FiltrosPeriodo>("relatorios.filtros.periodo", () => {
		const presetInicial = periodoCookie.value || "este_mes";
		return {
			preset: presetInicial,
			data_inicio: calcularDataInicio(presetInicial),
			data_fim: calcularDataFim(presetInicial),
		};
	});

	/**
	 * Define um novo período baseado no preset
	 */
	const setPeriodo = (preset: PeriodoPreset): void => {
		const novaDataInicio = calcularDataInicio(preset);
		const novaDataFim = calcularDataFim(preset);

		periodo.value = {
			preset,
			data_inicio: novaDataInicio,
			data_fim: novaDataFim,
		};

		// Salvar no cookie
		periodoCookie.value = preset;
	};

	/**
	 * Define um período personalizado
	 */
	const setPeriodoCustomizado = (dataInicio: string, dataFim: string): void => {
		periodo.value = {
			preset: "personalizado",
			data_inicio: dataInicio,
			data_fim: dataFim,
		};

		// Salvar no cookie
		periodoCookie.value = "personalizado";
	};

	/**
	 * Reseta para o período padrão
	 */
	const resetarPeriodo = (): void => {
		setPeriodo("este_mes");
	};

	/**
	 * Verifica se o período é personalizado
	 */
	const ehPeriodoPersonalizado = computed(() => {
		return periodo.value.preset === "personalizado";
	});

	/**
	 * Label do período atual
	 */
	const labelPeriodo = computed(() => {
		return PERIODOS_PRESET[periodo.value.preset].label;
	});

	return {
		// Estado
		periodo: readonly(periodo),
		ehPeriodoPersonalizado,
		labelPeriodo,

		// Métodos
		setPeriodo,
		setPeriodoCustomizado,
		resetarPeriodo,
		calcularDataInicio,
		calcularDataFim,
	};
};
