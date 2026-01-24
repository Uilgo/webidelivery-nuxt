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
	readonly categoria_pai_id: UUID | null; // ✅ Campo para hierarquia de subcategorias
	readonly em_promocao: boolean;
	readonly promocao_tipo: "percentual" | "valor_fixo" | null;
	readonly promocao_valor: number | null;
	readonly promocao_inicio: TimestampTz | null;
	readonly promocao_fim: TimestampTz | null;
}

export interface CategoriaCreateData {
	nome: string;
	descricao?: string;
	imagem_url?: string;
	ordem?: number;
	categoria_pai_id?: UUID; // ✅ Permite criar subcategoria
	em_promocao?: boolean;
	promocao_tipo?: "percentual" | "valor_fixo" | null;
	promocao_valor?: number | null;
	promocao_inicio?: string | null;
	promocao_fim?: string | null;
}

export interface CategoriaUpdateData {
	nome?: string;
	descricao?: string;
	imagem_url?: string;
	ordem?: number;
	ativo?: boolean;
	categoria_pai_id?: UUID; // ✅ Permite alterar hierarquia
	em_promocao?: boolean;
	promocao_tipo?: "percentual" | "valor_fixo" | null;
	promocao_valor?: number | null;
	promocao_inicio?: string | null;
	promocao_fim?: string | null;
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

/**
 * Categoria com campos computados para exibição
 */
export interface CategoriaComputada extends Categoria {
	produtos_count: number;
	status_display: string;
	pode_excluir: boolean;
	subcategorias?: CategoriaComputada[]; // ✅ Lista de subcategorias
	nivel: number; // ✅ Nível na hierarquia (0 = pai, 1 = subcategoria)
}
