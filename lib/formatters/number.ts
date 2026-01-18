/**
 * 📌 Formatadores de Números
 *
 * Funções para formatação de valores numéricos.
 */

/**
 * Formata número com separadores de milhar
 *
 * @param value - Valor numérico
 * @returns String formatada (ex: "1.234")
 *
 * @example
 * formatNumber(1234) // "1.234"
 * formatNumber(1234567) // "1.234.567"
 */
export const formatNumber = (value: number): string => {
	return new Intl.NumberFormat("pt-BR").format(value);
};

/**
 * Formata porcentagem
 *
 * @param value - Valor numérico (0-100)
 * @returns String formatada (ex: "15,5%")
 *
 * @example
 * formatPercent(15.5) // "15,5%"
 * formatPercent(100) // "100%"
 */
export const formatPercent = (value: number): string => {
	return new Intl.NumberFormat("pt-BR", {
		style: "percent",
		minimumFractionDigits: 0,
		maximumFractionDigits: 2,
	}).format(value / 100);
};

/**
 * Formata número decimal com casas decimais específicas
 *
 * @param value - Valor numérico
 * @param decimals - Número de casas decimais (padrão: 2)
 * @returns String formatada
 *
 * @example
 * formatDecimal(1234.5678, 2) // "1.234,57"
 * formatDecimal(1234.5, 3) // "1.234,500"
 */
export const formatDecimal = (value: number, decimals: number = 2): string => {
	return new Intl.NumberFormat("pt-BR", {
		minimumFractionDigits: decimals,
		maximumFractionDigits: decimals,
	}).format(value);
};
