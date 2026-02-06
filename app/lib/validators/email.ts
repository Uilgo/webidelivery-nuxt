/**
 * 📌 Validadores de Email
 *
 * Funções para validação de endereços de email.
 */

/**
 * Regex RFC 5322 compliant para validação de email
 */
const EMAIL_REGEX =
	/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

/**
 * Valida email
 *
 * @param email - Email a ser validado
 * @returns true se válido
 *
 * @example
 * isValidEmail("usuario@exemplo.com") // true
 * isValidEmail("usuario@exemplo") // false
 * isValidEmail("usuario") // false
 */
export const isValidEmail = (email: string): boolean => {
	if (!email || email.length === 0) {
		return false;
	}

	// Verifica tamanho máximo
	if (email.length > 254) {
		return false;
	}

	// Valida formato
	if (!EMAIL_REGEX.test(email)) {
		return false;
	}

	// Valida partes do email
	const parts = email.split("@");
	if (parts.length !== 2) {
		return false;
	}

	// Valida comprimento das partes
	const [localPart, domain] = parts;

	if (!localPart || !domain) {
		return false;
	}

	// Local part não pode ter mais de 64 caracteres
	if (localPart.length > 64) {
		return false;
	}

	// Domain deve ter pelo menos um ponto
	if (!domain.includes(".")) {
		return false;
	}

	// Domain parts não podem ter mais de 63 caracteres
	const domainParts = domain.split(".");
	for (const part of domainParts) {
		if (part && part.length > 63) {
			return false;
		}
	}

	return true;
};

/**
 * Valida e retorna mensagem de erro se inválido
 *
 * @param email - Email a ser validado
 * @returns null se válido, mensagem de erro se inválido
 */
export const validateEmail = (email: string): string | null => {
	if (!email || email.length === 0) {
		return "E-mail é obrigatório";
	}

	if (email.length > 254) {
		return "E-mail deve ter no máximo 254 caracteres";
	}

	if (!EMAIL_REGEX.test(email)) {
		return "Formato de e-mail inválido";
	}

	const parts = email.split("@");
	if (parts.length !== 2) {
		return "Formato de e-mail inválido";
	}

	const [localPart, domain] = parts;

	if (!localPart || !domain) {
		return "Formato de e-mail inválido";
	}

	if (localPart.length > 64) {
		return "Parte local do e-mail deve ter no máximo 64 caracteres";
	}

	if (!domain.includes(".")) {
		return "Domínio do e-mail inválido";
	}

	return null;
};

/**
 * Normaliza email (lowercase e trim)
 *
 * @param email - Email a ser normalizado
 * @returns Email normalizado
 *
 * @example
 * normalizeEmail("Usuario@Exemplo.COM  ") // "usuario@exemplo.com"
 */
export const normalizeEmail = (email: string): string => {
	return email.toLowerCase().trim();
};

/**
 * Extrai domínio do email
 *
 * @param email - Email
 * @returns Domínio do email
 *
 * @example
 * getEmailDomain("usuario@exemplo.com") // "exemplo.com"
 */
export const getEmailDomain = (email: string): string | null => {
	const parts = email.split("@");
	return parts.length === 2 && parts[1] ? parts[1] : null;
};

/**
 * Verifica se email é de domínio descartável/temporário
 *
 * @param email - Email a ser verificado
 * @returns true se for descartável
 *
 * @example
 * isDisposableEmail("usuario@tempmail.com") // true
 * isDisposableEmail("usuario@gmail.com") // false
 */
export const isDisposableEmail = (email: string): boolean => {
	const domain = getEmailDomain(email);
	if (!domain) {
		return false;
	}

	// Lista de domínios descartáveis comuns
	const disposableDomains = [
		"tempmail.com",
		"guerrillamail.com",
		"10minutemail.com",
		"mailinator.com",
		"throwaway.email",
		"temp-mail.org",
		"getnada.com",
		"maildrop.cc",
		"trashmail.com",
	];

	return disposableDomains.some((disposable) => domain.includes(disposable));
};
