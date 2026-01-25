/**
 * 📌 Validadores de Telefone
 *
 * Funções para validação de telefones brasileiros.
 */

/**
 * Valida telefone brasileiro
 *
 * @param phone - Telefone a ser validado (com ou sem formatação)
 * @returns true se válido
 *
 * @example
 * isValidPhone("(11) 98765-4321") // true
 * isValidPhone("11987654321") // true
 * isValidPhone("123") // false
 */
export const isValidPhone = (phone: string): boolean => {
	// Remove formatação
	const cleaned = phone.replace(/\D/g, "");

	// Verifica se tem 10 ou 11 dígitos
	if (cleaned.length !== 10 && cleaned.length !== 11) {
		return false;
	}

	// Verifica se não é sequência de números iguais
	if (/^(\d)\1+$/.test(cleaned)) {
		return false;
	}

	// Verifica DDD válido (11-99)
	const ddd = parseInt(cleaned.substring(0, 2));
	if (ddd < 11 || ddd > 99) {
		return false;
	}

	// Se tem 11 dígitos, deve começar com 9 (celular)
	if (cleaned.length === 11 && cleaned.charAt(2) !== "9") {
		return false;
	}

	return true;
};

/**
 * Valida e retorna mensagem de erro se inválido
 *
 * @param phone - Telefone a ser validado
 * @returns null se válido, mensagem de erro se inválido
 *
 * @example
 * validatePhone("(11) 98765-4321") // null
 * validatePhone("123") // "Telefone deve ter 10 ou 11 dígitos"
 */
export const validatePhone = (phone: string): string | null => {
	const cleaned = phone.replace(/\D/g, "");

	if (cleaned.length === 0) {
		return "Telefone é obrigatório";
	}

	if (cleaned.length !== 10 && cleaned.length !== 11) {
		return "Telefone deve ter 10 ou 11 dígitos";
	}

	if (/^(\d)\1+$/.test(cleaned)) {
		return "Telefone inválido";
	}

	const ddd = parseInt(cleaned.substring(0, 2));
	if (ddd < 11 || ddd > 99) {
		return "DDD inválido";
	}

	if (cleaned.length === 11 && cleaned.charAt(2) !== "9") {
		return "Celular deve começar com 9";
	}

	return null;
};

/**
 * Valida WhatsApp (com DDI 55)
 *
 * @param whatsapp - WhatsApp a ser validado
 * @returns true se válido
 *
 * @example
 * isValidWhatsApp("5511987654321") // true
 * isValidWhatsApp("11987654321") // false
 */
export const isValidWhatsApp = (whatsapp: string): boolean => {
	const cleaned = whatsapp.replace(/\D/g, "");

	// Deve ter 12 ou 13 dígitos (55 + DDD + número)
	if (cleaned.length !== 12 && cleaned.length !== 13) {
		return false;
	}

	// Deve começar com 55
	if (!cleaned.startsWith("55")) {
		return false;
	}

	// Valida o número sem o DDI
	const phoneWithoutDDI = cleaned.substring(2);
	return isValidPhone(phoneWithoutDDI);
};

/**
 * Valida WhatsApp e retorna mensagem de erro se inválido
 *
 * @param whatsapp - WhatsApp a ser validado
 * @returns null se válido, mensagem de erro se inválido
 */
export const validateWhatsApp = (whatsapp: string): string | null => {
	const cleaned = whatsapp.replace(/\D/g, "");

	if (cleaned.length === 0) {
		return "WhatsApp é obrigatório";
	}

	if (cleaned.length !== 12 && cleaned.length !== 13) {
		return "WhatsApp deve ter 12 ou 13 dígitos (com DDI 55)";
	}

	if (!cleaned.startsWith("55")) {
		return "WhatsApp deve começar com DDI 55";
	}

	const phoneWithoutDDI = cleaned.substring(2);
	const phoneValidation = validatePhone(phoneWithoutDDI);

	if (phoneValidation) {
		return phoneValidation;
	}

	return null;
};
