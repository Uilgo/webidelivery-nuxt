/**
 * 📌 Tipos Específicos da Feature de Marketing
 *
 * Tipos locais da feature de marketing, complementando os tipos globais.
 * Focados em formulários, filtros e estados específicos da interface.
 */

import type {
	TipoCupom,
	TipoBanner,
	TipoPromocao,
	TipoConteudoBanner,
	TipoPosicaoTexto,
	StatusCupom,
	CupomFormData,
	BannerFormData,
	PromocaoFormData,
} from "#shared/types/marketing";

// ========================================
// TIPOS DE ABAS E NAVEGAÇÃO
// ========================================

export type MarketingTab = "cupons" | "banners" | "promocoes";
export type MarketingViewMode = "card" | "list";

// ========================================
// TIPOS DE FILTROS
// ========================================

export interface CupomFilters {
	readonly tipo?: TipoCupom;
	readonly status?: StatusCupom;
	readonly periodo?: {
		readonly inicio?: string;
		readonly fim?: string;
	};
	readonly search?: string;
}

export interface BannerFilters {
	readonly tipo?: TipoBanner;
	readonly tipo_conteudo?: TipoConteudoBanner;
	readonly status?: "ativo" | "inativo";
}

export interface PromocaoFilters {
	readonly tipo?: TipoPromocao;
	readonly status?: "ativo" | "inativo" | "expirado";
	readonly periodo?: "hoje" | "semana" | "mes" | "personalizado";
	readonly search?: string;
}

// ========================================
// TIPOS DE ESTATÍSTICAS
// ========================================

export interface MarketingStats {
	readonly cupons: {
		readonly total: number;
		readonly ativos: number;
		readonly expirados: number;
		readonly total_usos: number;
		readonly economia_gerada: number;
	};
	readonly banners: {
		readonly total: number;
		readonly ativos: number;
		readonly por_tipo: Record<TipoBanner, number>;
	};
	readonly promocoes: {
		readonly total: number;
		readonly ativas: number;
		readonly expiradas: number;
		readonly economia_total: number;
	};
}

// ========================================
// TIPOS DE PREVIEW E VALIDAÇÃO
// ========================================

export interface BannerPreview {
	readonly titulo: string;
	readonly descricao?: string;
	readonly tipo: TipoBanner;
	readonly tipo_conteudo: TipoConteudoBanner;
	readonly imagem_url?: string;
	readonly cor_fundo?: string;
	readonly cor_texto?: string;
	readonly texto_cta?: string;
	readonly texto_posicao?: TipoPosicaoTexto;
	readonly texto_cor_fundo?: string;
}

// ========================================
// TIPOS DE UPLOAD
// ========================================

export interface UploadResult {
	readonly success: boolean;
	readonly url?: string;
	readonly error?: string;
	readonly file_size?: number;
	readonly file_type?: string;
}

export interface CupomValidationResult {
	readonly valido: boolean;
	readonly motivo?: string;
	readonly codigo_disponivel: boolean;
}

// ========================================
// TIPOS DE VALIDAÇÃO ESPECÍFICOS CUPONS
// ========================================

export interface ValidacaoCupom {
	readonly codigo: string;
	readonly valido: boolean;
	readonly motivo_invalido?: string;
	readonly valor_desconto?: number;
	readonly valor_minimo?: number;
	readonly desconto_aplicado?: number;
}

export interface PromocaoValidationResult {
	readonly valida: boolean;
	readonly motivo?: string;
	readonly periodo_valido: boolean;
}

// ========================================
// TIPOS DE VALIDAÇÃO ESPECÍFICOS
// ========================================

export interface ValidacaoPromocao {
	readonly promocao_id: string;
	readonly valida: boolean;
	readonly motivo_invalido?: string;
	readonly desconto_aplicado?: number;
}

// ========================================
// TIPOS DE AÇÕES E EVENTOS
// ========================================

