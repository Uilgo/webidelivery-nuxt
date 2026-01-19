/**
 * 📌 Formatadores de CEP
 *
 * Funções para formatação de CEP brasileiro.
 */

/**
 * Formata CEP brasileiro
 *
 * @param cep - CEP (apenas dígitos)
 * @returns String formatada (ex: "12345-678")
 *
 * @example
 * formatCEP("12345678") // "12345-678"
 * formatCEP("12345-678") // "12345-678" (já formatado)
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
 * parseCEP("12345678") // "12345678" (já sem formatação)
 */
export const parseCEP = (cep: string): string => {
	return cep.replace(/\D/g, "");
};
