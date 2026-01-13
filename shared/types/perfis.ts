/**
 * 📌 Tipos de Perfis de Usuário
 *
 * Tipos relacionados aos perfis de usuários do sistema,
 * incluindo autenticação, permissões e dados pessoais.
 */

import type { UUID, TimestampTz, Cargo } from "./database";

// ========================================
// TABELA PERFIS
// ========================================

export interface Perfil {
	readonly id: UUID;
	readonly created_at: TimestampTz;
	readonly updated_at: TimestampTz;
	readonly estabelecimento_id: UUID | null;
	readonly cargo: Cargo;
	readonly nome: string;
	readonly sobrenome: string;
	readonly avatar_url: string | null;
	readonly email: string;
	readonly telefone: string | null;
	readonly ativo: boolean;
	readonly termos_aceitos_em: TimestampTz | null;
	readonly privacidade_aceita_em: TimestampTz | null;
}

// ========================================
// TIPOS DERIVADOS PARA USO NA APLICAÇÃO
// ========================================

export interface PerfilCompleto extends Perfil {
	readonly nome_completo: string;
	readonly iniciais: string;
	readonly eh_admin: boolean;
	readonly eh_gerente: boolean;
	readonly eh_staff: boolean;
	readonly eh_entregador: boolean;
	readonly eh_plataforma: boolean;
}

export interface PerfilResumo {
	readonly id: UUID;
	readonly nome: string;
	readonly sobrenome: string;
	readonly email: string;
	readonly cargo: Cargo;
	readonly avatar_url: string | null;
	readonly ativo: boolean;
}

// ========================================
// TIPOS PARA FORMULÁRIOS
// ========================================

export interface PerfilFormData {
	readonly nome: string;
	readonly sobrenome: string;
	readonly email: string;
	readonly telefone?: string;
	readonly avatar_url?: string;
}

export interface PerfilConfiguracao {
	readonly notificacoes_email: boolean;
	readonly notificacoes_push: boolean;
	readonly tema_escuro: boolean;
	readonly idioma: string;
}

// ========================================
// TIPOS PARA AUTENTICAÇÃO
// ========================================

export interface LoginCredentials {
	readonly email: string;
	readonly password: string;
}

export interface RegisterData {
	readonly nome: string;
	readonly sobrenome: string;
	readonly email: string;
	readonly password: string;
	readonly confirm_password: string;
}

export interface AuthResponse {
	readonly user: Perfil;
	readonly session: {
		readonly access_token: string;
		readonly refresh_token: string;
		readonly expires_in: number;
		readonly expires_at: number;
	};
}

// ========================================
// TIPOS PARA PERMISSÕES
// ========================================

export interface PermissaoVerificacao {
	readonly cargo_usuario: Cargo;
	readonly cargos_permitidos: readonly Cargo[];
	readonly estabelecimento_id?: UUID;
}

export type HieraquiaCargo = {
	readonly [K in Cargo]: number;
};

// ========================================
// CONSTANTES RELACIONADAS A PERFIS
// ========================================

export const HIERARQUIA_CARGOS: HieraquiaCargo = {
	super_admin: 6,
	gerente_plataforma: 5,
	admin: 4,
	gerente: 3,
	staff: 2,
	entregador: 1,
} as const;

export const CARGOS_PLATAFORMA: readonly Cargo[] = ["super_admin", "gerente_plataforma"] as const;

export const CARGOS_ESTABELECIMENTO: readonly Cargo[] = [
	"admin",
	"gerente",
	"staff",
	"entregador",
] as const;
