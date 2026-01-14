/**
 * 📌 Tipos para Categorias do Cardápio
 *
 * Baseado na estrutura real do banco de dados Supabase.
 */

import type { UUID, TimestampTz } from "#shared/types/database";

export interface Categoria {
	readonly id: UUID;
	readonly created_at: TimestampTz;
	readonly updated_at: TimestampTz;
	readonly estabelecimento_id: UUID;
	readonly nome: string;
	readonly descricao: string | null;
	readonly imagem_url: string | null;
	readonly ordem: number;
	readonly ativo: boolean;
}

export interface CategoriaCreateData {
	nome: string;
	descricao?: string;
	imagem_url?: string;
	ordem?: number;
}

export interface CategoriaUpdateData {
	nome?: string;
	descricao?: string;
	imagem_url?: string;
	ordem?: number;
	ativo?: boolean;
}

export interface CategoriaFilters {
	busca?: string;
	ativo?: boolean;
	ordenacao?: "nome" | "ordem" | "created_at";
	direcao?: "asc" | "desc";
}

export interface CategoriaStats {
	total: number;
	ativas: number;
	inativas: number;
	produtos_total: number;
}
