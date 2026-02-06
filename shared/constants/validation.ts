/**
 * 📌 Constantes de Validação
 *
 * Mensagens de validação padrão e configurações.
 */

// ========================================
// MENSAGENS DE ERRO PADRÃO
// ========================================

export const VALIDATION_MESSAGES = {
	// Campos obrigatórios
	REQUIRED: "Este campo é obrigatório",
	REQUIRED_FIELD: (field: string) => `${field} é obrigatório`,

	// Email
	EMAIL_INVALID: "Formato de e-mail inválido",
	EMAIL_REQUIRED: "E-mail é obrigatório",
	EMAIL_MAX_LENGTH: "E-mail deve ter no máximo 254 caracteres",

	// Senha
	PASSWORD_REQUIRED: "Senha é obrigatória",
	PASSWORD_MIN_LENGTH: "A senha deve ter pelo menos 8 caracteres",
	PASSWORD_MUST_HAVE_LETTER: "A senha deve conter pelo menos uma letra",
	PASSWORD_MUST_HAVE_NUMBER: "A senha deve conter pelo menos um número",
	PASSWORD_MUST_HAVE_SPECIAL: "A senha deve conter pelo menos um caractere especial",
	PASSWORD_MISMATCH: "As senhas não coincidem",
	PASSWORD_SAME_AS_OLD: "Nova senha deve ser diferente da senha atual",

	// Nome
	NAME_REQUIRED: "Nome é obrigatório",
	NAME_MIN_LENGTH: "Nome deve ter pelo menos 2 caracteres",
	NAME_MAX_LENGTH: "Nome deve ter no máximo 50 caracteres",
	NAME_ONLY_LETTERS: "Nome deve conter apenas letras",

	// Telefone
	PHONE_REQUIRED: "Telefone é obrigatório",
	PHONE_INVALID: "Telefone inválido",
	PHONE_LENGTH: "Telefone deve ter 10 ou 11 dígitos",
	PHONE_DDD_INVALID: "DDD inválido",

	// WhatsApp
	WHATSAPP_REQUIRED: "WhatsApp é obrigatório",
	WHATSAPP_INVALID: "WhatsApp inválido",
	WHATSAPP_LENGTH: "WhatsApp deve ter 12 ou 13 dígitos (com DDI 55)",
	WHATSAPP_DDI: "WhatsApp deve começar com DDI 55",

	// CPF
	CPF_REQUIRED: "CPF é obrigatório",
	CPF_INVALID: "CPF inválido",
	CPF_LENGTH: "CPF deve ter 11 dígitos",

	// CEP
	CEP_REQUIRED: "CEP é obrigatório",
	CEP_INVALID: "CEP inválido",
	CEP_LENGTH: "CEP deve ter 8 dígitos",

	// Endereço
	ADDRESS_STREET_REQUIRED: "Rua é obrigatória",
	ADDRESS_NUMBER_REQUIRED: "Número é obrigatório",
	ADDRESS_NEIGHBORHOOD_REQUIRED: "Bairro é obrigatório",
	ADDRESS_CITY_REQUIRED: "Cidade é obrigatória",
	ADDRESS_STATE_REQUIRED: "Estado é obrigatório",
	ADDRESS_STATE_INVALID: "Estado inválido",

	// Slug
	SLUG_REQUIRED: "Slug é obrigatório",
	SLUG_MIN_LENGTH: "Slug deve ter pelo menos 3 caracteres",
	SLUG_MAX_LENGTH: "Slug deve ter no máximo 50 caracteres",
	SLUG_INVALID_FORMAT: "Slug deve conter apenas letras minúsculas, números e hífens",
	SLUG_MUST_START_WITH_LETTER: "Slug deve começar com uma letra",
	SLUG_CANNOT_END_WITH_HYPHEN: "Slug não pode terminar com hífen",
	SLUG_NO_CONSECUTIVE_HYPHENS: "Slug não pode conter hífens consecutivos",
	SLUG_ALREADY_EXISTS: "Este slug já está em uso",

	// Valores numéricos
	NUMBER_POSITIVE: "Valor deve ser positivo",
	NUMBER_NON_NEGATIVE: "Valor deve ser não negativo",
	NUMBER_INTEGER: "Valor deve ser um número inteiro",
	NUMBER_MIN: (min: number) => `Valor mínimo é ${min}`,
	NUMBER_MAX: (max: number) => `Valor máximo é ${max}`,

	// Datas
	DATE_INVALID: "Data inválida",
	DATE_REQUIRED: "Data é obrigatória",
	DATE_MIN: (min: string) => `Data mínima é ${min}`,
	DATE_MAX: (max: string) => `Data máxima é ${max}`,

	// Horários
	TIME_INVALID: "Horário inválido (formato HH:MM)",
	TIME_REQUIRED: "Horário é obrigatório",
	TIME_OPENING_REQUIRED: "Horário de abertura é obrigatório",
	TIME_CLOSING_REQUIRED: "Horário de fechamento é obrigatório",

	// Termos e políticas
	TERMS_REQUIRED: "Você deve aceitar os termos de uso",
	PRIVACY_REQUIRED: "Você deve aceitar a política de privacidade",

	// Códigos
	CODE_REQUIRED: "Código é obrigatório",
	CODE_INVALID: "Código inválido",
	CODE_LENGTH: (length: number) => `Código deve ter ${length} caracteres`,

	// Arquivos
	FILE_REQUIRED: "Arquivo é obrigatório",
	FILE_TOO_LARGE: (maxSize: string) => `Arquivo deve ter no máximo ${maxSize}`,
	FILE_INVALID_TYPE: (types: string) => `Tipo de arquivo inválido. Aceitos: ${types}`,

	// Genéricos
	INVALID_FORMAT: "Formato inválido",
	INVALID_VALUE: "Valor inválido",
	MIN_LENGTH: (min: number) => `Deve ter pelo menos ${min} caracteres`,
	MAX_LENGTH: (max: number) => `Deve ter no máximo ${max} caracteres`,
	MIN_ITEMS: (min: number) => `Deve ter pelo menos ${min} item(ns)`,
	MAX_ITEMS: (max: number) => `Deve ter no máximo ${max} item(ns)`,
} as const;

