/**
 * 📌 Formatadores de Código de Rastreamento
 *
 * Utilitários para formatar e validar códigos de rastreamento de pedidos.
 * Padrão: XXXX-YYYY (8 caracteres alfanuméricos sem caracteres confusos)
 */

/**
 * Formata código de rastreamento para exibição
 * @param codigo - Código no formato XXXXYYY ou XXXX-YYYY
 * @returns Código formatado XXXX-YYYY
 *
 * @example
 * formatarCodigoRastreamento('A3B7K9M2') // 'A3B7-K9M2'
 * formatarCodigoRastreamento('A3B7-K9M2') // 'A3B7-K9M2'
 */
export const formatarCodigoRastreamento = (codigo: string): string => {
	if (!codigo) return "";

	// Remove hífen se existir e converte para maiúsculas
	const limpo = codigo.replace("-", "").toUpperCase();

	// Adiciona hífen no meio
	if (limpo.length === 8) {
		return `${limpo.substring(0, 4)}-${limpo.substring(4)}`;
	}

	return codigo;
};

/**
 * Valida formato do código de rastreamento
 * @param codigo - Código a validar
 * @returns true se válido
 *
 * @example
 * validarCodigoRastreamento('A3B7-K9M2') // true
 * validarCodigoRastreamento('A3B7K9M2') // false (sem hífen)
 * validarCodigoRastreamento('O0I1-L1O0') // false (caracteres confusos)
 */
export const validarCodigoRastreamento = (codigo: string): boolean => {
	// Aceita apenas letras maiúsculas (sem O, I) e números (sem 0, 1)
	// Formato: XXXX-YYYY
	const regex = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4}-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4}$/;
	return regex.test(codigo);
};

/**
 * Normaliza código de rastreamento (remove hífen e converte para maiúsculas)
 * @param codigo - Código a normalizar
 * @returns Código normalizado sem hífen
 *
 * @example
 * normalizarCodigoRastreamento('a3b7-k9m2') // 'A3B7K9M2'
 * normalizarCodigoRastreamento('A3B7K9M2') // 'A3B7K9M2'
 */
export const normalizarCodigoRastreamento = (codigo: string): string => {
	if (!codigo) return "";
	return codigo.replace("-", "").toUpperCase();
};
