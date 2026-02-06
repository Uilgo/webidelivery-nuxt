/**
 * 📌 Schemas de Validação - Autenticação
 *
 * Schemas Zod para validação de formulários de autenticação.
 * Baseado nas regras definidas no PRD e nos tipos em shared/types/perfis.ts
 */

import { z } from "zod";

// ========================================
// VALIDAÇÕES CUSTOMIZADAS
// ========================================

/**
 * Validação de email RFC compliant
 */
export const emailSchema = z
	.string()
	.min(1, "E-mail é obrigatório")
	.regex(
		/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
		"Formato de e-mail inválido",
	)
	.toLowerCase()
	.transform((email) => email.trim());

/**
 * Validação de senha conforme configuração do Supabase:
 * - Lowercase letters (a-z)
 * - Uppercase letters (A-Z)
 * - Digits (0-9)
 * - Symbols (!@#$%^&*(),.?":{}|<>)
 * - Mínimo 8 caracteres
 */
const passwordSchema = z
	.string()
	.min(8, "A senha deve ter pelo menos 8 caracteres")
	.regex(/[a-z]/, "A senha deve conter pelo menos uma letra minúscula")
	.regex(/[A-Z]/, "A senha deve conter pelo menos uma letra maiúscula")
	.regex(/\d/, "A senha deve conter pelo menos um número")
	.regex(/[!@#$%^&*(),.?":{}|<>]/, "A senha deve conter pelo menos um símbolo (!@#$%^&*)");

/**
 * Validação de nome (sem números ou caracteres especiais)
 */
const nomeSchema = z
	.string()
	.min(1, "Nome é obrigatório")
	.min(2, "Nome deve ter pelo menos 2 caracteres")
	.max(50, "Nome deve ter no máximo 50 caracteres")
	.regex(/^[a-zA-ZÀ-ÿ\s]+$/, "Nome deve conter apenas letras")
	.transform((nome) => nome.trim());

/**
 * Validação de sobrenome
 */
const sobrenomeSchema = z
	.string()
	.min(1, "Sobrenome é obrigatório")
	.min(2, "Sobrenome deve ter pelo menos 2 caracteres")
	.max(50, "Sobrenome deve ter no máximo 50 caracteres")
	.regex(/^[a-zA-ZÀ-ÿ\s]+$/, "Sobrenome deve conter apenas letras")
	.transform((sobrenome) => sobrenome.trim());

/**
 * Validação de código WEBI (para super admin)
 */
export const codigoWebiSchema = z
	.string()
	.min(1, "Código WEBI é obrigatório")
	.length(8, "Código WEBI deve ter exatamente 8 caracteres")
	.regex(/^WEBI[0-9]{4}$/, "Código WEBI deve seguir o formato WEBI0000");

/**
 * Validação de código EQUIPE (para membros da equipe)
 */
export const codigoEquipeSchema = z
	.string()
	.min(1, "Código da equipe é obrigatório")
	.length(10, "Código da equipe deve ter exatamente 10 caracteres")
	.regex(/^[A-Z0-9]{10}$/, "Código da equipe deve conter apenas letras maiúsculas e números");

// ========================================
// SCHEMAS PRINCIPAIS
// ========================================

/**
 * Schema para login de estabelecimentos
 */
export const loginSchema = z.object({
	email: emailSchema,
	password: z.string().min(1, "Senha é obrigatória"),
	remember: z.boolean(),
});

/**
 * Schema para login do super admin
 */
export const superAdminLoginSchema = z.object({
	email: emailSchema,
	password: z.string().min(1, "Senha é obrigatória"),
	remember: z.boolean(),
});

/**
 * Schema para cadastro de estabelecimentos (admin)
 */
export const registerSchema = z
	.object({
		nome: nomeSchema,
		sobrenome: sobrenomeSchema,
		email: emailSchema,
		password: passwordSchema,
		confirm_password: z.string().min(1, "Confirmação de senha é obrigatória"),
		terms: z.boolean().refine((val) => val === true, {
			message: "Você deve aceitar os termos de uso",
		}),
		privacy: z.boolean().refine((val) => val === true, {
			message: "Você deve aceitar a política de privacidade",
		}),
	})
	.refine((data) => data.password === data.confirm_password, {
		message: "As senhas não coincidem",
		path: ["confirm_password"],
	});

/**
 * Schema para cadastro de gerente plataforma (super admin)
 */
export const superAdminRegisterSchema = z
	.object({
		nome: nomeSchema,
		sobrenome: sobrenomeSchema,
		email: emailSchema,
		password: passwordSchema,
		confirm_password: z.string().min(1, "Confirmação de senha é obrigatória"),
		codigo_webi: codigoWebiSchema,
		terms: z.boolean().refine((val) => val === true, {
			message: "Você deve aceitar os termos de uso",
		}),
		privacy: z.boolean().refine((val) => val === true, {
			message: "Você deve aceitar a política de privacidade",
		}),
	})
	.refine((data) => data.password === data.confirm_password, {
		message: "As senhas não coincidem",
		path: ["confirm_password"],
	});

/**
 * Schema para cadastro de membro da equipe
 */
export const teamMemberRegisterSchema = z
	.object({
		nome: nomeSchema,
		sobrenome: sobrenomeSchema,
		email: emailSchema,
		password: passwordSchema,
		confirm_password: z.string().min(1, "Confirmação de senha é obrigatória"),
		codigo_equipe: codigoEquipeSchema,
		terms: z.boolean().refine((val) => val === true, {
			message: "Você deve aceitar os termos de uso",
		}),
		privacy: z.boolean().refine((val) => val === true, {
			message: "Você deve aceitar a política de privacidade",
		}),
	})
	.refine((data) => data.password === data.confirm_password, {
		message: "As senhas não coincidem",
		path: ["confirm_password"],
	});

/**
 * Schema para recuperação de senha de estabelecimentos
 */
export const forgotPasswordSchema = z.object({
	email: emailSchema,
});

/**
 * Schema para recuperação de senha da plataforma
 */
export const superAdminForgotPasswordSchema = z.object({
	email: emailSchema,
});

/**
 * Schema para redefinição de senha
 */
export const resetPasswordSchema = z
	.object({
		password: passwordSchema,
		confirm_password: z.string().min(1, "Confirmação de senha é obrigatória"),
	})
	.refine((data) => data.password === data.confirm_password, {
		message: "As senhas não coincidem",
		path: ["confirm_password"],
	});

// ========================================
// TIPOS INFERIDOS DOS SCHEMAS
// ========================================

export type LoginFormData = z.infer<typeof loginSchema>;
export type SuperAdminLoginFormData = z.infer<typeof superAdminLoginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type SuperAdminRegisterFormData = z.infer<typeof superAdminRegisterSchema>;
export type TeamMemberRegisterFormData = z.infer<typeof teamMemberRegisterSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type SuperAdminForgotPasswordFormData = z.infer<typeof superAdminForgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
