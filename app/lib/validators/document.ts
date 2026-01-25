/**
 * 📌 Validadores de CPF
 *
 * Funções para validação de CPF brasileiro.
 */

/**
 * Valida CPF brasileiro
 *
 * @param cpf - CPF a ser validado (com ou sem formatação)
 * @returns true se válido
 *
 * @example
 * isValidCPF("123.456.789-09") // true
 * isValidCPF("12345678909") // true
 * isValidCPF("111.111.111-11") // false
 */
export const isValidCPF = (cpf: string): boolean => {
	// Remove formatação
	const cleaned = cpf.replace(/\D/g, "");

	// Verifica se tem 11 dígitos
	if (cleaned.length !== 11) {
		return false;
	}

	// Verifica se não é sequência de números iguais
	if (/^(\d)\1{10}$/.test(cleaned)) {
		return false;
	}

	// Validação do primeiro dígito verificador
	let sum = 0;
	for (let i = 0; i < 9; i++) {
		sum += parseInt(cleaned.charAt(i)) * (10 - i);
	}
	let digit = 11 - (sum % 11);
	if (digit >= 10) digit = 0;
	if (digit !== parseInt(cleaned.charAt(9))) {
		return false;
	}

	// Validação do segundo dígito verificador
	sum = 0;
	for (let i = 0; i < 10; i++) {
		sum += parseInt(cleaned.charAt(i)) * (11 - i);
	}
	digit = 11 - (sum % 11);
	if (digit >= 10) digit = 0;
	if (digit !== parseInt(cleaned.charAt(10))) {
		return false;
	}

	return true;
};

/**
 * Valida e retorna mensagem de erro se inválido
 *
 * @param cpf - CPF a ser validado
 * @returns null se válido, mensagem de erro se inválido
 *
 * @example
 * validateCPF("123.456.789-09") // null
 * validateCPF("111.111.111-11") // "CPF inválido"
 */
export const validateCPF = (cpf: string): string | null => {
	const cleaned = cpf.replace(/\D/g, "");

	if (cleaned.length === 0) {
		return "CPF é obrigatório";
	}

	if (cleaned.length !== 11) {
		return "CPF deve ter 11 dígitos";
	}

	if (!isValidCPF(cpf)) {
		return "CPF inválido";
	}

	return null;
};
