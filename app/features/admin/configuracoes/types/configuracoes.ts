/**
 * 📌 Tipos - Configurações
 *
 * Tipos TypeScript específicos da feature de configurações.
 * Baseados nos campos JSONB da tabela estabelecimentos e tipos existentes em shared/types.
 */

import type {
	ConfigGeral,
	ConfigPagamento,
	ConfigTema,
	HorarioFuncionamento,
} from "#shared/types/estabelecimentos";

/**
 * Tipos de estabelecimento disponíveis
 */
export type TipoEstabelecimento =
	| "restaurante"
	| "lanchonete"
	| "pizzaria"
	| "hamburgueria"
	| "sorveteria"
	| "padaria"
	| "cafeteria"
	| "outro";

/**
 * Dados da empresa (campos diretos da tabela estabelecimentos)
 */
export interface DadosEmpresa {
	nome: string;
	slug: string;
	descricao?: string;
	logo_url?: string;
	logo_url_dark?: string;
	capa_url?: string;
	foto_capa_url?: string;
	whatsapp?: string;
	cor_fundo?: string;
}

/**
 * Configurações gerais (config_geral JSONB)
 * Reutiliza tipo existente de shared/types/estabelecimentos
 */
export type ConfiguracoesGerais = ConfigGeral;

/**
 * Configurações de pagamento (config_pagamento JSONB)
 * Reutiliza tipo existente de shared/types/estabelecimentos
 */
export type ConfiguracoesPagamento = ConfigPagamento;

/**
 * Configurações de tema (config_tema JSONB)
 * Reutiliza tipo existente de shared/types/estabelecimentos
 */
export type ConfiguracoesTema = ConfigTema;

/**
 * Horários de funcionamento
 * Reutiliza tipo existente de shared/types/estabelecimentos
 */
export type ConfiguracoesHorarios = HorarioFuncionamento[];

/**
 * Sessão ativa (para tab de segurança)
 */
export interface SessaoAtiva {
	id: string;
	dispositivo: string;
	ip: string;
	localizacao?: string;
	ultimo_acesso: Date;
	atual: boolean;
}

/**
 * Log de acesso (baseado na tabela logs_auditoria)
 */
export interface LogAcesso {
	id: string;
	created_at: Date;
	usuario_email: string | null;
	usuario_cargo: string | null;
	acao: "criar" | "atualizar" | "deletar" | "login" | "logout" | "visualizar" | "exportar";
	ip_address: string | null;
	user_agent: string | null;
	metadata: Record<string, unknown>;
}
