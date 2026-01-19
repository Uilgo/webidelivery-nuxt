/**
 * 📊 Tipos específicos para Filtros do Dashboard
 *
 * Tipos para filtros de período seguindo o mesmo padrão da página de pedidos.
 */

import { startOfDay, endOfDay, subDays, startOfMonth } from "date-fns";

// ========================================
// TIPOS PRINCIPAIS DE FILTROS
// ========================================

export type DashboardPeriodo = "hoje" | "ontem" | "ultimos_7_dias" | "este_mes" | "personalizado";

export interface DashboardFilters {
	periodo: DashboardPeriodo;
	data_inicio: Date | null;
	data_fim: Date | null;
}

export interface PeriodoConfig {
	id: DashboardPeriodo;
	label: string;
	descricao: string;
	calcularIntervalo: () => { inicio: Date | null; fim: Date | null };
}

// ========================================
// CONFIGURAÇÃO DOS PERÍODOS DISPONÍVEIS
// ========================================

/**
 * Configuração dos períodos disponíveis (mesmo padrão de pedidos)
 * Segue exatamente o padrão do usePedidosFilters para consistência UX
 */
export const PERIODOS_DASHBOARD: PeriodoConfig[] = [
	{
		id: "hoje",
		label: "Hoje",
		descricao: "Últimas 24 horas",
		calcularIntervalo: () => ({
			inicio: startOfDay(new Date()),
			fim: new Date(),
		}),
	},
	{
		id: "ontem",
		label: "Ontem",
		descricao: "Dia anterior completo",
		calcularIntervalo: () => {
			const ontem = subDays(new Date(), 1);
			return {
				inicio: startOfDay(ontem),
				fim: endOfDay(ontem),
			};
		},
	},
	{
		id: "ultimos_7_dias",
		label: "Últimos 7 dias",
		descricao: "7 dias corridos incluindo hoje",
		calcularIntervalo: () => ({
			inicio: startOfDay(subDays(new Date(), 6)), // 6 dias atrás + hoje = 7 dias
			fim: new Date(),
		}),
	},
	{
		id: "este_mes",
		label: "Este Mês",
		descricao: "Do dia 1º até hoje",
		calcularIntervalo: () => ({
			inicio: startOfMonth(new Date()),
			fim: new Date(),
		}),
	},
	{
		id: "personalizado",
		label: "Personalizado",
		descricao: "Período específico",
		calcularIntervalo: () => ({
			inicio: null, // Será definido pelo usuário
			fim: null, // Será definido pelo usuário
		}),
	},
];

// ========================================
// TIPOS PARA FILTROS AVANÇADOS
// ========================================

export interface DashboardFiltrosAvancados extends DashboardFilters {
	categorias?: string[];
	produtos?: string[];
	status_pedidos?: string[];
	formas_pagamento?: string[];
	tipos_entrega?: string[];
	faixa_valor?: {
		min: number;
		max: number;
	};
}

// ========================================
// TIPOS PARA PRESETS DE FILTROS
// ========================================

export interface FiltroPreset {
	id: string;
	nome: string;
	descricao: string;
	filtros: DashboardFilters;
	icone?: string;
	cor?: string;
	favorito?: boolean;
}

export const PRESETS_DASHBOARD: FiltroPreset[] = [
	{
		id: "hoje",
		nome: "Hoje",
		descricao: "Dados de hoje",
		filtros: {
			periodo: "hoje",
			data_inicio: null,
			data_fim: null,
		},
		icone: "lucide:calendar-days",
		cor: "blue",
	},
	{
		id: "semana",
		nome: "Esta Semana",
		descricao: "Últimos 7 dias",
		filtros: {
			periodo: "ultimos_7_dias",
			data_inicio: null,
			data_fim: null,
		},
		icone: "lucide:calendar-week",
		cor: "green",
	},
	{
		id: "comparacao",
		nome: "Comparação",
		descricao: "Hoje vs Ontem",
		filtros: {
			periodo: "personalizado",
			data_inicio: subDays(new Date(), 1),
			data_fim: new Date(),
		},
		icone: "lucide:trending-up",
		cor: "purple",
	},
];

// ========================================
// TIPOS PARA ESTADO DOS FILTROS
// ========================================

export interface FiltrosState {
	filtros_ativos: DashboardFilters;
	filtros_salvos: FiltroPreset[];
	historico_filtros: DashboardFilters[];
	loading: boolean;
	error: string | null;
}

// ========================================
// TIPOS PARA VALIDAÇÃO DE FILTROS
// ========================================

export interface ValidacaoFiltro {
	valido: boolean;
	erros: string[];
	avisos: string[];
}

export interface RangeValidation {
	data_inicio_valida: boolean;
	data_fim_valida: boolean;
	range_valido: boolean;
	dias_selecionados: number;
	limite_maximo_dias: number;
}
