/**
 * 📌 Tipos para Combos do Cardápio
 *
 * Baseado na estrutura real do banco de dados Supabase.
 * Inclui combos, itens fixos e grupos de escolha.
 */

import type { UUID, TimestampTz } from "#shared/types/database";

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

export interface ComboItem {
	readonly id: UUID;
	readonly created_at: TimestampTz;
	readonly combo_id: UUID;
	readonly produto_id: UUID;
	readonly variacao_id: UUID | null;
	readonly quantidade: number;
	readonly preco_original: number;
	readonly ordem: number;
}

export interface ComboGrupoEscolha {
	readonly id: UUID;
	readonly created_at: TimestampTz;
	readonly updated_at: TimestampTz;
	readonly combo_id: UUID;
	readonly nome: string;
	readonly descricao: string | null;
	readonly min_selecao: number;
	readonly max_selecao: number;
	readonly obrigatorio: boolean;
	readonly ordem: number;
}

export interface ComboGrupoOpcao {
	readonly id: UUID;
	readonly created_at: TimestampTz;
	readonly grupo_id: UUID;
	readonly produto_id: UUID;
	readonly variacao_id: UUID | null;
	readonly preco_adicional: number;
	readonly ordem: number;
}

export interface ComboCreateData {
	nome: string;
	descricao?: string;
	imagem_url?: string;
	preco_combo: number;
	preco_original: number;
	destaque?: boolean;
	ordem?: number;
	data_inicio?: string;
	data_fim?: string;
}

export interface ComboUpdateData {
	nome?: string;
	descricao?: string;
	imagem_url?: string;
	preco_combo?: number;
	preco_original?: number;
	ativo?: boolean;
	destaque?: boolean;
	ordem?: number;
	data_inicio?: string;
	data_fim?: string;
}

export interface ComboItemCreateData {
	produto_id: UUID;
	variacao_id?: UUID;
	quantidade: number;
	preco_original: number;
	ordem?: number;
}

export interface ComboGrupoEscolhaCreateData {
	nome: string;
	descricao?: string;
	min_selecao?: number;
	max_selecao?: number;
	obrigatorio?: boolean;
	ordem?: number;
}

export interface ComboGrupoOpcaoCreateData {
	produto_id: UUID;
	variacao_id?: UUID;
	preco_adicional?: number;
	ordem?: number;
}

export interface ComboFilters {
	busca?: string;
	ativo?: boolean;
	destaque?: boolean;
	periodo_valido?: boolean;
	ordenacao?: "nome" | "ordem" | "preco_combo" | "created_at";
	direcao?: "asc" | "desc";
}

export interface ComboStats {
	total: number;
	ativos: number;
	inativos: number;
	em_destaque: number;
	periodo_valido: number;
	economia_media: number;
}
