/**
 * 📌 Tipos de Relatório de Marketing
 *
 * Tipos específicos para o relatório de marketing (cupons e banners).
 */

import type { UUID, TimestampTz } from "#shared/types/database";
import type { KpiBase, DadosGrafico } from "./relatorios";

// ========================================
// RELATÓRIO COMPLETO
// ========================================

export interface RelatorioMarketing {
	readonly kpis: KpisMarketing;
	readonly cupons: DadosCupons;
	readonly banners: DadosBanners;
	readonly graficos: GraficosMarketing;
	readonly resumo: ResumoMarketing;
}

// ========================================
// KPIs
// ========================================

export interface KpisMarketing {
	readonly cupons_usados: KpiBase;
	readonly desconto_total: KpiBase;
	readonly taxa_conversao: KpiBase;
	readonly economia_cliente: KpiBase;
}

// ========================================
// CUPONS
// ========================================

export interface DadosCupons {
	readonly desempenho: readonly CupomDesempenho[];
	readonly mais_usados: readonly CupomDesempenho[];
}

export interface CupomDesempenho {
	readonly id: UUID;
	readonly codigo: string;
	readonly tipo: string;
	readonly usos: number;
	readonly desconto_total: number;
	readonly receita_gerada: number;
	readonly taxa_conversao: number;
	readonly economia_media: number;
	readonly created_at: TimestampTz;
}

// ========================================
// BANNERS
// ========================================

export interface DadosBanners {
	readonly desempenho: readonly BannerDesempenho[];
	readonly mais_visualizados: readonly BannerDesempenho[];
}

export interface BannerDesempenho {
	readonly id: UUID;
	readonly titulo: string;
	readonly tipo: string;
	readonly visualizacoes: number;
	readonly cliques: number;
	readonly taxa_clique: number;
	readonly created_at: TimestampTz;
}

// ========================================
// GRÁFICOS
// ========================================

export interface GraficosMarketing {
	readonly cupons_por_tipo: DadosGrafico;
	readonly uso_ao_longo_tempo: DadosGrafico;
	readonly economia_gerada: DadosGrafico;
}

// ========================================
// RESUMO
// ========================================

export interface ResumoMarketing {
	readonly total_cupons_ativos: number;
	readonly total_cupons_usados: number;
	readonly desconto_total_concedido: number;
	readonly receita_com_cupons: number;
	readonly economia_media_cliente: number;
	readonly taxa_conversao_geral: number;
	readonly cupom_mais_usado: {
		readonly codigo: string;
		readonly usos: number;
	} | null;
	readonly total_banners_ativos: number;
}

// ========================================
// ESTATÍSTICAS POR TIPO
// ========================================

export interface EstatisticasPorTipoCupom {
	readonly tipo: string;
	readonly total_cupons: number;
	readonly total_usos: number;
	readonly desconto_total: number;
	readonly receita_gerada: number;
}
