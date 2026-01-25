/**
 * 📌 Tipos de Relatório Financeiro
 *
 * Tipos específicos para o relatório financeiro e fluxo de caixa.
 */

import type { UUID, TimestampTz } from "#shared/types/database";
import type { KpiBase, DadosGrafico } from "./relatorios";

// ========================================
// RELATÓRIO COMPLETO
// ========================================

export interface RelatorioFinanceiro {
	readonly kpis: KpisFinanceiro;
	readonly metodos_pagamento: MetodosPagamento;
	readonly graficos: GraficosFinanceiro;
	readonly tabela: readonly TransacaoFinanceira[];
	readonly resumo: ResumoFinanceiro;
}

// ========================================
// KPIs
// ========================================

export interface KpisFinanceiro {
	readonly receita_bruta: KpiBase;
	readonly receita_liquida: KpiBase;
	readonly descontos: KpiBase;
	readonly taxas_entrega: KpiBase;
	readonly lucro_estimado: KpiBase;
}

// ========================================
// MÉTODOS DE PAGAMENTO
// ========================================

export interface MetodosPagamento {
	readonly dinheiro: MetodoPagamentoDetalhado;
	readonly pix: MetodoPagamentoDetalhado;
	readonly credito: MetodoPagamentoDetalhado;
	readonly debito: MetodoPagamentoDetalhado;
}

export interface MetodoPagamentoDetalhado {
	readonly total_transacoes: number;
	readonly valor_total: number;
	readonly percentual_total: number;
	readonly ticket_medio: number;
}

// ========================================
// GRÁFICOS
// ========================================

export interface GraficosFinanceiro {
	readonly fluxo_caixa: DadosGrafico;
	readonly receita_por_metodo: DadosGrafico;
	readonly evolucao_lucro: DadosGrafico;
	readonly comparativo_receitas: DadosGrafico;
}

// ========================================
// TRANSAÇÃO FINANCEIRA
// ========================================

export interface TransacaoFinanceira {
	readonly id: UUID;
	readonly numero: number;
	readonly data: TimestampTz;
	readonly tipo: "entrada" | "saida";
	readonly descricao: string;
	readonly forma_pagamento: string;
	readonly valor_bruto: number;
	readonly desconto: number;
	readonly taxa_entrega: number;
	readonly valor_liquido: number;
	readonly status: string;
}

// ========================================
// RESUMO
// ========================================

export interface ResumoFinanceiro {
	readonly receita_bruta: number;
	readonly receita_liquida: number;
	readonly total_descontos: number;
	readonly total_taxas_entrega: number;
	readonly lucro_estimado: number;
	readonly margem_lucro: number;
	readonly total_transacoes: number;
	readonly ticket_medio: number;
	readonly distribuicao_pagamentos: Record<string, number>;
}

// ========================================
// FLUXO DE CAIXA
// ========================================

export interface FluxoCaixaDiario {
	readonly data: string; // YYYY-MM-DD
	readonly entradas: number;
	readonly saidas: number;
	readonly saldo: number;
	readonly saldo_acumulado: number;
}

// ========================================
// ESTATÍSTICAS POR FORMA DE PAGAMENTO
// ========================================

export interface EstatisticasFormaPagamento {
	readonly forma_pagamento: string;
	readonly total_transacoes: number;
	readonly valor_total: number;
	readonly percentual_total: number;
	readonly ticket_medio: number;
	readonly maior_transacao: number;
	readonly menor_transacao: number;
}
