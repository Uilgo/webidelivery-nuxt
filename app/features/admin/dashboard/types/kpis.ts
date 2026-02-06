/**
 * 📊 Tipos específicos para KPIs do Dashboard
 *
 * Tipos detalhados para cálculos e exibição de indicadores.
 */

import type { UUID, TimestampTz } from "#shared/types/database";
import type { StatusPedido } from "~/features/admin/pedidos/types/pedidos-admin";

// ========================================
// TIPOS PARA CÁLCULOS DE KPI
// ========================================

export interface KpiCalculationData {
	pedidos: PedidoKpiData[];
	produtos: ProdutoKpiData[];
	periodo_comparacao: {
		inicio: Date;
		fim: Date;
	};
}

export interface PedidoKpiData {
	id: UUID;
	numero: number;
	status: StatusPedido;
	total: number;
	subtotal: number;
	taxa_entrega: number;
	desconto: number;
	created_at: TimestampTz;
	aceito_em: TimestampTz | null;
	preparo_em: TimestampTz | null;
	pronto_em: TimestampTz | null;
	concluido_em: TimestampTz | null;
	cancelado_em: TimestampTz | null;
	tempo_preparo_minutos?: number;
}

export interface ProdutoKpiData {
	id: UUID;
	nome: string;
	imagem_url: string | null;
	ativo: boolean;
	total_vendas: number;
	categoria_nome: string;
}

// ========================================
// TIPOS PARA VARIAÇÕES E COMPARAÇÕES
// ========================================

export interface KpiVariacao {
	valor_atual: number;
	valor_anterior: number;
	variacao_absoluta: number;
	variacao_percentual: number;
	tendencia: "alta" | "baixa" | "estavel";
}

export interface KpiComparacao {
	hoje: number;
	ontem: number;
	esta_semana: number;
	semana_passada: number;
	este_mes: number;
	mes_passado: number;
}

// ========================================
// TIPOS PARA METAS E OBJETIVOS
// ========================================

export interface KpiMeta {
	id: UUID;
	nome: string;
	tipo: "pedidos" | "faturamento" | "ticket_medio" | "tempo_preparo";
	valor_meta: number;
	valor_atual: number;
	periodo: "diario" | "semanal" | "mensal";
	progresso_percentual: number;
	status: "atingida" | "em_andamento" | "atrasada";
	created_at: TimestampTz;
	updated_at: TimestampTz;
}

// ========================================
// TIPOS PARA HISTÓRICO DE KPIs
// ========================================

export interface KpiHistorico {
	data: string; // YYYY-MM-DD
	pedidos_total: number;
	pedidos_concluidos: number;
	faturamento: number;
	ticket_medio: number;
	tempo_medio_preparo: number;
	taxa_cancelamento: number;
}

// ========================================
// TIPOS PARA ALERTAS DE PERFORMANCE
// ========================================

export interface AlertaPerformance {
	tipo: "tempo_preparo_alto" | "taxa_cancelamento_alta" | "queda_faturamento" | "meta_nao_atingida";
	severidade: "baixa" | "media" | "alta" | "critica";
	titulo: string;
	descricao: string;
	valor_atual: number;
	valor_esperado: number;
	sugestao_acao?: string;
	created_at: TimestampTz;
}
