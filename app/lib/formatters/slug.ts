/**
 * 📌 Formatadores de Slug
 *
 * Funções para formatação de slugs de URL.
 */

/**
 * Formata string para slug válido
 *
 * @param text - Texto a ser convertido em slug
 * @returns Slug formatado
 *
 * @example
 * formatSlug("Meu Restaurante!") // "meu-restaurante"
 * formatSlug("Açaí & Cia") // "acai-cia"
 */
export const formatSlug = (text: string): string => {
	return text
		.toLowerCase()
		.normalize("NFD") // Decompõe caracteres acentuados
		.replace(/[\u0300-\u036f]/g, "") // Remove acentos
		.replace(/[^a-z0-9\s-]/g, "") // Remove caracteres especiais
		.replace(/\s+/g, "-") // Substitui espaços por hífens
		.replace(/-{2,}/g, "-") // Remove apenas hífens CONSECUTIVOS (2 ou mais)
		.replace(/^-+/, ""); // Remove hífens apenas do INÍCIO
};

/**
 * Gera slug único adicionando sufixo numérico
 *
 * @param baseSlug - Slug base
 * @param existingSlugs - Slugs já existentes
 * @returns Slug único
 *
 * @example
 * generateUniqueSlug("meu-restaurante", ["meu-restaurante"])
 * // "meu-restaurante-1"
 */
export const generateUniqueSlug = (baseSlug: string, existingSlugs: string[]): string => {
	let slug = baseSlug;
	let counter = 1;

	while (existingSlugs.includes(slug)) {
		slug = `${baseSlug}-${counter}`;
		counter++;
	}

	return slug;
};

/**
 * Trunca slug para tamanho máximo mantendo palavras completas
 *
 * @param slug - Slug a ser truncado
 * @param maxLength - Tamanho máximo (padrão: 50)
 * @returns Slug truncado
 *
 * @example
 * truncateSlug("meu-restaurante-muito-grande-demais", 20)
 * // "meu-restaurante"
 */
export const truncateSlug = (slug: string, maxLength: number = 50): string => {
	if (slug.length <= maxLength) {
		return slug;
	}

	// Trunca no último hífen antes do limite
	const truncated = slug.substring(0, maxLength);
	const lastHyphen = truncated.lastIndexOf("-");

	if (lastHyphen > 0) {
		return truncated.substring(0, lastHyphen);
	}

	return truncated;
};
