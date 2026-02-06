/**
 * 📌 Formatadores de Chave PIX
 *
 * Funções para formatação de chaves PIX brasileiras.
 * Suporta: CPF, CNPJ, E-mail, Telefone e Chave Aleatória (EVP).
 */

import { formatCPF, parseCPF, maskCPF } from "./document";

/**
 * Tipos de chave PIX suportados
 */
export type TipoChavePix = "cpf" | "cnpj" | "email" | "telefone" | "aleatoria";

/**
 * Formata telefone PIX (sem DDI +55, apenas DDD + número)
 *
 * @param telefone - Número de telefone (apenas dígitos)
 * @returns String formatada
 *
 * @example
 * formatPixPhone("11987654321") // "(11) 98765-4321"
 * formatPixPhone("1133334444") // "(11) 3333-4444"
 */
export const formatPixPhone = (telefone: string): string => {
	// Remove tudo que não é dígito
	const cleaned = telefone.replace(/\D/g, "");

	// Celular com 11 dígitos: (XX) XXXXX-XXXX
	if (cleaned.length === 11) {
		return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
	}

	// Fixo com 10 dígitos: (XX) XXXX-XXXX
	if (cleaned.length === 10) {
		return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
	}

	// Retorna original se não for formato válido
	return telefone;
};

/**
 * Formata telefone PIX progressivamente conforme o usuário digita
 *
 * @param value - Valor atual do input
 * @returns Valor formatado progressivamente
 *
 * @example
 * formatPixPhoneProgressive("11") // "(11"
 * formatPixPhoneProgressive("119") // "(11) 9"
 * formatPixPhoneProgressive("11987654321") // "(11) 98765-4321"
 */
export const formatPixPhoneProgressive = (value: string): string => {
	const cleaned = value.replace(/\D/g, "").slice(0, 11);

	if (cleaned.length === 0) return "";
	if (cleaned.length <= 2) return `(${cleaned}`;
	if (cleaned.length <= 6) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
	if (cleaned.length <= 10)
		return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
	return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
};

/**
 * Formata CNPJ brasileiro
 *
 * @param cnpj - CNPJ (apenas dígitos)
 * @returns String formatada
 *
 * @example
 * formatCNPJ("12345678000190") // "12.345.678/0001-90"
 */
export const formatCNPJ = (cnpj: string): string => {
	// Remove tudo que não é dígito
	const cleaned = cnpj.replace(/\D/g, "");

	// Formata: XX.XXX.XXX/XXXX-XX
	if (cleaned.length === 14) {
		return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
	}

	// Retorna original se não for formato válido
	return cnpj;
};

/**
 * Remove formatação do CNPJ
 *
 * @param cnpj - CNPJ formatado
 * @returns Apenas dígitos
 *
 * @example
 * parseCNPJ("12.345.678/0001-90") // "12345678000190"
 */
export const parseCNPJ = (cnpj: string): string => {
	return cnpj.replace(/\D/g, "");
};

/**
 * Detecta automaticamente o tipo de chave PIX
 *
 * @param chave - Chave PIX a ser analisada
 * @returns Tipo da chave detectado
 *
 * @example
 * detectPixKeyType("123.456.789-09") // "cpf"
 * detectPixKeyType("12.345.678/0001-90") // "cnpj"
 * detectPixPixKeyType("usuario@exemplo.com") // "email"
 * detectPixKeyType("11987654321") // "telefone"
 * detectPixKeyType("a1b2c3d4-e5f6-7890-abcd-ef1234567890") // "aleatoria"
 */
export const detectPixKeyType = (chave: string): TipoChavePix | null => {
	if (!chave) return null;

	const cleaned = chave.replace(/\D/g, "");

	// CPF: 11 dígitos
	if (cleaned.length === 11 && /^\d{11}$/.test(cleaned)) {
		return "cpf";
	}

	// CNPJ: 14 dígitos
	if (cleaned.length === 14 && /^\d{14}$/.test(cleaned)) {
		return "cnpj";
	}

	// E-mail: contém @ e domínio
	if (chave.includes("@") && chave.includes(".")) {
		return "email";
	}

	// Telefone: DDD + número (10 ou 11 dígitos, SEM +55)
	if (cleaned.length === 10 || cleaned.length === 11) {
		return "telefone";
	}

	// Chave Aleatória (EVP): formato UUID
	if (/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(chave)) {
		return "aleatoria";
	}

	return null;
};

/**
 * Formata chave PIX de acordo com o tipo
 *
 * @param chave - Chave PIX a ser formatada
 * @param tipo - Tipo da chave (opcional, será detectado automaticamente)
 * @returns Chave formatada
 *
 * @example
 * formatPixKey("12345678909", "cpf") // "123.456.789-09"
 * formatPixKey("12345678000190", "cnpj") // "12.345.678/0001-90"
 * formatPixKey("11987654321", "telefone") // "(11) 98765-4321"
 * formatPixKey("usuario@exemplo.com", "email") // "usuario@exemplo.com"
 */