// ========================================
// REGEX PATTERNS
// ========================================

export const VALIDATION_PATTERNS = {
	EMAIL:
		/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
	PASSWORD_LETTER: /[a-zA-Z]/,
	PASSWORD_NUMBER: /\d/,
	PASSWORD_SPECIAL: /[!@#$%^&*(),.?":{}|<>]/,
	PHONE: /^\d{10,11}$/,
	WHATSAPP: /^\d{12,13}$/,
	CPF: /^\d{11}$/,
	CEP: /^\d{8}$/,
	SLUG: /^[a-z0-9-]+$/,
	SLUG_START: /^[a-z]/,
	SLUG_END: /[^-]$/,
	SLUG_CONSECUTIVE_HYPHENS: /--/,
	TIME: /^([01]\d|2[0-3]):([0-5]\d)$/,
	ONLY_LETTERS: /^[a-zA-ZÀ-ÿ\s]+$/,
	ONLY_NUMBERS: /^\d+$/,
	ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
} as const;

// ========================================
// LIMITES DE TAMANHO
// ========================================

export const VALIDATION_LIMITS = {
	// Texto
	NAME_MIN: 2,
	NAME_MAX: 50,
	DESCRIPTION_MAX: 500,
	OBSERVATION_MAX: 500,
	COMMENT_MAX: 500,

	// Email e senha
	EMAIL_MAX: 254,
	PASSWORD_MIN: 8,
	PASSWORD_MAX: 128,

	// Telefone
	PHONE_MIN: 10,
	PHONE_MAX: 11,
	WHATSAPP_MIN: 12,
	WHATSAPP_MAX: 13,

	// Documentos
	CPF_LENGTH: 11,
	CEP_LENGTH: 8,

	// Slug
	SLUG_MIN: 3,
	SLUG_MAX: 50,

	// Códigos
	CODE_WEBI_LENGTH: 8,
	CODE_EQUIPE_LENGTH: 10,

	// Endereço
	ADDRESS_STREET_MAX: 200,
	ADDRESS_NUMBER_MAX: 20,
	ADDRESS_COMPLEMENT_MAX: 100,
	ADDRESS_NEIGHBORHOOD_MAX: 100,
	ADDRESS_CITY_MAX: 100,
	ADDRESS_REFERENCE_MAX: 200,

	// Arquivos
	IMAGE_MAX_SIZE: 5 * 1024 * 1024, // 5MB
	DOCUMENT_MAX_SIZE: 10 * 1024 * 1024, // 10MB

	// Pedidos
	MAX_ITEMS_PER_ORDER: 50,
	MAX_ADDITIONALS_PER_ITEM: 20,
} as const;

// ========================================
// TIPOS DE ARQUIVO ACEITOS
// ========================================

export const ACCEPTED_FILE_TYPES = {
	IMAGE: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
	DOCUMENT: [
		"application/pdf",
		"application/msword",
		"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	],
	SPREADSHEET: [
		"application/vnd.ms-excel",
		"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	],
} as const;

// ========================================
// HELPERS
// ========================================

/**
 * Formata tamanho de arquivo para exibição
 */
export const formatFileSize = (bytes: number): string => {
	if (bytes === 0) return "0 Bytes";

	const k = 1024;
	const sizes = ["Bytes", "KB", "MB", "GB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

/**
 * Formata lista de tipos de arquivo para exibição
 */
export const formatFileTypes = (types: readonly string[]): string => {
	return types
		.map((type) => {
			const parts = type.split("/");
			return parts[1]?.toUpperCase() || "";
		})
		.join(", ");
};
