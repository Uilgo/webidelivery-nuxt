/**
 * 📌 Tipos do Sistema
 *
 * Tipos relacionados ao sistema interno, incluindo logs de auditoria,
 * LGPD, códigos de convite e funcionalidades administrativas.
 */

import type { UUID, TimestampTz, Json, LogAcao, Cargo } from "./database";

// ========================================
// LOGS DE AUDITORIA
// ========================================

export interface LogAuditoria {
	readonly id: UUID;
	readonly created_at: TimestampTz;
	readonly usuario_id: UUID | null;
	readonly usuario_email: string | null;
	readonly usuario_cargo: string | null;
	readonly acao: LogAcao;
	readonly tabela: string;
	readonly registro_id: UUID | null;
	readonly dados_anteriores: Json | null;
	readonly dados_novos: Json | null;
	readonly ip_address: string | null;
	readonly user_agent: string | null;
	readonly metadata: Json | null;
}

// ========================================
// CÓDIGOS DE CONVITE
// ========================================

export interface CodigoConvite {
	readonly id: UUID;
	readonly created_at: TimestampTz;
	readonly codigo: string;
	readonly tipo: TipoCodigoConvite;
	readonly criado_por: UUID;
	readonly estabelecimento_id: UUID | null;
	readonly cargo_pretendido: Cargo | null;
	readonly expires_at: TimestampTz | null;
	readonly descricao: string | null;
	readonly usado: boolean;
	readonly usado_por: UUID | null;
	readonly usado_em: TimestampTz | null;
}

// ========================================
// LGPD - CONSENTIMENTOS
// ========================================

export interface LgpdConsentimento {
	readonly id: UUID;
	readonly created_at: TimestampTz;
	readonly usuario_id: UUID;
	readonly tipo: TipoConsentimentoLgpd;
	readonly concedido: boolean;
	readonly versao_documento: string | null;
	readonly ip_address: string | null;
	readonly user_agent: string | null;
}

// ========================================
// LGPD - SOLICITAÇÕES DE EXCLUSÃO
// ========================================

export interface LgpdSolicitacaoExclusao {
	readonly id: UUID;
	readonly created_at: TimestampTz;
	readonly updated_at: TimestampTz;
	readonly usuario_id: UUID;
	readonly usuario_email: string;
	readonly status: StatusSolicitacaoLgpd;
	readonly motivo: string | null;
	readonly processada_em: TimestampTz | null;
	readonly processada_por: UUID | null;
	readonly observacoes: string | null;
}

// ========================================
// TIPOS E ENUMS
// ========================================

export type TipoCodigoConvite = "gerente_plataforma" | "membro_equipe";

export type TipoConsentimentoLgpd =
	| "termos_uso"
	| "politica_privacidade"
	| "marketing_email"
	| "marketing_whatsapp"
	| "compartilhamento_dados";

export type StatusSolicitacaoLgpd = "pendente" | "em_analise" | "concluida" | "cancelada";

// ========================================
// TIPOS DERIVADOS PARA USO NA APLICAÇÃO
// ========================================

export interface LogAuditoriaCompleto extends LogAuditoria {
	readonly acao_formatada: string;
	readonly usuario_nome_completo: string | null;
	readonly tempo_decorrido: string;
	readonly alteracoes_resumo: string | null;
}

export interface CodigoConviteCompleto extends CodigoConvite {
	readonly expirado: boolean;
	readonly dias_restantes: number | null;
	readonly criado_por_nome: string;
	readonly usado_por_nome: string | null;
	readonly usado_por_email: string | null;
}

export interface LgpdConsentimentoCompleto extends LgpdConsentimento {
	readonly tipo_formatado: string;
	readonly status_formatado: string;
	readonly data_formatada: string;
}

export interface LgpdSolicitacaoCompleta extends LgpdSolicitacaoExclusao {
	readonly status_formatado: string;
	readonly processada_por_nome: string | null;
	readonly tempo_processamento: string | null;
	readonly pode_processar: boolean;
}

// ========================================
// TIPOS PARA FORMULÁRIOS
// ========================================

export interface CodigoConviteFormData {
	readonly tipo: TipoCodigoConvite;
	readonly cargo_pretendido?: Cargo;
	readonly dias_validade?: number;
	readonly descricao?: string;
}

export interface LgpdConsentimentoFormData {
	readonly termos_uso: boolean;
	readonly politica_privacidade: boolean;
	readonly marketing_email: boolean;
	readonly marketing_whatsapp: boolean;
	readonly compartilhamento_dados: boolean;
}

export interface LgpdSolicitacaoFormData {
	readonly motivo?: string;
	readonly confirmar_exclusao: boolean;
}

export interface ProcessarSolicitacaoFormData {
	readonly aprovar: boolean;
	readonly observacoes?: string;
}

// ========================================
// TIPOS PARA RELATÓRIOS E ESTATÍSTICAS
// ========================================

