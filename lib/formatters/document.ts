/**
 * 📌 Formatadores de CPF
 *
 * Funções para formatação de CPF brasileiro.
 */

/**
 * Formata CPF brasileiro
 *
 * @param cpf - CPF (apenas dígitos)
 * @returns String formatada
 *
 * @example
 * formatCPF("12345678909") // "123.456.789-09"
 */
export const formatCPF = (cpf: string): string => {
	// Remove tudo que não é dígito
	const cleaned = cpf.replace(/\D/g, "");

	// Formata: XXX.XXX.XXX-XX
	if (cleaned.length === 11) {
		return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
	}

	// Retorna original se não for formato válido
	return cpf;
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
