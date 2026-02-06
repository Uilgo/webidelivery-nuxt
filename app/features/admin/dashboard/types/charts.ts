/**
 * 📊 Tipos específicos para Gráficos do Dashboard
 *
 * Tipos essenciais para configuração e dados dos gráficos.
 */

// ========================================
// GRÁFICO DE PEDIDOS POR HORA (PRINCIPAL)
// ========================================

export interface ChartPedidosPorHora {
	labels: string[]; // ["00:00", "06:00", "12:00", "18:00", "23:59"]
	datasets: {
		pedidos: number[]; // [2, 8, 15, 22, 5]
		faturamento: number[]; // [120, 480, 890, 1340, 280]
	};
}

// ========================================
// TIPOS BÁSICOS PARA EXPANSÃO FUTURA
// ========================================

export type ChartTipo = "line" | "bar" | "doughnut" | "pie" | "area";

export interface ChartDataset {
	label: string;
	data: number[];
	backgroundColor?: string | string[];
	borderColor?: string;
	borderWidth?: number;
	fill?: boolean;
	tension?: number;
}

export interface ChartData {
	labels: string[];
	datasets: ChartDataset[];
}
