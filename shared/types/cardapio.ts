/**
 * 📌 Tipos de Cardápio e Combos
 *
 * Tipos relacionados ao sistema de cardápio, incluindo categorias,
 * produtos, variações, adicionais e combos.
 */

import type { UUID, TimestampTz, Json } from "./database";

// ========================================
// CATEGORIAS
// ========================================

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

// ========================================
// PRODUTOS
// ========================================

export interface Produto {
	readonly id: UUID;
	readonly created_at: TimestampTz;
	readonly updated_at: TimestampTz;
	readonly categoria_id: UUID;
	readonly estabelecimento_id: UUID;
	readonly nome: string;
	readonly descricao: string | null;
	readonly imagem_url: string | null;
	readonly ordem: number;
	readonly ativo: boolean;
	readonly destaque: boolean;
	readonly em_promocao: boolean;
	readonly total_vendas: number;
}

// ========================================
// VARIAÇÕES DE PRODUTO
// ========================================

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

// ========================================
// GRUPOS DE ADICIONAIS
// ========================================

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

// ========================================
// ADICIONAIS
// ========================================

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

// ========================================
// PRODUTO GRUPOS ADICIONAIS (RELACIONAMENTO)
// ========================================

export interface ProdutoGrupoAdicional {
	readonly id: UUID;
	readonly created_at: TimestampTz;
	readonly produto_id: UUID;
	readonly grupo_adicional_id: UUID;
	readonly ordem: number;
}

// ========================================
// COMBOS
// ========================================

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
	readonly ordem: number;
	readonly ativo: boolean;
	readonly destaque: boolean;
	readonly data_inicio: TimestampTz | null;
	readonly data_fim: TimestampTz | null;
}

// ========================================
// COMBO ITENS FIXOS
// ========================================

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

// ========================================
// COMBO GRUPOS DE ESCOLHA
// ========================================

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

// ========================================
// COMBO GRUPO OPÇÕES
// ========================================

export interface ComboGrupoOpcao {
	readonly id: UUID;
	readonly created_at: TimestampTz;
	readonly grupo_id: UUID;
	readonly produto_id: UUID;
	readonly variacao_id: UUID | null;
	readonly preco_adicional: number;
	readonly ordem: number;
}

// ========================================
// TIPOS DERIVADOS PARA USO NA APLICAÇÃO
// ========================================

export interface CategoriaCompleta extends Categoria {
	readonly total_produtos: number;
	readonly produtos_ativos: number;
}

export interface ProdutoCompleto extends Produto {
	readonly categoria_nome: string;
	readonly variacoes: ProdutoVariacao[];
	readonly grupos_adicionais: GrupoAdicionalCompleto[];
	readonly preco_minimo: number;
	readonly preco_maximo: number;
	readonly tem_variacoes: boolean;
	readonly tem_adicionais: boolean;
}

export interface GrupoAdicionalCompleto extends GrupoAdicional {
	readonly adicionais: Adicional[];
	readonly total_adicionais: number;
}

export interface ComboCompleto extends Combo {
	readonly itens_fixos: ComboItemCompleto[];
	readonly grupos_escolha: ComboGrupoEscolhaCompleto[];
	readonly economia_valor: number;
	readonly economia_percentual: number;
	readonly periodo_valido: boolean;
}

export interface ComboItemCompleto extends ComboItem {
	readonly produto_nome: string;
	readonly produto_imagem: string | null;
	readonly variacao_nome: string | null;
}

export interface ComboGrupoEscolhaCompleto extends ComboGrupoEscolha {
	readonly opcoes: ComboGrupoOpcaoCompleta[];
}

export interface ComboGrupoOpcaoCompleta extends ComboGrupoOpcao {
	readonly produto_nome: string;
	readonly produto_imagem: string | null;
	readonly variacao_nome: string | null;
}

// ========================================
// TIPOS PARA FORMULÁRIOS
// ========================================

export interface CategoriaFormData {
	readonly nome: string;
	readonly descricao?: string;
	readonly imagem_url?: string;
}

export interface ProdutoFormData {
	readonly nome: string;
	readonly descricao?: string;
	readonly imagem_url?: string;
	readonly categoria_id: UUID;
	readonly destaque?: boolean;
	readonly variacoes: VariacaoFormData[];
	readonly grupos_adicionais_ids?: UUID[];
}

export interface VariacaoFormData {
	readonly nome: string;
	readonly preco: number;
	readonly preco_promocional?: number;
}

