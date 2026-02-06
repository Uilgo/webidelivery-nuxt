/**
 * 📌 Formatadores de CPF
 *
 * Funções para formatação de CPF brasileiro.
 */

/**
 * Formata CPF brasileiro - FORMATAÇÃO PROGRESSIVA
 *
 * @param cpf - CPF (pode estar parcialmente digitado)
 * @returns String formatada progressivamente
 *
 * @example
 * formatCPF("123") // "123"
 * formatCPF("12345678") // "123.456.78"
 * formatCPF("12345678909") // "123.456.789-09"
 */
export const formatCPF = (cpf: string): string => {
	// Remove tudo que não é dígito
	const cleaned = cpf.replace(/\D/g, "");

	// Limita a 11 dígitos
	const limited = cleaned.slice(0, 11);

	// Formatação progressiva
	if (limited.length === 0) {
		return "";
	} else if (limited.length <= 3) {
		return limited;
	} else if (limited.length <= 6) {
		return `${limited.slice(0, 3)}.${limited.slice(3)}`;
	} else if (limited.length <= 9) {
		return `${limited.slice(0, 3)}.${limited.slice(3, 6)}.${limited.slice(6)}`;
	} else {
		// Completo: XXX.XXX.XXX-XX
		return `${limited.slice(0, 3)}.${limited.slice(3, 6)}.${limited.slice(6, 9)}-${limited.slice(9)}`;
	}
};

/**
 * Remove formatação do CPF
 *
 * @param cpf - CPF formatado
 * @returns Apenas dígitos
 *
 * @example
 * parseCPF("123.456.789-09") // "12345678909"
 */
export const parseCPF = (cpf: string): string => {
	return cpf.replace(/\D/g, "");
};

/**
 * Mascara CPF parcialmente (oculta dígitos do meio)
 *
 * @param cpf - CPF a ser mascarado
 * @returns CPF mascarado
 *
 * @example
 * maskCPF("12345678909") // "123.***.***-09"
 */
export const maskCPF = (cpf: string): string => {
	const cleaned = cpf.replace(/\D/g, "");

	if (cleaned.length === 11) {
		return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.***.***-$4");
	}

	return cpf;
};
