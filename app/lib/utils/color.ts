/**
 * 📌 Utilitários de Cores
 *
 * Funções para manipulação e análise de cores.
 * Usado para gerar cores automáticas com contraste adequado.
 */

/**
 * Converte cor hexadecimal para RGB
 */
export const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
	// Remove # se existir
	const cleanHex = hex.replace("#", "");

	// Valida formato
	if (!/^[0-9A-Fa-f]{6}$/.test(cleanHex)) {
		return null;
	}

	const r = parseInt(cleanHex.substring(0, 2), 16);
	const g = parseInt(cleanHex.substring(2, 4), 16);
	const b = parseInt(cleanHex.substring(4, 6), 16);

	return { r, g, b };
};

/**
 * Converte RGB para hexadecimal
 */
export const rgbToHex = (r: number, g: number, b: number): string => {
	const toHex = (n: number) => {
		const hex = Math.round(Math.max(0, Math.min(255, n))).toString(16);
		return hex.length === 1 ? "0" + hex : hex;
	};

	return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

/**
 * Calcula a luminosidade relativa de uma cor (WCAG)
 * Retorna valor entre 0 (preto) e 1 (branco)
 */
export const getLuminance = (hex: string): number => {
	const rgb = hexToRgb(hex);
	if (!rgb) return 0;

	// Converte para valores sRGB
	const rsRGB = rgb.r / 255;
	const gsRGB = rgb.g / 255;
	const bsRGB = rgb.b / 255;

	// Aplica correção gamma
	const r = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
	const g = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
	const b = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

	// Calcula luminosidade relativa
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/**
 * Verifica se uma cor é escura (luminosidade < 0.5)
 */
export const isColorDark = (hex: string): boolean => {
	return getLuminance(hex) < 0.5;
};

/**
 * Clareia uma cor em uma porcentagem
 * @param hex - Cor em hexadecimal
 * @param percent - Porcentagem para clarear (0-100)
 */
export const lighten = (hex: string, percent: number): string => {
	const rgb = hexToRgb(hex);
	if (!rgb) return hex;

	const amount = (percent / 100) * 255;

	return rgbToHex(rgb.r + amount, rgb.g + amount, rgb.b + amount);
};

/**
 * Escurece uma cor em uma porcentagem
 * @param hex - Cor em hexadecimal
 * @param percent - Porcentagem para escurecer (0-100)
 */
export const darken = (hex: string, percent: number): string => {
	const rgb = hexToRgb(hex);
	if (!rgb) return hex;

	const amount = (percent / 100) * 255;

	return rgbToHex(rgb.r - amount, rgb.g - amount, rgb.b - amount);
};

/**
 * Gera cor de card automaticamente baseada na cor de fundo
 * Garante contraste visível e agradável
 *
 * @param backgroundColor - Cor de fundo em hexadecimal
 * @returns Cor do card em hexadecimal
 */
export const getCardColor = (backgroundColor: string): string => {
	const isDark = isColorDark(backgroundColor);

	if (isDark) {
		// Fundo escuro → card mais claro (10-12%)
		return lighten(backgroundColor, 11);
	} else {
		// Fundo claro → card mais escuro (8-10%)
		return darken(backgroundColor, 9);
	}
};

/**
 * Gera cor para elementos de UI não selecionados (botões, categorias)
 * Contraste sutil mas perceptível
 *
 * @param backgroundColor - Cor de fundo em hexadecimal
 * @returns Cor do elemento UI em hexadecimal
 */
export const getUIElementColor = (backgroundColor: string): string => {
	const isDark = isColorDark(backgroundColor);

	if (isDark) {
		// Fundo escuro → elemento mais claro (5-6%)
		return lighten(backgroundColor, 5.5);
	} else {
		// Fundo claro → elemento mais escuro (5-6%)
		return darken(backgroundColor, 5.5);
	}
};

/**
 * Gera cor para hover em elementos de UI
 * Contraste visível - feedback claro de interação
 *
 * @param backgroundColor - Cor de fundo em hexadecimal
 * @returns Cor do hover em hexadecimal
 */
export const getUIHoverColor = (backgroundColor: string): string => {
	const isDark = isColorDark(backgroundColor);

	if (isDark) {
		// Fundo escuro → hover mais claro (8-9%)
		return lighten(backgroundColor, 8.5);
	} else {
		// Fundo claro → hover mais escuro (8-9%)
		return darken(backgroundColor, 8.5);
	}
};

/**
 * Gera cor para bordas e divisores
 * Contraste sutil - separação visual clara
 *
 * @param backgroundColor - Cor de fundo em hexadecimal
 * @returns Cor da borda em hexadecimal
 */
export const getBorderColor = (backgroundColor: string): string => {
	const isDark = isColorDark(backgroundColor);

	if (isDark) {
		// Fundo escuro → borda mais clara (3-4%)
		return lighten(backgroundColor, 3.5);
	} else {
		// Fundo claro → borda mais escura (3-4%)
		return darken(backgroundColor, 3.5);
	}
};

/**
 * Gera cor para badges e botões que precisam ser bem visíveis
 * Contraste forte - máxima visibilidade
 *
 * @param backgroundColor - Cor de fundo em hexadecimal
 * @returns Cor da badge em hexadecimal
 */
export const getBadgeColor = (backgroundColor: string): string => {
	const isDark = isColorDark(backgroundColor);

	if (isDark) {
		// Fundo escuro → badge bem mais clara (15-18%)
		return lighten(backgroundColor, 16);
	} else {
		// Fundo claro → badge bem mais escura (15-18%)
		return darken(backgroundColor, 16);
	}
};

/**
 * Gera cor de texto muted (60% de opacidade visual)
 * Simula opacidade através de mistura com o fundo
 *
 * @param textColor - Cor do texto principal
 * @param backgroundColor - Cor de fundo
 * @returns Cor do texto muted em hexadecimal
 */
export const getMutedTextColor = (textColor: string, backgroundColor: string): string => {
	const text = hexToRgb(textColor);
	const bg = hexToRgb(backgroundColor);

	if (!text || !bg) return textColor;

	// Mistura 60% texto + 40% fundo (simula opacity: 0.6)
	const r = text.r * 0.6 + bg.r * 0.4;
	const g = text.g * 0.6 + bg.g * 0.4;
	const b = text.b * 0.6 + bg.b * 0.4;

	return rgbToHex(r, g, b);
};

/**
 * Calcula contraste entre duas cores (WCAG)
 * Retorna valor entre 1 (sem contraste) e 21 (máximo contraste)
 */
export const getContrast = (color1: string, color2: string): number => {
	const lum1 = getLuminance(color1);
	const lum2 = getLuminance(color2);

	const lighter = Math.max(lum1, lum2);
	const darker = Math.min(lum1, lum2);

	return (lighter + 0.05) / (darker + 0.05);
};

/**
 * Verifica se o contraste atende aos padrões WCAG
 * @param color1 - Primeira cor
 * @param color2 - Segunda cor
 * @param level - Nível WCAG ('AA' ou 'AAA')
 * @param size - Tamanho do texto ('normal' ou 'large')
 */
export const meetsWCAG = (
	color1: string,
	color2: string,
	level: "AA" | "AAA" = "AA",
	size: "normal" | "large" = "normal",
): boolean => {
	const contrast = getContrast(color1, color2);

	if (level === "AAA") {
		return size === "large" ? contrast >= 4.5 : contrast >= 7;
	}

	// AA
	return size === "large" ? contrast >= 3 : contrast >= 4.5;
};
