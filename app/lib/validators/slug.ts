/**
 * 📌 Validadores de Slug
 *
 * Funções para validação de slugs de URL.
 */

/**
 * Valida slug
 *
 * @param slug - Slug a ser validado
 * @returns true se válido
 *
 * @example
 * isValidSlug("meu-restaurante") // true
 * isValidSlug("Meu Restaurante") // false
 * isValidSlug("meu--restaurante") // false
 */
export const isValidSlug = (slug: string): boolean => {
	// Verifica tamanho
	if (slug.length < 3 || slug.length > 50) {
		return false;
	}

	// Verifica formato: apenas letras minúsculas, números e hífens
	if (!/^[a-z0-9-]+$/.test(slug)) {
		return false;
	}

	// Deve começar com letra
	if (!/^[a-z]/.test(slug)) {
		return false;
	}

	// Não pode terminar com hífen
	if (/-$/.test(slug)) {
		return false;
	}

	// Não pode ter hífens consecutivos
	if (/--/.test(slug)) {
		return false;
	}

	return true;
};

/**
 * Valida e retorna mensagem de erro se inválido
 *
 * @param slug - Slug a ser validado
 * @returns null se válido, mensagem de erro se inválido
 *
 * @example
 * validateSlug("meu-restaurante") // null
 * validateSlug("Meu Restaurante") // "Slug deve conter apenas letras minúsculas, números e hífens"
 */
export const validateSlug = (slug: string): string | null => {
	if (slug.length === 0) {
		return "Slug é obrigatório";
	}

	if (slug.length < 3) {
		return "Slug deve ter pelo menos 3 caracteres";
	}

	if (slug.length > 50) {
		return "Slug deve ter no máximo 50 caracteres";
	}

	if (!/^[a-z0-9-]+$/.test(slug)) {
		return "Slug deve conter apenas letras minúsculas, números e hífens";
	}

	if (!/^[a-z]/.test(slug)) {
		return "Slug deve começar com uma letra";
	}

	if (/-$/.test(slug)) {
		return "Slug não pode terminar com hífen";
	}

	if (/--/.test(slug)) {
		return "Slug não pode conter hífens consecutivos";
	}

	return null;
};

/**
 * Normaliza string para slug válido
 *
 * @param text - Texto a ser convertido em slug
 * @returns Slug normalizado
 *
 * @example
 * normalizeSlug("Meu Restaurante!") // "meu-restaurante"
 * normalizeSlug("Açaí & Cia") // "acai-cia"
 */
export const normalizeSlug = (text: string): string => {
	return text
		.toLowerCase()
		.normalize("NFD") // Decompõe caracteres acentuados
		.replace(/[\u0300-\u036f]/g, "") // Remove acentos
		.replace(/[^a-z0-9\s-]/g, "") // Remove caracteres especiais
		.trim()
		.replace(/\s+/g, "-") // Substitui espaços por hífens
		.replace(/-+/g, "-") // Remove hífens consecutivos
		.replace(/^-|-$/g, ""); // Remove hífens do início e fim
};

/**
 * Gera sugestões de slug baseado em um texto
 *
 * @param text - Texto base
 * @param existingSlugs - Slugs já existentes (opcional)
 * @returns Array de sugestões
 *
 * @example
 * generateSlugSuggestions("Meu Restaurante")
 * // ["meu-restaurante", "meu-restaurante-1", "meu-restaurante-2"]
 */
export const generateSlugSuggestions = (text: string, existingSlugs: string[] = []): string[] => {
	const baseSlug = normalizeSlug(text);
	const suggestions: string[] = [];

	// Adiciona slug base se não existir
	if (!existingSlugs.includes(baseSlug)) {
		suggestions.push(baseSlug);
	}

	// Adiciona variações numeradas
	for (let i = 1; i <= 5; i++) {
		const variant = `${baseSlug}-${i}`;
		if (!existingSlugs.includes(variant)) {
			suggestions.push(variant);
		}
	}

	// Adiciona variações com palavras comuns
	const suffixes = ["delivery", "express", "online", "food", "gourmet"];
	for (const suffix of suffixes) {
		const variant = `${baseSlug}-${suffix}`;
		if (!existingSlugs.includes(variant) && suggestions.length < 10) {
			suggestions.push(variant);
		}
	}

	return suggestions.slice(0, 5); // Retorna no máximo 5 sugestões
};
