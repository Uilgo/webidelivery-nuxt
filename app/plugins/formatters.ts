/**
 * 📌 Plugin de Formatadores Globais
 *
 * Disponibiliza funções de formatação globalmente na aplicação.
 */

export default defineNuxtPlugin(() => {
	/**
	 * Formata valor para moeda brasileira (R$)
	 */
	const formatCurrency = (value: number): string => {
		return new Intl.NumberFormat("pt-BR", {
			style: "currency",
			currency: "BRL",
		}).format(value);
	};

	/**
	 * Formata número com separadores de milhar
	 */
	const formatNumber = (value: number): string => {
		return new Intl.NumberFormat("pt-BR").format(value);
	};

	/**
	 * Formata porcentagem
	 */
	const formatPercent = (value: number): string => {
		return new Intl.NumberFormat("pt-BR", {
			style: "percent",
			minimumFractionDigits: 0,
			maximumFractionDigits: 2,
		}).format(value / 100);
	};

	return {
		provide: {
			formatCurrency,
			formatNumber,
			formatPercent,
		},
	};
});
