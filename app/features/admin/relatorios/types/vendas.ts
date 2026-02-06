/**
 * 📌 Tipos de Relatório de Vendas
 *
 * Tipos específicos para o relatório de vendas e faturamento.
 */

import type { UUID, TimestampTz } from "#shared/types/database";
import type { KpiBase, DadosGrafico, DadosComparativo } from "./relatorios";

// ========================================
// RELATÓRIO COMPLETO
// ========================================

export interface RelatorioVendas {
	readonly kpis: KpisVendas;
	readonly graficos: GraficosVendas;
	readonly comparativo: DadosComparativo;
	readonly tabela: readonly VendaDetalhada[];
	readonly resumo: ResumoVendas;
}

// ========================================
// KPIs
// ========================================

export interface KpisVendas {
	readonly receita_bruta: KpiBase;
	readonly receita_liquida: KpiBase;
	readonly ticket_medio: KpiBase;
	readonly total_transacoes: KpiBase;
	readonly crescimento_mensal: KpiBase;
}

// ========================================
// GRÁFICOS
// ========================================

export interface GraficosVendas {
	readonly faturamento_diario: DadosGrafico;
	readonly faturamento_por_categoria: DadosGrafico;
	readonly faturamento_por_forma_pagamento: DadosGrafico;
	readonly comparativo_mensal: DadosGrafico;
}

// ========================================
// VENDA DETALHADA
// ========================================

export interface VendaDetalhada {
	readonly id: UUID;
	readonly numero: number;
	readonly data: TimestampTz;
	readonly cliente_nome: string;
	readonly subtotal: number;
	readonly taxa_entrega: number;
	readonly desconto: number;
	readonly total: number;
	readonly forma_pagamento: string;
	readonly status: string;
	readonly tipo_entrega: string;
}

// ========================================
// RESUMO
// ========================================

export interface ResumoVendas {
	readonly receita_bruta: number;
	readonly receita_liquida: number;
	readonly total_descontos: number;
	readonly total_taxas_entrega: number;
	readonly ticket_medio: number;
	readonly total_transacoes: number;
	readonly vendas_por_forma_pagamento: Record<string, number>;
	readonly vendas_por_categoria: Record<string, number>;
}

// ========================================
// ESTATÍSTICAS POR PERÍODO
// ========================================

export interface FaturamentoPorDia {
	readonly data: string; // YYYY-MM-DD
	readonly receita_bruta: number;
	readonly receita_liquida: number;
	readonly total_descontos: number;
	readonly total_taxas: number;
	readonly total_transacoes: number;
}

export interface FaturamentoPorCategoria {
	readonly categoria_id: UUID;
	readonly categoria_nome: string;
	readonly receita: number;
	readonly quantidade_vendida: number;
	readonly percentual_total: number;
}
