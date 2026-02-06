/**
 * 📌 Tipos Globais do Sistema de Logs
 *
 * Tipos compartilhados entre frontend e backend para o sistema de auditoria.
 */

import type { UUID, TimestampTz } from "./database";

// ========================================
// ENUMS E TIPOS BASE
// ========================================

/**
 * Categoria do log na plataforma
 */
export type LogCategoria = "seguranca" | "operacional" | "analytics";

/**
 * Status de retenção do log
 */
export type LogRetencao = "permanente" | "12_meses" | "3_meses";

/**
 * Período de tempo para filtros
 */
export type LogPeriodo = "hoje" | "7_dias" | "30_dias" | "3_meses" | "12_meses" | "tudo";

// ========================================
// INTERFACES DE LOGS
// ========================================

/**
 * Log de Estabelecimento (operacional)
 */
export interface LogEstabelecimento {
	readonly id: UUID;
	readonly created_at: TimestampTz;
	readonly estabelecimento_id: UUID;
	readonly usuario_id: UUID | null;
	readonly usuario_email: string | null;
	readonly usuario_nome: string | null;
	readonly usuario_cargo: string | null;
	readonly acao: string;
	readonly tabela: string;
	readonly registro_id: UUID | null;
	readonly dados_anteriores: Record<string, unknown> | null;
	readonly dados_novos: Record<string, unknown> | null;
	readonly ip_address: string | null;
	readonly user_agent: string | null;
	readonly metadata: Record<string, unknown>;
}

/**
 * Log de Plataforma (segurança, operacional, analytics)
 */
export interface LogPlataforma {
	readonly id: UUID;
	readonly created_at: TimestampTz;
	readonly usuario_id: UUID | null;
	readonly usuario_email: string | null;
	readonly usuario_nome: string | null;
	readonly usuario_cargo: string | null;
	readonly estabelecimento_id: UUID | null;
	readonly acao: string;
	readonly categoria: LogCategoria;
	readonly tabela: string | null;
	readonly registro_id: UUID | null;
	readonly dados_anteriores: Record<string, unknown> | null;
	readonly dados_novos: Record<string, unknown> | null;
	readonly ip_address: string | null;
	readonly user_agent: string | null;
	readonly metadata: Record<string, unknown>;
}

// ========================================
// TIPOS COMPUTADOS
// ========================================

/**
 * Log com informações computadas para exibição
 */
export interface LogComputado extends LogEstabelecimento {
	readonly dias_ate_exclusao: number | null;
	readonly sera_excluido: boolean;
	readonly retencao: LogRetencao;
	readonly descricao_formatada: string;
}

/**
 * Log de Plataforma com informações computadas
 */
export interface LogPlataformaComputado extends LogPlataforma {
	readonly dias_ate_exclusao: number | null;
	readonly sera_excluido: boolean;
	readonly retencao: LogRetencao;
	readonly descricao_formatada: string;
	readonly estabelecimento_nome: string | null;
}

// ========================================
// FILTROS
// ========================================

/**
 * Filtros para logs de estabelecimento
 */
export interface LogEstabelecimentoFiltros {
	readonly periodo?: LogPeriodo;
	readonly data_inicio?: string;
	readonly data_fim?: string;
	readonly acao?: string;
	readonly tabela?: string;
	readonly usuario_id?: UUID;
	readonly search?: string;
}

/**
 * Filtros para logs de plataforma
 */
export interface LogPlataformaFiltros {
	readonly periodo?: LogPeriodo;
	readonly data_inicio?: string;
	readonly data_fim?: string;
	readonly categoria?: LogCategoria;
	readonly acao?: string;
	readonly estabelecimento_id?: UUID;
	readonly usuario_id?: UUID;
	readonly search?: string;
}

// ========================================
// ESTATÍSTICAS
// ========================================

/**
 * Estatísticas de logs do estabelecimento
 */
export interface LogEstabelecimentoStats {
	readonly total: number;
	readonly por_tabela: Record<string, number>;
	readonly por_acao: Record<string, number>;
	readonly por_usuario: Record<string, number>;
	readonly logs_proximos_exclusao: number;
	readonly periodo_mais_antigo: string | null;
	readonly periodo_mais_recente: string | null;
}

/**
 * Estatísticas de logs da plataforma
 */
export interface LogPlataformaStats {
	readonly total: number;
	readonly por_categoria: Record<LogCategoria, number>;
	readonly por_acao: Record<string, number>;
	readonly logs_seguranca: number;
	readonly logs_operacional: number;
	readonly logs_analytics: number;
	readonly logs_proximos_exclusao: number;
}

// ========================================
// AGRUPAMENTO POR PERÍODO
// ========================================

/**
 * Logs agrupados por mês
 */
