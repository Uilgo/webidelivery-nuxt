/**
 * 📌 Tipos de Relatório de Produtos
 *
 * Tipos específicos para o relatório de produtos e desempenho.
 */

import type { UUID } from "#shared/types/database";
import type { KpiBase, DadosGrafico } from "./relatorios";

// ========================================
// RELATÓRIO COMPLETO
// ========================================

export interface RelatorioProdutos {
	readonly kpis: KpisProdutos;
	readonly ranking: RankingProdutos;
	readonly graficos: GraficosProdutos;
	readonly tabela: readonly ProdutoDetalhado[];
	readonly resumo: ResumoProdutos;
}

// ========================================
// KPIs
// ========================================

export interface KpisProdutos {
	readonly produtos_vendidos: KpiBase;
	readonly produto_mais_vendido: KpiBase;
	readonly categoria_mais_vendida: KpiBase;
	readonly receita_produtos: KpiBase;
}

// ========================================
// RANKING
// ========================================

export interface RankingProdutos {
	readonly mais_vendidos: readonly ProdutoRanking[];
	readonly menos_vendidos: readonly ProdutoRanking[];
	readonly maior_receita: readonly ProdutoRanking[];
}

export interface ProdutoRanking {
	readonly id: UUID;
	readonly nome: string;
	readonly categoria_nome: string;
	readonly quantidade_vendida: number;
	readonly receita: number;
	readonly imagem_url: string | null;
	readonly posicao: number;
}

// ========================================
// GRÁFICOS
// ========================================

export interface GraficosProdutos {
	readonly vendas_por_categoria: DadosGrafico;
	readonly evolucao_vendas: DadosGrafico;
	readonly top_10_produtos: DadosGrafico;
}

// ========================================
// PRODUTO DETALHADO
// ========================================

export interface ProdutoDetalhado {
	readonly id: UUID;
	readonly nome: string;
	readonly categoria_nome: string;
	readonly quantidade_vendida: number;
	readonly receita_total: number;
	readonly preco_medio: number;
	readonly percentual_vendas: number;
	readonly imagem_url: string | null;
}

// ========================================
// RESUMO
// ========================================

export interface ResumoProdutos {
	readonly total_produtos_vendidos: number;
	readonly total_categorias_ativas: number;
	readonly receita_total: number;
	readonly preco_medio_geral: number;
	readonly vendas_por_categoria: Record<string, number>;
	readonly produto_mais_vendido: {
		readonly nome: string;
		readonly quantidade: number;
	} | null;
}

// ========================================
// ESTATÍSTICAS POR CATEGORIA
// ========================================

export interface EstatisticasCategoria {
	readonly categoria_id: UUID;
	readonly categoria_nome: string;
	readonly total_produtos: number;
	readonly quantidade_vendida: number;
	readonly receita: number;
	readonly percentual_total: number;
}
