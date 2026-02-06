/**
 * 📌 Formatadores de Texto
 *
 * Funções para formatação e manipulação de strings.
 */

/**
 * Trunca texto com reticências
 *
 * @param text - Texto a ser truncado
 * @param maxLength - Comprimento máximo
 * @returns Texto truncado
 *
 * @example
 * truncate("Lorem ipsum dolor sit amet", 10) // "Lorem ipsu..."
 */
export const truncate = (text: string, maxLength: number): string => {
	if (text.length <= maxLength) {
		return text;
	}
	return text.slice(0, maxLength) + "...";
};

/**
 * Capitaliza primeira letra
 *
 * @param text - Texto a ser capitalizado
 * @returns Texto com primeira letra maiúscula
 *
 * @example
 * capitalize("hello world") // "Hello world"
 */
export const capitalize = (text: string): string => {
	if (!text) return "";
	return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

/**
 * Capitaliza todas as palavras
 *
 * @param text - Texto a ser capitalizado
 * @returns Texto com todas palavras capitalizadas
 *
 * @example
 * capitalizeWords("hello world") // "Hello World"
 */
export const capitalizeWords = (text: string): string => {
	if (!text) return "";
	return text
		.split(" ")
		.map((word) => capitalize(word))
		.join(" ");
};

/**
 * Converte para slug (URL-friendly)
 *
 * @param text - Texto a ser convertido
 * @returns Slug formatado
 *
 * @example
 * slugify("Olá Mundo!") // "ola-mundo"
 */
export const slugify = (text: string): string => {
	return text
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "") // Remove acentos
		.replace(/[^\w\s-]/g, "") // Remove caracteres especiais
		.replace(/\s+/g, "-") // Substitui espaços por hífens
		.replace(/-+/g, "-") // Remove hífens duplicados
		.trim();
};

/**
 * Remove espaços extras
 *
 * @param text - Texto a ser limpo
 * @returns Texto sem espaços extras
 *
 * @example
 * removeExtraSpaces("Hello    world") // "Hello world"
 */
export const removeExtraSpaces = (text: string): string => {
	return text.replace(/\s+/g, " ").trim();
};

/**
 * Formata iniciais de um nome
 *
 * @param name - Nome completo
 * @returns Iniciais (ex: "JS" para "João Silva")
 *
 * @example
 * getInitials("João Silva") // "JS"
 * getInitials("Maria") // "M"
 */
export const getInitials = (name: string): string => {
	if (!name) return "";

	const words = name.trim().split(" ");
	if (words.length === 1) {
		return words[0]?.charAt(0).toUpperCase() || "";
	}

	return ((words[0]?.charAt(0) || "") + (words[words.length - 1]?.charAt(0) || "")).toUpperCase();
};
