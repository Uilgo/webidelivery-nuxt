/**
 * 📌 Formatadores de Moeda
 *
 * Funções para formatação de valores monetários.
 */

/**
 * Formata valor para moeda brasileira (R$)
 *
 * @param value - Valor numérico a ser formatado
 * @returns String formatada como moeda (ex: "R$ 1.234,56")
 *
 * @example
 * formatCurrency(1234.56) // "R$ 1.234,56"
 * formatCurrency(0) // "R$ 0,00"
 */
export const formatCurrency = (value: number): string => {
	return new Intl.NumberFormat("pt-BR", {
		style: "currency",
		currency: "BRL",
	}).format(value);
};

/**
 * Converte string de moeda para número
 *
 * @param value - String no formato "R$ 1.234,56" ou "1.234,56" ou "1234,56"
 * @returns Número decimal
 *
 * @example
 * parseCurrency("R$ 1.234,56") // 1234.56
 * parseCurrency("1.234,56") // 1234.56
 * parseCurrency("1234,56") // 1234.56
 */
export const parseCurrency = (value: string): number => {
	// Remove R$, espaços e pontos de milhar
	const cleaned = value.replace(/R\$|\s|\./g, "");
	// Substitui vírgula por ponto
	const normalized = cleaned.replace(",", ".");
	return parseFloat(normalized) || 0;
};

/**
 * Formata valor para input de moeda (sem símbolo R$)
 *
 * @param value - Valor numérico
 * @returns String formatada sem símbolo (ex: "1.234,56")
 *
 * @example
 * formatCurrencyInput(1234.56) // "1.234,56"
 */
export const formatCurrencyInput = (value: number): string => {
	return new Intl.NumberFormat("pt-BR", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(value);
};
