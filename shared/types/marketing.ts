/**
 * 📌 Tipos de Marketing
 *
 * Tipos relacionados ao sistema de marketing, incluindo cupons,
 * banners, promoções e campanhas.
 */

import type { UUID, TimestampTz } from "./database";

// ========================================
// CUPONS
// ========================================

export interface Cupom {
	readonly id: UUID;
	readonly created_at: TimestampTz;
	readonly updated_at: TimestampTz;
	readonly estabelecimento_id: UUID;
	readonly codigo: string;
	readonly tipo: TipoCupom;
	readonly valor_desconto: number;
	readonly valor_minimo: number | null;
	readonly limite_uso: number | null;
	readonly usos_realizados: number;
	readonly data_expiracao: TimestampTz | null;
	readonly ativo: boolean;
	readonly descricao: string | null;
	readonly ordem: number;
}

// ========================================
// BANNERS
// ========================================

export interface Banner {
	readonly id: UUID;
	readonly created_at: TimestampTz;
	readonly updated_at: TimestampTz;
	readonly estabelecimento_id: UUID;
	readonly titulo: string;
	readonly descricao: string | null;
	readonly tipo: TipoBanner;
	readonly tipo_conteudo: TipoConteudoBanner;
	readonly imagem_url: string | null;
	readonly link_url: string | null;
	readonly cor_fundo: string | null;
	readonly cor_texto: string | null;
	readonly texto_cta: string | null;
	readonly texto_posicao: TipoPosicaoTexto | null;
	readonly texto_cor_fundo: string | null;
	readonly ordem: number;
	readonly ativo: boolean;
}

// ========================================
// PROMOÇÕES
// ========================================

export interface Promocao {
	readonly id: UUID;
	readonly created_at: TimestampTz;
	readonly updated_at: TimestampTz;
	readonly estabelecimento_id: UUID;
	readonly nome: string;
	readonly descricao: string | null;
	readonly tipo: TipoPromocao;
	readonly desconto: number;
	readonly data_inicio: TimestampTz;
	readonly data_fim: TimestampTz | null;
	readonly ativo: boolean;
	readonly ordem: number;
}

// ========================================
// TIPOS E ENUMS
// ========================================

export type TipoCupom = "percentual" | "valor_fixo" | "frete_gratis";

export type TipoBanner = "carrossel" | "destaque" | "popup";

export type TipoConteudoBanner = "imagem" | "texto" | "misto";

export type TipoPosicaoTexto = "centro" | "esquerda" | "direita" | "superior" | "inferior";

export type TipoPromocao =
	| "desconto_produto"
	| "desconto_categoria"
	| "combo_promocional"
	| "leve_pague";

export type StatusCupom = "ativo" | "expirado" | "esgotado" | "inativo";

// ========================================
// TIPOS DERIVADOS PARA USO NA APLICAÇÃO
// ========================================

export interface CupomCompleto extends Cupom {
	readonly percentual_uso: number;
	readonly usos_restantes: number | null;
	readonly status_cupom: StatusCupom;
	readonly periodo_valido: boolean;
}

export interface BannerCompleto extends Banner {
	readonly estabelecimento_nome: string;
	readonly ranking_tipo: number;
}

export interface PromocaoCompleta extends Promocao {
	readonly periodo_valido: boolean;
	readonly dias_restantes: number | null;
}

// ========================================
// TIPOS PARA FORMULÁRIOS
// ========================================

export interface CupomFormData {
	readonly codigo: string;
	readonly tipo: TipoCupom;
	readonly valor_desconto: number;
	readonly valor_minimo?: number;
	readonly limite_uso?: number;
	readonly data_expiracao?: string;
	readonly descricao?: string;
}

export interface BannerFormData {
	readonly titulo: string;
	readonly descricao?: string;
	readonly tipo: TipoBanner;
	readonly tipo_conteudo: TipoConteudoBanner;
	readonly imagem_url?: string;
	readonly link_url?: string;
	readonly cor_fundo?: string;
	readonly cor_texto?: string;
	readonly texto_cta?: string;
	readonly texto_posicao?: TipoPosicaoTexto;
	readonly texto_cor_fundo?: string;
}

export interface PromocaoFormData {
	readonly nome: string;
	readonly descricao?: string;
	readonly tipo: TipoPromocao;
	readonly desconto: number;
	readonly data_inicio: string;
	readonly data_fim?: string;
}

// ========================================
// TIPOS PARA VALIDAÇÃO
// ========================================

export interface ValidacaoCupom {
	readonly codigo: string;
	readonly valido: boolean;
	readonly motivo_invalido?: string;
	readonly valor_desconto?: number;
	readonly valor_minimo?: number;
}

export interface ValidacaoPromocao {
	readonly promocao_id: UUID;
	readonly valida: boolean;
	readonly motivo_invalido?: string;
	readonly desconto_aplicado?: number;
}

