/**
 * 📌 Tipos para Produtos do Cardápio
 *
 * Baseado na estrutura real do banco de dados Supabase.
 * Inclui produtos e variações.
 */

import type { UUID, TimestampTz } from "#shared/types/database";

export interface Produto {
	readonly id: UUID;
	readonly created_at: TimestampTz;
	readonly updated_at: TimestampTz;
	readonly estabelecimento_id: UUID;
	readonly categoria_id: UUID;
	readonly nome: string;
	readonly descricao: string | null;
	readonly imagem_url: string | null;
	readonly ordem: number;
	readonly ativo: boolean;
	readonly destaque: boolean;
	readonly em_promocao: boolean;
	readonly promocao_tipo: "percentual" | "valor_fixo" | null;
	readonly promocao_valor: number | null;
	readonly promocao_inicio: TimestampTz | null;
	readonly promocao_fim: TimestampTz | null;
	readonly total_vendas: number;
}

export interface ProdutoVariacao {
	readonly id: UUID;
	readonly created_at: TimestampTz;
	readonly updated_at: TimestampTz;
	readonly produto_id: UUID;
	readonly nome: string;
	readonly preco: number;
	readonly preco_promocional: number | null;
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

export interface ProdutoCreateData {
	categoria_id: UUID;
	nome: string;
	descricao?: string;
	imagem_url?: string;
	ordem?: number;
	ativo?: boolean;
	destaque?: boolean;
	em_promocao?: boolean;
	promocao_tipo?: "percentual" | "valor_fixo" | null;
	promocao_valor?: number | null;
	promocao_inicio?: string | null;
	promocao_fim?: string | null;
	variacoes?: ProdutoVariacaoCreateData[];
	grupos_adicionais_ids?: UUID[];
}

export interface ProdutoUpdateData {
	nome: string;
	descricao?: string | null;
	imagem_url?: string | null;
	ativo?: boolean;
	destaque?: boolean;
	em_promocao?: boolean;
	promocao_tipo?: "percentual" | "valor_fixo" | null;
	promocao_valor?: number | null;
	promocao_inicio?: string | null;
	promocao_fim?: string | null;
	categoria_id?: UUID | null;
	variacoes?: ProdutoVariacaoCreateData[];
	grupos_adicionais_ids?: UUID[];
}

export interface ProdutoVariacaoCreateData {
	nome: string;
	preco: number;
	preco_promocional?: number | null;
	ordem?: number;
}

export interface ProdutoVariacaoUpdateData {
	nome?: string;
	preco?: number;
	preco_promocional?: number;
	ordem?: number;
	ativo?: boolean;
}

export interface ProdutoFilters {
	busca?: string;
	categoria_id?: UUID;
	ativo?: boolean;
	destaque?: boolean;
	em_promocao?: boolean;
	ordenacao?: "nome" | "ordem" | "total_vendas" | "created_at";
	direcao?: "asc" | "desc";
}

export interface ProdutoStats {
	total: number;
	ativos: number;
	inativos: number;
	em_destaque: number;
	em_promocao: number;
	vendas_total: number;
}

/**
 * Produto com campos computados para exibição
 */
export interface ProdutoComputado extends Produto {
	categoria_nome: string;
	variacoes_count: number;
	variacoes?: Array<{
		id: string;
		nome: string;
		preco: number;
		preco_promocional: number | null;
		ordem: number;
		ativo: boolean;
	}>;
	grupos_adicionais?: Array<{
		grupo_adicional_id: string;
	}>;
	preco_minimo?: number;
	preco_maximo?: number;
	status_display: string;
	pode_excluir: boolean;
}
