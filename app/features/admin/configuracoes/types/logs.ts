/**
 * 📌 Tipos Locais da Feature de Logs
 *
 * Tipos específicos da interface de logs, complementando os tipos globais.
 */

import type { LogPeriodo } from "#shared/types/logs";

// ========================================
// TIPOS DE VISUALIZAÇÃO
// ========================================

export type LogViewMode = "list" | "grouped";
export type LogSortField = "created_at" | "acao" | "tabela" | "usuario_nome";
export type LogSortDirection = "asc" | "desc";

// ========================================
// TIPOS DE FILTROS UI
// ========================================

export interface LogFilterOption {
	readonly label: string;
	readonly value: string;
}

export interface LogPeriodoOption {
	readonly label: string;
	readonly value: LogPeriodo;
	readonly dias: number | null;
}

// ========================================
// TIPOS DE EXPORTAÇÃO
// ========================================

export interface ExportProgress {
	readonly isExporting: boolean;
	readonly progress: number;
	readonly total: number;
	readonly message: string;
}

// ========================================
// CONSTANTES
// ========================================

export const LOG_PERIODOS: LogPeriodoOption[] = [
	{ label: "Hoje", value: "hoje", dias: 1 },
	{ label: "Últimos 7 dias", value: "7_dias", dias: 7 },
	{ label: "Últimos 30 dias", value: "30_dias", dias: 30 },
	{ label: "Últimos 3 meses", value: "3_meses", dias: 90 },
	{ label: "Últimos 12 meses", value: "12_meses", dias: 365 },
	{ label: "Tudo", value: "tudo", dias: null },
];

export const LOG_ACOES_OPTIONS: LogFilterOption[] = [
	{ label: "Criar", value: "criar" },
	{ label: "Editar", value: "editar" },
	{ label: "Deletar", value: "deletar" },
	{ label: "Ativar", value: "ativar" },
	{ label: "Desativar", value: "desativar" },
	{ label: "Reordenar", value: "reordenar" },
	{ label: "Vincular", value: "vincular" },
	{ label: "Desvincular", value: "desvincular" },
];

export const LOG_TABELAS_OPTIONS: LogFilterOption[] = [
	{ label: "Produtos", value: "produtos" },
	{ label: "Categorias", value: "categorias" },
	{ label: "Adicionais", value: "adicionais" },
	{ label: "Grupos de Adicionais", value: "grupos_adicionais" },
	{ label: "Variações", value: "produto_variacoes" },
	{ label: "Combos", value: "combos" },
	{ label: "Pedidos", value: "pedidos" },
	{ label: "Cupons", value: "cupons" },
	{ label: "Banners", value: "banners" },
	{ label: "Equipe", value: "perfis" },
];

export const LOG_CATEGORIAS_OPTIONS: LogFilterOption[] = [
	{ label: "Segurança", value: "seguranca" },
	{ label: "Operacional", value: "operacional" },
	{ label: "Analytics", value: "analytics" },
];
