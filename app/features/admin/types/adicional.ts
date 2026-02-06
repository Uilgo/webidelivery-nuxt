/**
 * 📌 Tipos para Grupos de Adicionais e Adicionais
 *
 * Baseado na estrutura real do banco de dados Supabase.
 * Grupos de adicionais são reutilizáveis entre produtos.
 */

import type { UUID, TimestampTz } from "#shared/types/database";

export interface GrupoAdicional {
	readonly id: UUID;
	readonly created_at: TimestampTz;
	readonly updated_at: TimestampTz;
	readonly estabelecimento_id: UUID;
	readonly nome: string;
	readonly descricao: string | null;
	readonly min_selecao: number;
	readonly max_selecao: number;
	readonly obrigatorio: boolean;
	readonly ordem: number;
	readonly ativo: boolean;
}

export interface Adicional {
	readonly id: UUID;
	readonly created_at: TimestampTz;
	readonly updated_at: TimestampTz;
	readonly grupo_id: UUID;
	readonly nome: string;
	readonly descricao: string | null;
	readonly preco: number;
	readonly ordem: number;
	readonly ativo: boolean;
}

export interface GrupoAdicionalCreateData {
	nome: string;
	descricao?: string | null;
	min_selecao?: number;
	max_selecao?: number;
	obrigatorio?: boolean;
}

export interface GrupoAdicionalUpdateData {
	nome: string;
	descricao?: string | null;
	min_selecao?: number;
	max_selecao?: number;
	obrigatorio?: boolean;
	ativo?: boolean;
}

export interface AdicionalCreateData {
	grupo_id: UUID;
	nome: string;
	descricao?: string | null;
	preco?: number;
}

export interface AdicionalUpdateData {
	nome: string;
	descricao?: string | null;
	preco?: number;
	ativo?: boolean;
}

export interface GrupoAdicionalFilters {
	busca?: string;
	ativo?: boolean;
	obrigatorio?: boolean;
	ordenacao?: "nome" | "ordem" | "created_at";
	direcao?: "asc" | "desc";
}

export interface GrupoAdicionalStats {
	total: number;
	ativos: number;
	inativos: number;
	obrigatorios: number;
	opcionais: number;
}

/**
 * Grupo de Adicional com campos computados para exibição
 */
export interface GrupoAdicionalComputado extends GrupoAdicional {
	adicionais?: Array<{
		id: string;
		nome: string;
		preco: number;
		ativo: boolean;
		descricao?: string | null;
	}>;
	adicionais_count: number;
	adicionais_ativos_count: number;
	preco_minimo?: number;
	preco_maximo?: number;
	status_display: string;
	obrigatorio_display: string;
	selecao_display: string;
	pode_excluir: boolean;
}

/**
 * Adicional com campos computados para exibição
 */
export interface AdicionalComputado extends Adicional {
	grupo_nome: string;
	status_display: string;
	preco_display: string;
	pode_excluir: boolean;
}
