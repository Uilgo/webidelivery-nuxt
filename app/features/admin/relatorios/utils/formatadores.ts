/**
 * 📌 Formatadores Específicos de Relatórios
 *
 * Funções de formatação específicas para relatórios que não existem nos formatadores globais.
 * Reutiliza ao máximo os formatadores de lib/formatters.
 */

import { formatCurrency } from "../../../../lib/formatters/currency";
import { formatPercent, formatNumber } from "../../../../lib/formatters/number";
import { formatDuration } from "../../../../lib/formatters/date";
import type { FormatoKpi } from "../types/relatorios";

/**
 * Formata um valor de acordo com o formato especificado do KPI
 * (Wrapper que usa os formatadores globais)
 */
export const formatarValorKpi = (valor: number | string, formato: FormatoKpi): string => {
	if (typeof valor === "string") return valor;

	switch (formato) {
		case "moeda":
			return formatCurrency(valor);
		case "percentual":
			return formatPercent(valor);
		case "tempo":
			return formatDuration(valor);
		case "numero":
		default:
			return formatNumber(valor);
	}
};

/**
 * Formata uma variação com sinal (+ ou -)
 */
export const formatarVariacao = (valor: number, formato: FormatoKpi = "percentual"): string => {
	const sinal = valor >= 0 ? "+" : "";
	const valorFormatado = formatarValorKpi(Math.abs(valor), formato);

	return `${sinal}${valorFormatado}`;
};

/**
 * Abrevia números grandes (1.5K, 2.3M, etc)
 */
export const abreviarNumero = (valor: number): string => {
	if (valor < 1000) {
		return formatNumber(valor);
	}

	if (valor < 1000000) {
		return `${(valor / 1000).toFixed(1)}K`;
	}

	return `${(valor / 1000000).toFixed(1)}M`;
};
