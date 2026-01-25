/**
 * 📌 Formatadores de Endereço
 *
 * Funções para formatação de endereços completos.
 * Para formatação de CEP, use lib/formatters/cep.ts
 */

import { formatCEP } from "./cep";

/**
 * Formata endereço completo
 *
 * @param address - Objeto com dados do endereço
 * @returns String formatada
 *
 * @example
 * formatAddress({
 *   rua: "Rua das Flores",
 *   numero: "123",
 *   complemento: "Apto 45",
 *   bairro: "Centro",
 *   cidade: "São Paulo",
 *   estado: "SP",
 *   cep: "12345678"
 * })
 * // "Rua das Flores, 123, Apto 45 - Centro, São Paulo/SP - 12345-678"
 */
export const formatAddress = (address: {
	rua: string;
	numero: string;
	complemento?: string;
	bairro: string;
	cidade: string;
	estado: string;
	cep?: string;
}): string => {
	const parts: string[] = [];

	// Rua e número
	parts.push(`${address.rua}, ${address.numero}`);

	// Complemento (opcional)
	if (address.complemento) {
		parts.push(address.complemento);
	}

	// Bairro
	parts.push(`- ${address.bairro}`);

	// Cidade e estado
	parts.push(`${address.cidade}/${address.estado}`);

	// CEP (opcional)
	if (address.cep) {
		parts.push(`- ${formatCEP(address.cep)}`);
	}

	return parts.join(" ");
};

/**
 * Formata endereço curto (sem CEP e complemento)
 *
 * @param address - Objeto com dados do endereço
 * @returns String formatada
 *
 * @example
 * formatShortAddress({
 *   rua: "Rua das Flores",
 *   numero: "123",
 *   bairro: "Centro"
 * })
 * // "Rua das Flores, 123 - Centro"
 */
export const formatShortAddress = (address: {
	rua: string;
	numero: string;
	bairro: string;
}): string => {
	return `${address.rua}, ${address.numero} - ${address.bairro}`;
};
