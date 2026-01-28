/**
 * 📌 Tipos de Relatório de Pedidos
 *
 * Tipos específicos para o relatório de pedidos.
 */

import type { UUID, TimestampTz } from "#shared/types/database";
import type { KpiBase, DadosGrafico } from "./relatorios";

// ========================================
// RELATÓRIO COMPLETO
// ========================================

export interface RelatorioPedidos {
	readonly kpis: KpisPedidos;
	readonly graficos: GraficosPedidos;
	readonly tabela: PedidoDetalhado[];
	readonly resumo: ResumoPedidos;
}

// ========================================
// KPIs
// ========================================

export interface KpisPedidos {
	readonly total_pedidos: KpiBase;
	readonly pedidos_concluidos: KpiBase;
	readonly pedidos_cancelados: KpiBase;
	readonly taxa_cancelamento: KpiBase;
	readonly tempo_medio_preparo: KpiBase;
	readonly tempo_medio_entrega: KpiBase;
}

// ========================================
// GRÁFICOS
// ========================================

export interface GraficosPedidos {
	readonly pedidos_por_dia: DadosGrafico;
	readonly pedidos_por_status: DadosGrafico;
	readonly pedidos_por_hora: DadosGrafico;
	readonly pedidos_por_tipo_entrega: DadosGrafico;
}

// ========================================
// PEDIDO DETALHADO
// ========================================

export interface PedidoDetalhado {
	readonly id: UUID;
	readonly numero: number;
	readonly codigo_rastreamento: string;
	// Aliases para a tabela
	readonly codigo: string; // alias para codigo_rastreamento
	readonly data: TimestampTz; // alias para created_at
	readonly cliente: string; // alias para cliente_nome
	readonly valor: number; // alias para total
	// Campos originais
	readonly created_at: TimestampTz;
	readonly cliente_nome: string;
	readonly cliente_telefone: string;
	readonly status: string;
	readonly tipo_entrega: string;
	readonly forma_pagamento: string;
	readonly subtotal: number;
	readonly taxa_entrega: number;
	readonly desconto: number;
	readonly total: number;
	readonly tempo_preparo?: number; // em minutos
	readonly tempo_entrega?: number; // em minutos
	readonly aceito_em?: TimestampTz;
	readonly preparo_em?: TimestampTz;
	readonly pronto_em?: TimestampTz;
	readonly entrega_em?: TimestampTz;
	readonly concluido_em?: TimestampTz;
	readonly cancelado_em?: TimestampTz;
	readonly motivo_cancelamento?: string;
}

// ========================================
// RESUMO
// ========================================

export interface ResumoPedidos {
	readonly total_pedidos: number;
	readonly pedidos_por_status: Record<string, number>;
	readonly pedidos_por_tipo_entrega: Record<string, number>;
	readonly pedidos_por_forma_pagamento: Record<string, number>;
	readonly receita_total: number;
	readonly ticket_medio: number;
	readonly tempo_medio_preparo: number;
	readonly tempo_medio_entrega: number;
	readonly taxa_cancelamento: number;
}

// ========================================
// ESTATÍSTICAS POR PERÍODO
// ========================================

export interface EstatisticasPorDia {
	readonly data: string; // YYYY-MM-DD
	readonly total_pedidos: number;
	readonly pedidos_concluidos: number;
	readonly pedidos_cancelados: number;
	readonly receita: number;
}

export interface EstatisticasPorHora {
	readonly hora: number; // 0-23
	readonly total_pedidos: number;
	readonly receita: number;
}

// ========================================
// FILTROS ESPECÍFICOS
// ========================================

export interface FiltrosPedidos {
	readonly status?: readonly string[];
	readonly tipo_entrega?: readonly string[];
	readonly forma_pagamento?: readonly string[];
	readonly valor_minimo?: number;
	readonly valor_maximo?: number;
}
