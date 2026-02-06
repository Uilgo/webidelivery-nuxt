/**
 * 📌 Validadores de Chave PIX
 *
 * Funções para validação de chaves PIX brasileiras.
 * Suporta: CPF, CNPJ, E-mail, Telefone e Chave Aleatória (EVP).
 */

import { isValidCPF } from "./document";
import { isValidEmail } from "./email";
import { isValidPhone } from "./phone";
import type { TipoChavePix } from "../formatters/pix";

/**
 * Valida CNPJ brasileiro
 *
 * @param cnpj - CNPJ a ser validado (com ou sem formatação)
 * @returns true se válido
 *
 * @example
 * isValidCNPJ("12.345.678/0001-90") // true
 * isValidCNPJ("12345678000190") // true
 * isValidCNPJ("11.111.111/1111-11") // false
 */
export const isValidCNPJ = (cnpj: string): boolean => {
	// Remove formatação
	const cleaned = cnpj.replace(/\D/g, "");

	// Verifica se tem 14 dígitos
	if (cleaned.length !== 14) {
		return false;
	}

	// Verifica se não é sequência de números iguais
	if (/^(\d)\1{13}$/.test(cleaned)) {
		return false;
	}

	// Validação do primeiro dígito verificador
	let sum = 0;
	let weight = 5;
	for (let i = 0; i < 12; i++) {
		sum += parseInt(cleaned.charAt(i)) * weight;
		weight = weight === 2 ? 9 : weight - 1;
	}
	let digit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
	if (digit !== parseInt(cleaned.charAt(12))) {
		return false;
	}

	// Validação do segundo dígito verificador
	sum = 0;
	weight = 6;
	for (let i = 0; i < 13; i++) {
		sum += parseInt(cleaned.charAt(i)) * weight;
		weight = weight === 2 ? 9 : weight - 1;
	}
	digit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
	if (digit !== parseInt(cleaned.charAt(13))) {
		return false;
	}

	return true;
};

/**
 * Valida telefone PIX (SEM DDI, apenas DDD + número)
 *
 * @param telefone - Telefone a ser validado
 * @returns true se válido
 *
 * @example
 * isValidPixPhone("(11) 98765-4321") // true
 * isValidPixPhone("11987654321") // true
 * isValidPixPhone("1133334444") // true
 */
export const isValidPixPhone = (telefone: string): boolean => {
	const cleaned = telefone.replace(/\D/g, "");

	// Deve ter 10 ou 11 dígitos (DDD + número, SEM +55)
	if (cleaned.length !== 10 && cleaned.length !== 11) {
		return false;
	}

	// Valida o número usando a função existente
	return isValidPhone(cleaned);
};

/**
 * Valida chave aleatória PIX (EVP - Endereço Virtual de Pagamento)
 *
 * @param chave - Chave aleatória a ser validada
 * @returns true se válido
 *
 * @example
 * isValidPixRandomKey("a1b2c3d4-e5f6-7890-abcd-ef1234567890") // true
 * isValidPixRandomKey("123456") // false
 */
export const isValidPixRandomKey = (chave: string): boolean => {
	// Formato UUID v4
	const uuidRegex = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
	return uuidRegex.test(chave);
};

/**
 * Valida chave PIX de acordo com o tipo
 *
 * @param chave - Chave PIX a ser validada
 * @param tipo - Tipo da chave PIX
 * @returns true se válido
 *
 * @example
 * isValidPixKey("123.456.789-09", "cpf") // true
 * isValidPixKey("12.345.678/0001-90", "cnpj") // true
 * isValidPixKey("usuario@exemplo.com", "email") // true
 * isValidPixKey("+55 11 98765-4321", "telefone") // true
 */
export const isValidPixKey = (chave: string, tipo: TipoChavePix): boolean => {
	if (!chave) return false;

	switch (tipo) {
		case "cpf":
			return isValidCPF(chave);

		case "cnpj":
			return isValidCNPJ(chave);

		case "email":
			return isValidEmail(chave);

		case "telefone":
			return isValidPixPhone(chave);

		case "aleatoria":
			return isValidPixRandomKey(chave);

		default:
			return false;
	}
};

/**
 * Valida chave PIX e retorna mensagem de erro se inválido
 *
 * @param chave - Chave PIX a ser validada
 * @param tipo - Tipo da chave PIX
 * @returns null se válido, mensagem de erro se inválido
 *
 * @example
 * validatePixKey("123.456.789-09", "cpf") // null
 * validatePixKey("123", "cpf") // "CPF inválido"
 */
export const validatePixKey = (chave: string, tipo: TipoChavePix): string | null => {
	if (!chave || chave.length === 0) {
		return "Chave PIX é obrigatória";
	}

	switch (tipo) {
		case "cpf": {
			const cleaned = chave.replace(/\D/g, "");
			if (cleaned.length !== 11) {
				return "CPF deve ter 11 dígitos";
			}
			if (!isValidCPF(chave)) {
				return "CPF inválido";
			}
			return null;
		}

		case "cnpj": {
			const cleaned = chave.replace(/\D/g, "");
			if (cleaned.length !== 14) {
				return "CNPJ deve ter 14 dígitos";
			}
			if (!isValidCNPJ(chave)) {
				return "CNPJ inválido";
			}
			return null;
		}

		case "email": {
			if (!isValidEmail(chave)) {
				return "E-mail inválido";
			}
			return null;
		}

		case "telefone": {
			const cleaned = chave.replace(/\D/g, "");
			if (cleaned.length !== 10 && cleaned.length !== 11) {
				return "Telefone deve ter 10 ou 11 dígitos (DDD + número)";
			}
			if (!isValidPixPhone(chave)) {
				return "Telefone inválido";
			}
			return null;
		}

		case "aleatoria": {
			if (!isValidPixRandomKey(chave)) {
				return "Chave aleatória inválida (deve ser um UUID válido)";
			}
			return null;
		}

		default:
			return "Tipo de chave inválido";
	}
};

/**
 * Valida se a chave PIX está ativa quando PIX está habilitado
 *
 * @param aceitaPix - Se aceita PIX
 * @param tipoChave - Tipo da chave PIX
 * @param chave - Chave PIX
 * @returns null se válido, mensagem de erro se inválido
 */
export const validatePixRequired = (
	aceitaPix: boolean,
	tipoChave: TipoChavePix | undefined,
	chave: string | undefined,
): string | null => {
	if (!aceitaPix) {
		return null; // PIX desabilitado, não precisa validar
	}

	if (!tipoChave) {
		return "Selecione o tipo de chave PIX";
	}

	if (!chave || chave.length === 0) {
		return "Chave PIX é obrigatória quando PIX está ativo";
	}

	return validatePixKey(chave, tipoChave);
};