export interface GrupoAdicionalFormData {
	readonly nome: string;
	readonly descricao?: string;
	readonly min_selecao: number;
	readonly max_selecao: number;
	readonly obrigatorio: boolean;
	readonly adicionais: AdicionalFormData[];
}

export interface AdicionalFormData {
	readonly nome: string;
	readonly descricao?: string;
	readonly preco: number;
}

export interface ComboFormData {
	readonly nome: string;
	readonly descricao?: string;
	readonly imagem_url?: string;
	readonly preco_combo: number;
	readonly data_inicio?: string;
	readonly data_fim?: string;
	readonly destaque?: boolean;
	readonly itens_fixos: ComboItemFormData[];
	readonly grupos_escolha: ComboGrupoEscolhaFormData[];
}

export interface ComboItemFormData {
	readonly produto_id: UUID;
	readonly variacao_id?: UUID;
	readonly quantidade: number;
}

export interface ComboGrupoEscolhaFormData {
	readonly nome: string;
	readonly descricao?: string;
	readonly min_selecao: number;
	readonly max_selecao: number;
	readonly obrigatorio: boolean;
	readonly opcoes: ComboOpcaoFormData[];
}

export interface ComboOpcaoFormData {
	readonly produto_id: UUID;
	readonly variacao_id?: UUID;
	readonly preco_adicional: number;
}

// ========================================
// TIPOS PARA VIEWS DO SUPABASE
// ========================================

export interface ViewCardapioPublico {
	readonly estabelecimento_id: UUID | null;
	readonly estabelecimento_nome: string | null;
	readonly estabelecimento_slug: string | null;
	readonly estabelecimento_logo: string | null;
	readonly estabelecimento_aberto: boolean | null;
	readonly categoria_id: UUID | null;
	readonly categoria_nome: string | null;
	readonly categoria_descricao: string | null;
	readonly categoria_imagem: string | null;
	readonly categoria_ordem: number | null;
	readonly produto_id: UUID | null;
	readonly produto_nome: string | null;
	readonly produto_descricao: string | null;
	readonly produto_imagem: string | null;
	readonly produto_ordem: number | null;
	readonly produto_destaque: boolean | null;
	readonly produto_em_promocao: boolean | null;
	readonly produto_total_vendas: number | null;
	readonly variacoes: Json | null;
	readonly grupos_adicionais: Json | null;
}

export interface ViewCombosAtivos {
	readonly id: UUID | null;
	readonly nome: string | null;
	readonly descricao: string | null;
	readonly imagem_url: string | null;
	readonly preco_combo: number | null;
	readonly preco_original: number | null;
	readonly economia_valor: number | null;
	readonly economia_percentual: number | null;
	readonly ordem: number | null;
	readonly destaque: boolean | null;
	readonly data_inicio: TimestampTz | null;
	readonly data_fim: TimestampTz | null;
	readonly periodo_valido: boolean | null;
	readonly estabelecimento_id: UUID | null;
	readonly estabelecimento_nome: string | null;
	readonly estabelecimento_slug: string | null;
	readonly itens_fixos: Json | null;
	readonly grupos_escolha: Json | null;
	readonly total_itens_fixos: number | null;
	readonly total_grupos_escolha: number | null;
	readonly created_at: TimestampTz | null;
	readonly updated_at: TimestampTz | null;
}

export interface ViewProdutosResumo {
	readonly id: UUID | null;
	readonly nome: string | null;
	readonly descricao: string | null;
	readonly imagem_url: string | null;
	readonly ordem: number | null;
	readonly ativo: boolean | null;
	readonly destaque: boolean | null;
	readonly em_promocao: boolean | null;
	readonly total_vendas: number | null;
	readonly categoria_id: UUID | null;
	readonly categoria_nome: string | null;
	readonly categoria_ordem: number | null;
	readonly estabelecimento_id: UUID | null;
	readonly preco_minimo: number | null;
	readonly preco_original_minimo: number | null;
	readonly tem_promocao: boolean | null;
	readonly texto_preco: string | null;
	readonly total_variacoes_ativas: number | null;
	readonly total_grupos_adicionais: number | null;
	readonly created_at: TimestampTz | null;
	readonly updated_at: TimestampTz | null;
}

// ========================================
// CONSTANTES E ENUMS
// ========================================

export const ORDEM_PADRAO = 0;
export const MIN_PRECO = 0.01;
export const MAX_PRECO = 9999.99;
export const MIN_SELECAO_PADRAO = 0;
export const MAX_SELECAO_PADRAO = 10;
