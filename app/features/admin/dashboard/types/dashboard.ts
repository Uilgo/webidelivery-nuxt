/**
 * 📊 Tipos principais do Dashboard Admin
 *
 * Define interfaces para dados, KPIs e estruturas do dashboard.
 * Reutiliza tipos existentes do projeto para evitar duplicação.
 */

import type { UUID, TimestampTz } from "#shared/types/database";
import type { StatusPedido } from "@/features/public/pedido/types/pedido";
import type { DashboardFilters } from "./filters";

// ========================================
// DASHBOARD PRINCIPAL
// ========================================

export interface DashboardData {
	kpis: DashboardKpis;
	charts: DashboardCharts;
	realtime: DashboardRealtime;
	filters: DashboardFilters;
}

// ========================================
// KPIs (INDICADORES)
// ========================================

export interface DashboardKpis {
	pedidos_hoje: KpiPedidos;
	faturamento: KpiFaturamento;
	clientes: KpiClientes;
	conversao: KpiConversao;
	produtos: KpiProdutos;
	performance: KpiPerformance;
}

export interface KpiPedidos {
	total: number;
	pendentes: number;
	em_andamento: number;
	concluidos: number;
	cancelados: number;
	variacao_ontem: number; // percentual
}

export interface KpiFaturamento {
	hoje: number;
	semana: number;
	mes: number;
	ticket_medio: number;
	variacao_semana: number; // percentual
}

export interface KpiClientes {
	novos: number; // Novos Clientes
	recorrencia: number; // taxa de recorrência (percentual)
	variacao: number; // percentual vs periodo anterior
}

export interface KpiConversao {
	taxa: number; // taxa de conversão (percentual)
	visitas: number;
	variacao: number; // percentual vs periodo anterior
}

export interface KpiProdutos {
	total_ativos: number;
	sem_estoque: number;
	mais_vendidos: ProdutoRanking[];
	menos_vendidos: ProdutoRanking[];
}

export interface KpiPerformance {
	tempo_medio_preparo: number; // minutos
	tempo_medio_entrega: number; // minutos
	total_cancelamentos: number; // absoluto
	taxa_cancelamento: number; // percentual
	satisfacao_media: number; // 1-5
	entregas_no_prazo: number; // percentual
}

export interface ProdutoRanking {
	id: UUID;
	nome: string;
	quantidade_vendida: number;
	faturamento: number;
	imagem_url?: string;
}

// ========================================
// TEMPO REAL
// ========================================

export interface DashboardRealtime {
	pedidos_recentes: PedidoResumo[];
	notificacoes: DashboardNotificacao[];
	alertas: DashboardAlerta[];
}

export interface PedidoResumo {
	id: UUID;
	numero: number;
	cliente_nome: string;
	status: StatusPedido;
	valor_total: number;
	created_at: TimestampTz;
}

export interface DashboardNotificacao {
	id: UUID;
	tipo: "novo_pedido" | "pedido_cancelado" | "produto_sem_estoque" | "meta_atingida";
	titulo: string;
	mensagem: string;
	pedido_id?: UUID;
	produto_id?: UUID;
	created_at: TimestampTz;
	lida: boolean;
}

export interface DashboardAlerta {
	id: UUID;
	tipo: "critico" | "aviso" | "info";
	titulo: string;
	mensagem: string;
	acao_url?: string;
	acao_label?: string;
	created_at: TimestampTz;
	resolvido: boolean;
}

// ========================================
// GRÁFICOS
// ========================================

export interface DashboardCharts {
	pedidos_por_hora: ChartPedidosPorHora;
	faturamento_semanal: ChartFaturamentoSemanal;
	status_distribuicao: ChartStatusDistribuicao;
	produtos_ranking: ChartProdutosRanking;
	horarios_heatmap: ChartHorariosHeatmap;
}

export interface ChartPedidosPorHora {
	labels: string[]; // ['00:00', '01:00', ...]
	datasets: {
		pedidos: number[];
		faturamento: number[];
	};
}

export interface ChartFaturamentoSemanal {
	labels: string[]; // ['Seg', 'Ter', ...]
	datasets: {
		atual: number[];
		anterior: number[];
	};
}

export interface ChartStatusDistribuicao {
	labels: string[];
	data: number[];
	colors: string[];
}

export interface ChartProdutosRanking {
	labels: string[];
	data: number[];
	produtos: ProdutoRanking[];
}

export interface ChartHorariosHeatmap {
	dias: string[]; // ['Dom', 'Seg', ...]
	horas: string[]; // ['00:00', '01:00', ...]
	data: number[][]; // matriz [dia][hora] = quantidade
}

// ========================================
// FILTROS
// ========================================

// Re-exporta tipos de filtros para centralização
export type { DashboardPeriodo, DashboardFilters, PeriodoConfig } from "./filters";