export interface LogsPorMes {
	readonly mes: string; // 'YYYY-MM'
	readonly mes_formatado: string; // 'Janeiro/2024'
	readonly total: number;
	readonly dias_ate_exclusao: number | null;
	readonly sera_excluido: boolean;
	readonly logs: LogComputado[];
}

/**
 * Logs de plataforma agrupados por categoria
 */
export interface LogsPorCategoria {
	readonly categoria: LogCategoria;
	readonly total: number;
	readonly logs: LogPlataformaComputado[];
}

// ========================================
// EXPORTAÇÃO
// ========================================

/**
 * Opções de exportação de logs
 */
export interface LogExportOptions {
	readonly formato: "excel" | "csv" | "json";
	readonly filtros?: LogEstabelecimentoFiltros | LogPlataformaFiltros;
	readonly incluir_dados_completos?: boolean;
	readonly nome_arquivo?: string;
}

/**
 * Resultado da exportação
 */
export interface LogExportResult {
	readonly success: boolean;
	readonly url?: string;
	readonly filename?: string;
	readonly total_registros?: number;
	readonly tamanho_bytes?: number;
	readonly error?: string;
}

// ========================================
// REGISTRO DE LOGS
// ========================================

/**
 * Dados para registrar log de estabelecimento
 */
export interface RegistrarLogEstabelecimento {
	readonly estabelecimento_id: UUID;
	readonly usuario_id: UUID;
	readonly acao: string;
	readonly tabela: string;
	readonly registro_id?: UUID;
	readonly dados_anteriores?: Record<string, unknown>;
	readonly dados_novos?: Record<string, unknown>;
	readonly metadata?: Record<string, unknown>;
}

/**
 * Dados para registrar log de plataforma
 */
export interface RegistrarLogPlataforma {
	readonly usuario_id: UUID;
	readonly acao: string;
	readonly categoria: LogCategoria;
	readonly estabelecimento_id?: UUID;
	readonly tabela?: string;
	readonly registro_id?: UUID;
	readonly dados_anteriores?: Record<string, unknown>;
	readonly dados_novos?: Record<string, unknown>;
	readonly metadata?: Record<string, unknown>;
}

// ========================================
// UI STATE
// ========================================

/**
 * Estado da interface de logs
 */
export interface LogsUIState {
	readonly view_mode: "list" | "grouped";
	readonly filtros_visiveis: boolean;
	readonly periodo_selecionado: LogPeriodo;
	readonly tabela_selecionada: string | null;
	readonly acao_selecionada: string | null;
}

/**
 * Estado do modal de detalhes do log
 */
export interface LogModalState {
	readonly isOpen: boolean;
	readonly log: LogComputado | LogPlataformaComputado | null;
}

// ========================================
// CONSTANTES
// ========================================

/**
 * Mapeamento de ações para descrições legíveis
 */
export const LOG_ACOES_DESCRICAO: Record<string, string> = {
	// CRUD básico
	criar: "Criou",
	editar: "Editou",
	deletar: "Deletou",
	ativar: "Ativou",
	desativar: "Desativou",

	// Pedidos
	aceitar: "Aceitou",
	colocar_em_preparo: "Colocou em preparo",
	marcar_pronto: "Marcou como pronto",
	enviar_para_entrega: "Enviou para entrega",
	concluir: "Concluiu",
	cancelar: "Cancelou",

	// Promoções
	ativar_promocao: "Ativou promoção",
	desativar_promocao: "Desativou promoção",
	alterar_promocao: "Alterou promoção",

	// Autenticação
	login: "Fez login",
	logout: "Fez logout",
	signup: "Criou conta",

	// Outros
	reordenar: "Reordenou",
	vincular: "Vinculou",
	desvincular: "Desvinculou",
	exportar: "Exportou",
	visualizar: "Visualizou",
};

/**
 * Mapeamento de tabelas para nomes legíveis
 */
export const LOG_TABELAS_DESCRICAO: Record<string, string> = {
	produtos: "produto",
	categorias: "categoria",
	adicionais: "adicional",
	grupos_adicionais: "grupo de adicionais",
	produto_variacoes: "variação",
	combos: "combo",
	pedidos: "pedido",
	cupons: "cupom",
	banners: "banner",
	perfis: "membro da equipe",
	estabelecimentos: "estabelecimento",
	codigos_convite: "código de convite",
};

/**
 * Cores por categoria de log
 */
export const LOG_CATEGORIA_CORES: Record<LogCategoria, string> = {
	seguranca: "blue",
	operacional: "gray",
	analytics: "purple",
};

/**
 * Ícones por categoria de log
 */
export const LOG_CATEGORIA_ICONES: Record<LogCategoria, string> = {
	seguranca: "lucide:shield-check",
	operacional: "lucide:settings",
	analytics: "lucide:bar-chart",
};