export const formatPixKey = (chave: string, tipo?: TipoChavePix): string => {
	if (!chave) return "";

	// Detectar tipo automaticamente se não fornecido
	const tipoDetectado = tipo || detectPixKeyType(chave);

	if (!tipoDetectado) return chave;

	switch (tipoDetectado) {
		case "cpf":
			return formatCPF(chave);

		case "cnpj":
			return formatCNPJ(chave);

		case "telefone":
			// Formata telefone PIX (sem +55)
			return formatPixPhone(chave);

		case "email":
			// E-mail não precisa de formatação, apenas lowercase
			return chave.toLowerCase().trim();

		case "aleatoria":
			// Chave aleatória não precisa de formatação
			return chave.toLowerCase();

		default:
			return chave;
	}
};

/**
 * Remove formatação da chave PIX
 *
 * @param chave - Chave PIX formatada
 * @param tipo - Tipo da chave
 * @returns Chave sem formatação
 *
 * @example
 * parsePixKey("123.456.789-09", "cpf") // "12345678909"
 * parsePixKey("(11) 98765-4321", "telefone") // "11987654321"
 */
export const parsePixKey = (chave: string, tipo: TipoChavePix): string => {
	if (!chave) return "";

	switch (tipo) {
		case "cpf":
			return parseCPF(chave);

		case "cnpj":
			return parseCNPJ(chave);

		case "telefone":
			// Remove formatação (já existe no phone.ts)
			return chave.replace(/\D/g, "");

		case "email":
		case "aleatoria":
			return chave.toLowerCase().trim();

		default:
			return chave;
	}
};

/**
 * Mascara chave PIX parcialmente (para exibição segura)
 *
 * @param chave - Chave PIX a ser mascarada
 * @param tipo - Tipo da chave
 * @returns Chave mascarada
 *
 * @example
 * maskPixKey("12345678909", "cpf") // "123.***.***-09"
 * maskPixKey("usuario@exemplo.com", "email") // "usu***@exemplo.com"
 * maskPixKey("11987654321", "telefone") // "(11) 9****-4321"
 */
export const maskPixKey = (chave: string, tipo: TipoChavePix): string => {
	if (!chave) return "";

	switch (tipo) {
		case "cpf":
			// Reutiliza maskCPF que já existe
			return maskCPF(chave);

		case "cnpj": {
			const cleaned = chave.replace(/\D/g, "");
			if (cleaned.length === 14) {
				return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.***.***/****-$5");
			}
			return chave;
		}

		case "telefone": {
			const cleaned = chave.replace(/\D/g, "");

			if (cleaned.length === 11) {
				return `(${cleaned.slice(0, 2)}) 9****-${cleaned.slice(7)}`;
			} else if (cleaned.length === 10) {
				return `(${cleaned.slice(0, 2)}) ****-${cleaned.slice(6)}`;
			}
			return chave;
		}

		case "email": {
			const [local, domain] = chave.split("@");
			if (local && domain) {
				const maskedLocal = local.length > 3 ? local.slice(0, 3) + "***" : local;
				return `${maskedLocal}@${domain}`;
			}
			return chave;
		}

		case "aleatoria":
			// Mascara UUID: mostra apenas primeiros e últimos 4 caracteres
			if (chave.length > 8) {
				return `${chave.slice(0, 4)}****-****-****-****${chave.slice(-4)}`;
			}
			return chave;

		default:
			return chave;
	}
};

/**
 * Formata chave PIX progressivamente conforme o usuário digita
 *
 * @param value - Valor atual do input
 * @param tipo - Tipo da chave PIX
 * @returns Valor formatado progressivamente
 *
 * @example
 * formatPixKeyProgressive("123", "cpf") // "123"
 * formatPixKeyProgressive("12345678", "cpf") // "123.456.78"
 * formatPixKeyProgressive("12345678909", "cpf") // "123.456.789-09"
 */
export const formatPixKeyProgressive = (value: string, tipo: TipoChavePix): string => {
	if (!value) return "";

	switch (tipo) {
		case "cpf": {
			const cleaned = value.replace(/\D/g, "").slice(0, 11);
			if (cleaned.length <= 3) return cleaned;
			if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}.${cleaned.slice(3)}`;
			if (cleaned.length <= 9)
				return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6)}`;
			return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9)}`;
		}

		case "cnpj": {
			const cleaned = value.replace(/\D/g, "").slice(0, 14);
			if (cleaned.length <= 2) return cleaned;
			if (cleaned.length <= 5) return `${cleaned.slice(0, 2)}.${cleaned.slice(2)}`;
			if (cleaned.length <= 8)
				return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5)}`;
			if (cleaned.length <= 12)
				return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}/${cleaned.slice(8)}`;
			return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}/${cleaned.slice(8, 12)}-${cleaned.slice(12)}`;
		}

		case "telefone":
			// Formata telefone PIX progressivamente (sem +55)
			return formatPixPhoneProgressive(value);

		case "email":
		case "aleatoria":
			return value.toLowerCase();

		default:
			return value;
	}
};
