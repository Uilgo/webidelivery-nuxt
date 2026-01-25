/**
 * 📌 Cálculos de Métricas
 *
 * Funções para calcular métricas e estatísticas dos relatórios.
 */

import type { VariacaoTipo } from "../types/relatorios";

/**
 * Calcula a variação percentual entre dois valores
 */
export const calcularVariacaoPercentual = (valorAtual: number, valorAnterior: number): number => {
	if (valorAnterior === 0) {
		return valorAtual > 0 ? 100 : 0;
	}

	return ((valorAtual - valorAnterior) / valorAnterior) * 100;
};

/**
 * Determina o tipo de variação (aumento, redução, neutro)
 */
export const determinarTipoVariacao = (variacao: number): VariacaoTipo => {
	if (variacao > 0) return "aumento";
	if (variacao < 0) return "reducao";
	return "neutro";
};

/**
 * Calcula a média de um array de números
 */
export const calcularMedia = (valores: readonly number[]): number => {
	if (valores.length === 0) return 0;
	const soma = valores.reduce((acc, val) => acc + val, 0);
	return soma / valores.length;
};

/**
 * Calcula o ticket médio (valor total / quantidade)
 */
export const calcularTicketMedio = (valorTotal: number, quantidade: number): number => {
	if (quantidade === 0) return 0;
	return valorTotal / quantidade;
};

/**
 * Calcula a taxa de cancelamento (cancelados / total * 100)
 */
export const calcularTaxaCancelamento = (cancelados: number, total: number): number => {
	if (total === 0) return 0;
	return (cancelados / total) * 100;
};

/**
 * Calcula a taxa de conversão (convertidos / total * 100)
 */
export const calcularTaxaConversao = (convertidos: number, total: number): number => {
	if (total === 0) return 0;
	return (convertidos / total) * 100;
};

/**
 * Calcula o percentual de um valor em relação ao total
 */
export const calcularPercentual = (valor: number, total: number): number => {
	if (total === 0) return 0;
	return (valor / total) * 100;
};

/**
 * Calcula a diferença entre dois valores
 */
export const calcularDiferenca = (valorAtual: number, valorAnterior: number): number => {
	return valorAtual - valorAnterior;
};

/**
 * Calcula a soma de um array de números
 */
export const calcularSoma = (valores: readonly number[]): number => {
	return valores.reduce((acc, val) => acc + val, 0);
};

/**
 * Calcula o tempo médio em minutos entre duas datas
 */
export const calcularTempoMedio = (datas: readonly { inicio: Date; fim: Date }[]): number => {
	if (datas.length === 0) return 0;

	const tempos = datas.map((d) => {
		const diff = d.fim.getTime() - d.inicio.getTime();
		return diff / (1000 * 60); // converter para minutos
	});

	return calcularMedia(tempos);
};

/**
 * Agrupa valores por chave e soma
 */
export const agruparESomar = <T extends Record<string, unknown>>(
	items: readonly T[],
	chave: keyof T,
	valorChave: keyof T,
): Record<string, number> => {
	return items.reduce(
		(acc, item) => {
			const key = String(item[chave]);
			const valor = Number(item[valorChave]) || 0;
			acc[key] = (acc[key] || 0) + valor;
			return acc;
		},
		{} as Record<string, number>,
	);
};

/**
 * Calcula o crescimento entre períodos
 */
export const calcularCrescimento = (
	periodoAtual: number,
	periodoAnterior: number,
): {
	valor: number;
	percentual: number;
	tipo: VariacaoTipo;
} => {
	const diferenca = calcularDiferenca(periodoAtual, periodoAnterior);
	const percentual = calcularVariacaoPercentual(periodoAtual, periodoAnterior);
	const tipo = determinarTipoVariacao(diferenca);

	return {
		valor: diferenca,
		percentual,
		tipo,
	};
};
