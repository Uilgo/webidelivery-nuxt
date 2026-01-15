/**
 * 📌 Tipos para Combos do Cardápio
 *
 * Estrutura SIMPLIFICADA - apenas a tabela principal de combos.
 */

import type { UUID, TimestampTz } from "#shared/types/database";

// =====================================================
// ENTIDADE PRINCIPAL
// =====================================================

export interface Combo {
	readonly id: UUID;
	readonly created_at: TimestampTz;
	readonly updated_at: TimestampTz;
	readonly estabelecimento_id: UUID;
	readonly nome: string;
	readonly descricao: string | null;
	readonly imagem_url: string | null;
	readonly preco_combo: number;
	readonly preco_original: number;
	readonly ativo: boolean;
	readonly destaque: boolean;
	readonly ordem: number;
	readonly data_inicio: TimestampTz | null;
	readonly data_fim: TimestampTz | null;
}

// =====================================================
// DTOs (Data Transfer Objects)
// =====================================================

export interface ComboCreateData {
	estabelecimento_id: UUID;
	nome: string;
	descricao?: string;
	imagem_url?: string;
	preco_combo: number;
	preco_original: number;
	destaque?: boolean;
	data_inicio?: string;
	data_fim?: string;
}

export interface ComboUpdateData {
	nome: string;
	descricao?: string;
	imagem_url?: string;
	preco_combo: number;
	preco_original: number;
	destaque: boolean;
	data_inicio?: string;
	data_fim?: string;
}

// =====================================================
// FILTROS
// =====================================================

export interface ComboFilters {
	busca?: string;
	ativo?: boolean;
	destaque?: boolean;
	ordenacao?: "nome" | "ordem" | "created_at";
	direcao?: "asc" | "desc";
}

// =====================================================
// ESTATÍSTICAS
// =====================================================

export interface ComboStats {
	total: number;
	ativos: number;
	inativos: number;
	destaque: number;
}
