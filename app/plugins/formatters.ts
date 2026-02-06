/**
 * 📌 Plugin de Formatadores Globais
 *
 * Disponibiliza funções de formatação globalmente na aplicação via $formatX.
 * Os formatadores são importados de lib/formatters para centralização.
 */

import { formatCurrency } from "~/lib/formatters/currency";
import { formatNumber, formatPercent } from "~/lib/formatters/number";

export default defineNuxtPlugin(() => {
	return {
		provide: {
			formatCurrency,
			formatNumber,
			formatPercent,
		},
	};
});
