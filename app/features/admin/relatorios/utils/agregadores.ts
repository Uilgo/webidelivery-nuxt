/**
 * 📌 Agregadores de Dados
 *
 * Funções para agregar e transformar dados dos relatórios.
 */

/**
 * Agrupa itens por uma chave específica
 */
export const agruparPor = <T extends Record<string, unknown>>(
	items: readonly T[],
	chave: keyof T,
): Record<string, T[]> => {
	return items.reduce(
		(acc, item) => {
			const key = String(item[chave]);
			if (!acc[key]) {
				acc[key] = [];
			}
			// Type assertion segura após verificação
			const grupo = acc[key];
			if (grupo) {
				grupo.push(item);
			}
			return acc;
		},
		{} as Record<string, T[]>,
	);
};

/**
 * Agrupa e soma valores por chave
 */
export const agruparESomar = <T extends Record<string, unknown>>(
	items: readonly T[],
	chaveAgrupamento: keyof T,
	chaveSoma: keyof T,
): Record<string, number> => {
	return items.reduce(
		(acc, item) => {
			const key = String(item[chaveAgrupamento]);
			const valor = Number(item[chaveSoma]) || 0;
			acc[key] = (acc[key] || 0) + valor;
			return acc;
		},
		{} as Record<string, number>,
	);
};

/**
 * Agrupa e conta ocorrências por chave
 */
export const agruparEContar = <T extends Record<string, unknown>>(
	items: readonly T[],
	chave: keyof T,
): Record<string, number> => {
	return items.reduce(
		(acc, item) => {
			const key = String(item[chave]);
			acc[key] = (acc[key] || 0) + 1;
			return acc;
		},
		{} as Record<string, number>,
	);
};

/**
 * Agrupa por data (YYYY-MM-DD)
 */
export const agruparPorData = <T extends Record<string, unknown>>(
	items: readonly T[],
	chaveTemporal: keyof T,
): Record<string, T[]> => {
	return items.reduce(
		(acc, item) => {
			const timestamp = item[chaveTemporal];
			if (!timestamp) return acc;

			const data = new Date(String(timestamp));
			const key = data.toISOString().split("T")[0]; // YYYY-MM-DD

			if (key) {
				if (!acc[key]) {
					acc[key] = [];
				}
				const grupo = acc[key];
				if (grupo) {
					grupo.push(item);
				}
			}
			return acc;
		},
		{} as Record<string, T[]>,
	);
};

/**
 * Agrupa por hora do dia (0-23)
 */
export const agruparPorHora = <T extends Record<string, unknown>>(
	items: readonly T[],
	chaveTemporal: keyof T,
): Record<number, T[]> => {
	return items.reduce(
		(acc, item) => {
			const timestamp = item[chaveTemporal];
			if (!timestamp) return acc;

			const data = new Date(String(timestamp));
			const hora = data.getHours();

			if (!acc[hora]) {
				acc[hora] = [];
			}
			// Type assertion segura após verificação
			const grupo = acc[hora];
			if (grupo) {
				grupo.push(item);
			}
			return acc;
		},
		{} as Record<number, T[]>,
	);
};

/**
 * Ordena objeto por valores (descendente)
 */
export const ordenarPorValor = (obj: Record<string, number>): Record<string, number> => {
	return Object.fromEntries(Object.entries(obj).sort(([, a], [, b]) => b - a));
};

/**
 * Pega os N primeiros itens de um objeto ordenado
 */
export const pegarTop = (obj: Record<string, number>, n: number): Record<string, number> => {
	return Object.fromEntries(Object.entries(obj).slice(0, n));
};

/**
 * Converte objeto para array de pares [chave, valor]
 */
export const objetoParaArray = <T>(obj: Record<string, T>): Array<[string, T]> => {
	return Object.entries(obj);
};

/**
 * Filtra itens por período de datas
 */
export const filtrarPorPeriodo = <T extends Record<string, unknown>>(
	items: readonly T[],
	chaveTemporal: keyof T,
	dataInicio: Date,
	dataFim: Date,
): T[] => {
	return items.filter((item) => {
		const timestamp = item[chaveTemporal];
		if (!timestamp) return false;

		const data = new Date(String(timestamp));
		return data >= dataInicio && data <= dataFim;
	});
};
