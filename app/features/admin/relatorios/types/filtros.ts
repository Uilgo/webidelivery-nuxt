/**
 * 📌 Tipos de Filtros de Relatórios
 *
 * Tipos específicos para filtros e configurações de relatórios.
 */

import type { UUID } from "#shared/types/database";
import type { PeriodoPreset } from "./relatorios";

// ========================================
// FILTROS DE PERÍODO
// ========================================

export interface FiltrosPeriodo {
	readonly preset: PeriodoPreset;
	readonly data_inicio: string; // ISO date
	readonly data_fim: string; // ISO date
}

// ========================================
// FILTROS GLOBAIS
// ========================================

export interface FiltrosGlobais {
	readonly periodo: FiltrosPeriodo;
	readonly estabelecimento_id?: UUID;
}

// ========================================
// FILTROS DE PEDIDOS
// ========================================

export interface FiltrosPedidos {
	readonly status?: readonly string[];
	readonly tipo_entrega?: readonly string[];
	readonly forma_pagamento?: readonly string[];
	readonly valor_minimo?: number;
	readonly valor_maximo?: number;
	readonly cliente_nome?: string;
}

// ========================================
// FILTROS DE PRODUTOS
// ========================================

export interface FiltrosProdutos {
	readonly categoria_id?: UUID;
	readonly nome?: string;
	readonly quantidade_minima?: number;
	readonly receita_minima?: number;
}

// ========================================
// FILTROS DE MARKETING
// ========================================

export interface FiltrosMarketing {
	readonly tipo_cupom?: readonly string[];
	readonly codigo_cupom?: string;
	readonly tipo_banner?: readonly string[];
}

// ========================================
// FILTROS DE FINANCEIRO
// ========================================

export interface FiltrosFinanceiro {
	readonly forma_pagamento?: readonly string[];
	readonly tipo_transacao?: readonly ("entrada" | "saida")[];
	readonly valor_minimo?: number;
	readonly valor_maximo?: number;
}

// ========================================
// ESTADO DOS FILTROS
// ========================================

export interface EstadoFiltros {
	readonly periodo: FiltrosPeriodo;
	readonly pedidos?: FiltrosPedidos;
	readonly produtos?: FiltrosProdutos;
	readonly marketing?: FiltrosMarketing;
	readonly financeiro?: FiltrosFinanceiro;
}

// ========================================
// HELPERS DE FILTROS
// ========================================

export interface RangeDatas {
	readonly inicio: Date;
	readonly fim: Date;
}

export interface PresetConfig {
	readonly label: string;
	readonly dias?: number;
	readonly tipo?: "mes_atual" | "mes_anterior" | "ano_atual" | "custom";
}
