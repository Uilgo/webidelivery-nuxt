/**
 * 📌 Tipos para Adicionais do Cardápio
 *
 * Baseado na estrutura real do banco de dados Supabase.
 * Inclui grupos de adicionais e itens adicionais.
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

export interface ProdutoGrupoAdicional {
	readonly id: UUID;
	readonly created_at: TimestampTz;
	readonly produto_id: UUID;
	readonly grupo_adicional_id: UUID;
	readonly ordem: number;
}

export interface GrupoAdicionalCreateData {
	nome: string;
	descricao?: string;
	min_selecao?: number;
	max_selecao?: number;
	obrigatorio?: boolean;
	ordem?: number;
}

export interface GrupoAdicionalUpdateData {
	nome?: string;
	descricao?: string;
	min_selecao?: number;
	max_selecao?: number;
	obrigatorio?: boolean;
	ordem?: number;
	ativo?: boolean;
}

export interface AdicionalCreateData {
	nome: string;
	descricao?: string;
	preco: number;
	ordem?: number;
}

export interface AdicionalUpdateData {
	nome?: string;
	descricao?: string;
	preco?: number;
	ordem?: number;
	ativo?: boolean;
}

export interface GrupoAdicionalFilters {
	busca?: string;
	ativo?: boolean;
	ordenacao?: "nome" | "ordem" | "created_at";
	direcao?: "asc" | "desc";
}

export interface AdicionalFilters {
	busca?: string;
	grupo_id?: UUID;
	ativo?: boolean;
	preco_min?: number;
	preco_max?: number;
	ordenacao?: "nome" | "preco" | "ordem" | "created_at";
	direcao?: "asc" | "desc";
}

export interface GrupoAdicionalStats {
	total: number;
	ativos: number;
	inativos: number;
	adicionais_total: number;
	produtos_vinculados: number;
}
