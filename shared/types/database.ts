/**
 * 📌 Tipos Globais do Banco de Dados
 *
 * Este arquivo contém apenas tipos de caráter global que são utilizados
 * em múltiplos contextos do sistema. Tipos específicos de domínio estão
 * organizados em arquivos separados.
 */

// Tipo JSON genérico do Supabase
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

// Tipos base para identificadores
export type UUID = string;
export type TimestampTz = string;

// ENUMs utilizados globalmente no sistema
export type Cargo =
	| "super_admin"
	| "gerente_plataforma"
	| "admin"
	| "gerente"
	| "staff"
	| "entregador";

export type EstabelecimentoStatus = "rascunho" | "ativo" | "inativo" | "suspenso";

export type ModoFuncionamento = "automatico" | "manual";

export type LogAcao =
	| "criar"
	| "atualizar"
	| "deletar"
	| "login"
	| "logout"
	| "visualizar"
	| "exportar";

// Constantes dos ENUMs para validação
export const CARGOS = [
	"super_admin",
	"gerente_plataforma",
	"admin",
	"gerente",
	"staff",
	"entregador",
] as const;

export const ESTABELECIMENTO_STATUS = ["rascunho", "ativo", "inativo", "suspenso"] as const;

export const MODO_FUNCIONAMENTO = ["automatico", "manual"] as const;

export const LOG_ACOES = [
	"criar",
	"atualizar",
	"deletar",
	"login",
	"logout",
	"visualizar",
	"exportar",
] as const;
