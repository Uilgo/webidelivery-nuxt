/**
 * 📌 Formatadores de Telefone
 *
 * Funções para formatação de números de telefone brasileiros.
 */

/**
 * Formata telefone brasileiro
 *
 * @param phone - Número de telefone (apenas dígitos)
 * @returns String formatada
 *
 * @example
 * formatPhone("11987654321") // "(11) 98765-4321"
 * formatPhone("1133334444") // "(11) 3333-4444"
 */
export const formatPhone = (phone: string): string => {
	// Remove tudo que não é dígito
	const cleaned = phone.replace(/\D/g, "");

	// Celular com 11 dígitos: (XX) XXXXX-XXXX
	if (cleaned.length === 11) {
		return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
	}

	// Fixo com 10 dígitos: (XX) XXXX-XXXX
	if (cleaned.length === 10) {
		return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
	}

	// Retorna original se não for formato válido
	return phone;
};

/**
 * Formata WhatsApp com DDI
 *
 * @param phone - Número de telefone (apenas dígitos)
 * @returns String formatada com +55
 *
 * @example
 * formatWhatsApp("11987654321") // "+55 (11) 98765-4321"
 */
export const formatWhatsApp = (phone: string): string => {
	const cleaned = phone.replace(/\D/g, "");

	// Remove +55 se já existir
	const withoutDDI = cleaned.startsWith("55") ? cleaned.slice(2) : cleaned;

	return `+55 ${formatPhone(withoutDDI)}`;
};

/**
 * Remove formatação do telefone
 *
 * @param phone - Telefone formatado
 * @returns Apenas dígitos
 *
 * @example
 * parsePhone("(11) 98765-4321") // "11987654321"
 */
export const parsePhone = (phone: string): string => {
	return phone.replace(/\D/g, "");
};

/**
 * Valida telefone brasileiro
 *
 * @param phone - Número de telefone
 * @returns true se válido
 *
 * @example
 * isValidPhone("11987654321") // true
 * isValidPhone("123") // false
 */
export const isValidPhone = (phone: string): boolean => {
	const cleaned = parsePhone(phone);
	return cleaned.length === 10 || cleaned.length === 11;
};
