/**
 * 📌 Formatadores de Telefone
 *
 * Funções para formatação de números de telefone brasileiros.
 */

/**
 * Formata telefone brasileiro - FORMATAÇÃO PROGRESSIVA
 *
 * @param phone - Número de telefone (pode estar parcialmente digitado)
 * @returns String formatada progressivamente
 *
 * @example
 * formatPhone("11") // "(11"
 * formatPhone("119") // "(11) 9"
 * formatPhone("11987654321") // "(11) 98765-4321"
 * formatPhone("1133334444") // "(11) 3333-4444"
 */
export const formatPhone = (phone: string): string => {
	// Remove tudo que não é dígito
	const cleaned = phone.replace(/\D/g, "");

	// Limita a 11 dígitos
	const limited = cleaned.slice(0, 11);

	// Formatação progressiva
	if (limited.length === 0) {
		return "";
	} else if (limited.length <= 2) {
		return `(${limited}`;
	} else if (limited.length <= 6) {
		return `(${limited.slice(0, 2)}) ${limited.slice(2)}`;
	} else if (limited.length <= 10) {
		// Fixo: (XX) XXXX-XXXX
		return `(${limited.slice(0, 2)}) ${limited.slice(2, 6)}-${limited.slice(6)}`;
	} else {
		// Celular: (XX) XXXXX-XXXX
		return `(${limited.slice(0, 2)}) ${limited.slice(2, 7)}-${limited.slice(7)}`;
	}
};

/**
 * Formata WhatsApp com DDI - FORMATAÇÃO PROGRESSIVA COM BLOQUEIO ABSOLUTO
 *
 * @param phone - Número de telefone (pode estar parcialmente digitado)
 * @returns String formatada com +55
 *
 * @example
 * formatWhatsApp("11987654321") // "+55 (11) 98765-4321"
 * formatWhatsApp("119876") // "+55 (11) 9876"
 */
export const formatWhatsApp = (phone: string): string => {
	const cleaned = phone.replace(/\D/g, "");

	// Remove +55 se já existir para evitar duplicação
	const withoutDDI = cleaned.startsWith("55") ? cleaned.slice(2) : cleaned;

	// BLOQUEIO ABSOLUTO: truncar para máximo 11 dígitos
	const limitedDigits = withoutDDI.slice(0, 11);

	// Formatação progressiva conforme digita
	if (limitedDigits.length === 0) {
		return "";
	} else if (limitedDigits.length <= 2) {
		return `+55 (${limitedDigits}`;
	} else if (limitedDigits.length <= 6) {
		return `+55 (${limitedDigits.slice(0, 2)}) ${limitedDigits.slice(2)}`;
	} else if (limitedDigits.length <= 10) {
		// Fixo: (XX) XXXX-XXXX
		return `+55 (${limitedDigits.slice(0, 2)}) ${limitedDigits.slice(2, 6)}-${limitedDigits.slice(6)}`;
	} else {
		// Celular: (XX) XXXXX-XXXX
		return `+55 (${limitedDigits.slice(0, 2)}) ${limitedDigits.slice(2, 7)}-${limitedDigits.slice(7)}`;
	}
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
 * Valida telefone brasileiro - CORRIGIDO PARA WHATSAPP COM DDI
 *
 * @param phone - Número de telefone
 * @returns true se válido
 *
 * @example
 * isValidPhone("11987654321") // true
 * isValidPhone("5511987654321") // true (com DDI +55)
 * isValidPhone("123") // false
 */
export const isValidPhone = (phone: string): boolean => {
	const cleaned = parsePhone(phone);

	// Remover DDI +55 se presente
	const withoutDDI = cleaned.startsWith("55") ? cleaned.slice(2) : cleaned;

	// Validar: deve ter 10 ou 11 dígitos (fixo ou celular)
	return withoutDDI.length === 10 || withoutDDI.length === 11;
};
