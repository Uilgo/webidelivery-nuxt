/**
 * 📌 Validadores de CEP
 *
 * Funções para validação de CEP brasileiro.
 */

/**
 * Valida CEP brasileiro
 *
 * @param cep - CEP a ser validado (com ou sem formatação)
 * @returns true se válido
 *
 * @example
 * isValidCEP("01001-000") // true
 * isValidCEP("01001000") // true
 * isValidCEP("123") // false
 */
export const isValidCEP = (cep: string): boolean => {
	// Remove formatação
	const cleaned = cep.replace(/\D/g, "");

	// Verifica se tem 8 dígitos
	if (cleaned.length !== 8) {
		return false;
	}

	// Verifica se não é sequência de números iguais
	if (/^(\d)\1{7}$/.test(cleaned)) {
		return false;
	}

	return true;
};

/**
 * Valida e retorna mensagem de erro se inválido
 *
 * @param cep - CEP a ser validado
 * @returns null se válido, mensagem de erro se inválido
 *
 * @example
 * validateCEP("01001-000") // null
 * validateCEP("123") // "CEP deve ter 8 dígitos"
 */
export const validateCEP = (cep: string): string | null => {
	const cleaned = cep.replace(/\D/g, "");

	if (cleaned.length === 0) {
		return "CEP é obrigatório";
	}

	if (cleaned.length !== 8) {
		return "CEP deve ter 8 dígitos";
	}

	if (/^(\d)\1{7}$/.test(cleaned)) {
		return "CEP inválido";
	}

	return null;
};