export interface EstatisticasAuditoria {
	readonly total_logs: number;
	readonly logs_por_acao: Record<LogAcao, number>;
	readonly logs_por_tabela: Record<string, number>;
	readonly usuarios_mais_ativos: UsuarioAtividade[];
	readonly periodo_analise: {
		readonly inicio: TimestampTz;
		readonly fim: TimestampTz;
	};
}

export interface UsuarioAtividade {
	readonly usuario_id: UUID;
	readonly usuario_nome: string;
	readonly usuario_email: string;
	readonly total_acoes: number;
	readonly ultima_atividade: TimestampTz;
}

export interface EstatisticasLgpd {
	readonly total_consentimentos: number;
	readonly consentimentos_por_tipo: Record<TipoConsentimentoLgpd, number>;
	readonly total_solicitacoes_exclusao: number;
	readonly solicitacoes_por_status: Record<StatusSolicitacaoLgpd, number>;
	readonly tempo_medio_processamento: number;
	readonly taxa_aprovacao: number;
}

export interface EstatisticasConvites {
	readonly total_codigos: number;
	readonly codigos_por_tipo: Record<TipoCodigoConvite, number>;
	readonly codigos_usados: number;
	readonly codigos_expirados: number;
	readonly taxa_utilizacao: number;
	readonly tempo_medio_uso: number;
}

// ========================================
// TIPOS PARA EXPORTAÇÃO DE DADOS
// ========================================

export interface ExportacaoDadosUsuario {
	readonly perfil: PerfilExportacao;
	readonly consentimentos: LgpdConsentimento[];
	readonly logs_atividade: LogAuditoriaResumo[];
	readonly estabelecimento?: EstabelecimentoSistema;
	readonly data_exportacao: TimestampTz;
	readonly versao_exportacao: string;
}

export interface PerfilExportacao {
	readonly id: UUID;
	readonly nome: string;
	readonly sobrenome: string;
	readonly email: string;
	readonly cargo: Cargo;
	readonly created_at: TimestampTz;
}

export interface LogAuditoriaResumo {
	readonly tabela: string;
	readonly acao: LogAcao;
	readonly data: TimestampTz;
	readonly ip_address: string | null;
}

export interface EstabelecimentoSistema {
	readonly id: UUID;
	readonly nome: string;
	readonly slug: string;
	readonly cargo_usuario: Cargo;
}

// ========================================
// TIPOS PARA FUNÇÕES RPC
// ========================================

export interface ParametrosGerarCodigo {
	readonly tipo: TipoCodigoConvite;
	readonly cargo_pretendido?: Cargo;
	readonly dias_validade?: number;
	readonly descricao?: string;
}

export interface ParametrosValidarCodigo {
	readonly codigo: string;
}

export interface ResultadoValidacaoCodigo {
	readonly valido: boolean;
	readonly tipo: TipoCodigoConvite | null;
	readonly cargo_pretendido: Cargo | null;
	readonly estabelecimento_id: UUID | null;
	readonly motivo_invalido?: string;
}

export interface ParametrosRegistrarConsentimento {
	readonly tipo: TipoConsentimentoLgpd;
	readonly concedido: boolean;
	readonly versao_documento?: string;
}

export interface ParametrosProcessarExclusao {
	readonly solicitacao_id: UUID;
	readonly aprovar: boolean;
	readonly observacoes?: string;
}

// ========================================
// CONSTANTES E ENUMS
// ========================================

export const TIPOS_CODIGO_CONVITE: readonly TipoCodigoConvite[] = [
	"gerente_plataforma",
	"membro_equipe",
] as const;

export const TIPOS_CONSENTIMENTO_LGPD: readonly TipoConsentimentoLgpd[] = [
	"termos_uso",
	"politica_privacidade",
	"marketing_email",
	"marketing_whatsapp",
	"compartilhamento_dados",
] as const;

export const STATUS_SOLICITACAO_LGPD: readonly StatusSolicitacaoLgpd[] = [
	"pendente",
	"em_analise",
	"concluida",
	"cancelada",
] as const;

// Configurações de códigos de convite
export const PREFIXO_CODIGO_WEBI = "WEBI";
export const PREFIXO_CODIGO_EQUIPE = "EQUIPE";
export const TAMANHO_CODIGO = 12;
export const VALIDADE_PADRAO_DIAS = 30;

// Configurações de logs
export const TABELAS_AUDITADAS = [
	"perfis",
	"estabelecimentos",
	"categorias",
	"produtos",
	"produto_variacoes",
	"grupos_adicionais",
	"adicionais",
	"combos",
	"cupons",
	"banners",
	"promocoes",
] as const;

// Configurações LGPD
export const VERSAO_TERMOS_ATUAL = "1.0";
export const VERSAO_PRIVACIDADE_ATUAL = "1.0";
export const TEMPO_RETENCAO_LOGS_DIAS = 365;
export const TEMPO_PROCESSAMENTO_EXCLUSAO_DIAS = 30;