// ========================================
// TIPOS PARA ESTATÍSTICAS
// ========================================

export interface EstatisticasCupom {
	readonly total_cupons: number;
	readonly cupons_ativos: number;
	readonly cupons_expirados: number;
	readonly total_usos: number;
	readonly economia_gerada: number;
	readonly cupom_mais_usado: CupomResumo | null;
}

export interface EstatisticasBanner {
	readonly total_banners: number;
	readonly banners_ativos: number;
	readonly banners_por_tipo: Record<TipoBanner, number>;
	readonly total_visualizacoes?: number;
	readonly total_cliques?: number;
}

export interface EstatisticasPromocao {
	readonly total_promocoes: number;
	readonly promocoes_ativas: number;
	readonly promocoes_expiradas: number;
	readonly economia_total: number;
	readonly promocao_mais_usada: PromocaoResumo | null;
}

// ========================================
// TIPOS RESUMO
// ========================================

export interface CupomResumo {
	readonly id: UUID;
	readonly codigo: string;
	readonly tipo: TipoCupom;
	readonly valor_desconto: number;
	readonly usos_realizados: number;
	readonly ativo: boolean;
}

export interface BannerResumo {
	readonly id: UUID;
	readonly titulo: string;
	readonly tipo: TipoBanner;
	readonly ativo: boolean;
	readonly ordem: number;
}

export interface PromocaoResumo {
	readonly id: UUID;
	readonly nome: string;
	readonly tipo: TipoPromocao;
	readonly desconto: number;
	readonly ativo: boolean;
	readonly periodo_valido: boolean;
}

// ========================================
// TIPOS PARA VIEWS DO SUPABASE
// ========================================

export interface ViewCuponsEstatisticas {
	readonly id: UUID | null;
	readonly codigo: string | null;
	readonly tipo: string | null;
	readonly valor_desconto: number | null;
	readonly valor_minimo: number | null;
	readonly limite_uso: number | null;
	readonly usos_realizados: number | null;
	readonly usos_restantes: number | null;
	readonly percentual_uso: number | null;
	readonly data_expiracao: TimestampTz | null;
	readonly ativo: boolean | null;
	readonly periodo_valido: boolean | null;
	readonly status_cupom: string | null;
	readonly descricao: string | null;
	readonly ordem: number | null;
	readonly estabelecimento_id: UUID | null;
	readonly estabelecimento_nome: string | null;
	readonly created_at: TimestampTz | null;
}

export interface ViewBannersPorTipo {
	readonly id: UUID | null;
	readonly titulo: string | null;
	readonly descricao: string | null;
	readonly tipo: string | null;
	readonly tipo_conteudo: string | null;
	readonly imagem_url: string | null;
	readonly link_url: string | null;
	readonly cor_fundo: string | null;
	readonly cor_texto: string | null;
	readonly texto_cta: string | null;
	readonly texto_posicao: string | null;
	readonly texto_cor_fundo: string | null;
	readonly ordem: number | null;
	readonly ativo: boolean | null;
	readonly estabelecimento_id: UUID | null;
	readonly estabelecimento_nome: string | null;
	readonly ranking_tipo: number | null;
	readonly created_at: TimestampTz | null;
	readonly updated_at: TimestampTz | null;
}

// ========================================
// CONSTANTES E ENUMS
// ========================================

export const TIPOS_CUPOM: readonly TipoCupom[] = [
	"percentual",
	"valor_fixo",
	"frete_gratis",
] as const;

export const TIPOS_BANNER: readonly TipoBanner[] = ["carrossel", "destaque", "popup"] as const;

export const TIPOS_CONTEUDO_BANNER: readonly TipoConteudoBanner[] = [
	"imagem",
	"texto",
	"misto",
] as const;

export const POSICOES_TEXTO: readonly TipoPosicaoTexto[] = [
	"centro",
	"esquerda",
	"direita",
	"superior",
	"inferior",
] as const;

export const TIPOS_PROMOCAO: readonly TipoPromocao[] = [
	"desconto_produto",
	"desconto_categoria",
	"combo_promocional",
	"leve_pague",
] as const;

export const STATUS_CUPOM: readonly StatusCupom[] = [
	"ativo",
	"expirado",
	"esgotado",
	"inativo",
] as const;

// Limites e validações
export const MIN_DESCONTO_PERCENTUAL = 1;
export const MAX_DESCONTO_PERCENTUAL = 100;
export const MIN_DESCONTO_VALOR = 0.01;
export const MAX_DESCONTO_VALOR = 9999.99;
export const MIN_VALOR_MINIMO = 0.01;
export const MAX_CODIGO_LENGTH = 20;
export const MIN_CODIGO_LENGTH = 3;