export interface MarketingAction {
	readonly type: "create" | "update" | "delete" | "toggle" | "duplicate";
	readonly entity: "cupom" | "banner" | "promocao";
	readonly id?: string;
	readonly data?: CupomFormData | BannerFormData | PromocaoFormData;
}

export interface MarketingEvent {
	readonly action: MarketingAction;
	readonly timestamp: Date;
	readonly user_id: string;
	readonly success: boolean;
	readonly error?: string;
}

// ========================================
// TIPOS DE ORDENAÇÃO
// ========================================

export interface ReorderItem {
	readonly id: string;
	readonly ordem: number;
}

export interface DragDropResult {
	readonly items: ReorderItem[];
	readonly moved_item: ReorderItem;
	readonly old_index: number;
	readonly new_index: number;
}

// ========================================
// TIPOS DE UPLOAD
// ========================================

export interface UploadResult {
	readonly success: boolean;
	readonly url?: string;
	readonly error?: string;
	readonly file_size?: number;
	readonly file_type?: string;
}

// ========================================
// TIPOS DE BUSCA E ORDENAÇÃO
// ========================================

export type CupomSortField =
	| "codigo"
	| "tipo"
	| "valor_desconto"
	| "usos_realizados"
	| "created_at";
export type BannerSortField = "titulo" | "tipo" | "ordem" | "created_at";
export type PromocaoSortField = "nome" | "tipo" | "desconto" | "data_inicio" | "created_at";

export type SortDirection = "asc" | "desc";

export interface SortConfig {
	readonly field: CupomSortField | BannerSortField | PromocaoSortField;
	readonly direction: SortDirection;
}

// ========================================
// TIPOS DE ESTADO DA INTERFACE
// ========================================

export interface MarketingUIState {
	readonly activeTab: MarketingTab;
	readonly viewMode: MarketingViewMode;
	readonly searchValues: Record<MarketingTab, string>;
	readonly sortValues: Record<MarketingTab, string>;
	readonly filterValues: Record<MarketingTab, Record<string, unknown>>;
	readonly loadingStates: Record<MarketingTab, boolean>;
}

// ========================================
// TIPOS DE DRAWER/MODAL
// ========================================

export interface DrawerState {
	readonly isOpen: boolean;
	readonly mode: "create" | "edit";
	readonly entityId?: string;
	readonly entityType: "cupom" | "banner" | "promocao";
}

export interface ModalState {
	readonly isOpen: boolean;
	readonly type: "delete" | "duplicate" | "preview";
	readonly entityId?: string;
	readonly entityType: "cupom" | "banner" | "promocao";
	readonly title?: string;
	readonly message?: string;
}

// ========================================
// TIPOS DE INTEGRAÇÃO COM CARDÁPIO PÚBLICO
// ========================================

export interface CupomAplicacao {
	readonly cupom_id: string;
	readonly codigo: string;
	readonly tipo: TipoCupom;
	readonly valor_desconto: number;
	readonly valor_minimo?: number;
	readonly desconto_aplicado: number;
	readonly valor_original: number;
	readonly valor_final: number;
}

export interface PromocaoAplicacao {
	readonly promocao_id: string;
	readonly nome: string;
	readonly tipo: TipoPromocao;
	readonly desconto: number;
	readonly desconto_aplicado: number;
	readonly produtos_afetados: string[];
	readonly economia: number;
}

// ========================================
// TIPOS DE RELATÓRIOS
// ========================================

export interface MarketingReport {
	readonly periodo: {
		readonly inicio: string;
		readonly fim: string;
	};
	readonly cupons: {
		readonly mais_usados: Array<{
			readonly codigo: string;
			readonly usos: number;
			readonly economia: number;
		}>;
		readonly por_tipo: Record<TipoCupom, number>;
	};
	readonly promocoes: {
		readonly mais_efetivas: Array<{
			readonly nome: string;
			readonly aplicacoes: number;
			readonly economia: number;
		}>;
		readonly por_tipo: Record<TipoPromocao, number>;
	};
	readonly economia_total: number;
	readonly conversao: number;
}
