/**
 * 📌 Tipos Principais de Relatórios
 *
 * Tipos base utilizados em todo o sistema de relatórios.
 */

import type { UUID, TimestampTz } from "#shared/types/database";

// ========================================
// ABAS E NAVEGAÇÃO
// ========================================

export type AbaRelatorio = "pedidos" | "vendas" | "produtos" | "marketing" | "financeiro";

// ========================================
// PERÍODOS E FILTROS
// ========================================

export type PeriodoPreset =
	| "hoje"
	| "ontem"
	| "ultimos_7_dias"
	| "ultimos_30_dias"
	| "este_mes"
	| "mes_passado"
	| "este_ano"
	| "ano_passado"
	| "personalizado";

export interface FiltrosPeriodo {
	readonly preset: PeriodoPreset;
	readonly data_inicio: string; // ISO date
	readonly data_fim: string; // ISO date
}

// ========================================
// KPI BASE
// ========================================

export type FormatoKpi = "numero" | "moeda" | "percentual" | "tempo";

export type VariacaoTipo = "aumento" | "reducao" | "neutro";

export interface KpiBase {
	readonly titulo: string;
	readonly valor: number | string;
	readonly variacao?: number; // percentual de mudança
	readonly variacao_tipo?: VariacaoTipo;
	readonly icone: string;
	readonly cor: string;
	readonly formato: FormatoKpi;
	readonly descricao?: string;
}

// ========================================
// GRÁFICOS
// ========================================

export interface DatasetGrafico {
	readonly label: string;
	readonly data: readonly number[];
	readonly backgroundColor?: string | readonly string[];
	readonly borderColor?: string;
	readonly fill?: boolean;
	readonly tension?: number;
}

export interface DadosGrafico {
	readonly labels: readonly string[];
	readonly datasets: readonly DatasetGrafico[];
}

export interface ConfigGrafico {
	readonly tipo: "linha" | "barra" | "pizza" | "area";
	readonly titulo?: string;
	readonly legenda?: boolean;
	readonly altura?: number;
}

// ========================================
// TABELAS
// ========================================

export interface ConfigPaginacao {
	readonly pagina_atual: number;
	readonly itens_por_pagina: number;
	readonly total_itens: number;
	readonly total_paginas: number;
}

export interface ConfigOrdenacao {
	readonly campo: string;
	readonly direcao: "asc" | "desc";
}

export interface ConfigTabela {
	readonly paginacao: ConfigPaginacao;
	readonly ordenacao: ConfigOrdenacao;
	readonly busca?: string;
}

// ========================================
// EXPORTAÇÃO
// ========================================

export type TipoExportacao = "pdf" | "excel" | "csv";

export type OrientacaoPdf = "retrato" | "paisagem";

export interface OpcoesExportacao {
	readonly tipo: TipoExportacao;
	readonly incluir_graficos: boolean;
	readonly incluir_tabelas: boolean;
	readonly orientacao?: OrientacaoPdf;
	readonly nome_arquivo?: string;
}

export interface ResultadoExportacao {
	readonly sucesso: boolean;
	readonly url?: string;
	readonly erro?: string;
	readonly nome_arquivo?: string;
}

// ========================================
// COMPARATIVOS
// ========================================

export interface DadosComparativo {
	readonly periodo_atual: number;
	readonly periodo_anterior: number;
	readonly variacao: number;
	readonly variacao_percentual: number;
	readonly variacao_tipo: VariacaoTipo;
}

// ========================================
// ESTADO DE LOADING
// ========================================

export interface EstadoLoading {
	readonly carregando: boolean;
	readonly erro: string | null;
	readonly ultima_atualizacao: TimestampTz | null;
}

// ========================================
// FILTROS AVANÇADOS
// ========================================

export interface FiltrosAvancados {
	readonly periodo: FiltrosPeriodo;
	readonly status?: readonly string[];
	readonly tipo_entrega?: readonly string[];
	readonly forma_pagamento?: readonly string[];
	readonly categoria_id?: UUID;
	readonly produto_id?: UUID;
}

// ========================================
// RESUMO GERAL
// ========================================

export interface ResumoGeral {
	readonly total_pedidos: number;
	readonly receita_total: number;
	readonly ticket_medio: number;
	readonly taxa_cancelamento: number;
	readonly produtos_vendidos: number;
	readonly cupons_usados: number;
}
