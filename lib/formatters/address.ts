/**
 * 📌 Formatadores de Endereço
 *
 * Funções para formatação de CEP e endereços.
 */

/**
 * Formata CEP brasileiro
 *
 * @param cep - CEP (apenas dígitos)
 * @returns String formatada (ex: "12345-678")
 *
 * @example
 * formatCEP("12345678") // "12345-678"
 */
export const formatCEP = (cep: string): string => {
	const cleaned = cep.replace(/\D/g, "");

	if (cleaned.length !== 8) {
		return cep;
	}

	return cleaned.replace(/(\d{5})(\d{3})/, "$1-$2");
};

/**
 * Remove formatação do CEP
 *
 * @param cep - CEP formatado
 * @returns Apenas dígitos
 *
 * @example
 * parseCEP("12345-678") // "12345678"
 */
export const parseCEP = (cep: string): string => {
	return cep.replace(/\D/g, "");
};

/**
 * Valida CEP brasileiro
 *
 * @param cep - CEP a ser validado
 * @returns true se válido
 *
 * @example
 * isValidCEP("12345-678") // true
 * isValidCEP("123") // false
 */
export const isValidCEP = (cep: string): boolean => {
	const cleaned = parseCEP(cep);
	return cleaned.length === 8;
};

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
