/**
 * 📌 Schemas de Validação - Equipe
 *
 * Schemas Zod para validação de gerenciamento de equipe.
 */

import { z } from "zod";
import { CARGOS } from "../types/database";
import { VALIDATION_PATTERNS, VALIDATION_MESSAGES } from "../constants/validation";

// ========================================
// SCHEMAS DE CARGO
// ========================================

/**
 * Schema para cargo
 */
export const cargoSchema = z.enum(CARGOS, {
	message: "Cargo inválido",
});

/**
 * Schema para cargos de estabelecimento (sem plataforma)
 */
export const cargoEstabelecimentoSchema = z.enum(["admin", "gerente", "staff", "entregador"], {
	message: "Cargo de estabelecimento inválido",
});

/**
 * Schema para cargos que podem ser criados por gerente
 */
export const cargoGerenteSchema = z.enum(["staff", "entregador"], {
	message: "Gerente só pode criar Staff ou Entregador",
});

// ========================================
// SCHEMAS DE CONVITE
// ========================================

/**
 * Schema para gerar código de convite
 */
export const gerarCodigoConviteSchema = z.object({
	cargo: cargoEstabelecimentoSchema,
	dias_validade: z
		.number()
		.int("Dias de validade deve ser inteiro")
		.min(1, "Mínimo de 1 dia")
		.max(90, "Máximo de 90 dias"),
});

/**
 * Schema para validar código de convite
 */
export const validarCodigoConviteSchema = z.object({
	codigo: z
		.string()
		.min(1, "Código é obrigatório")
		.length(10, "Código deve ter 10 caracteres")
		.regex(/^[A-Z0-9]{10}$/, "Código deve conter apenas letras maiúsculas e números")
		.toUpperCase(),
});

/**
 * Schema para revogar código de convite
 */
export const revogarCodigoConviteSchema = z.object({
	codigo_id: z.string().uuid("ID do código inválido"),
});

// ========================================
// SCHEMAS DE MEMBRO DA EQUIPE
// ========================================

/**
 * Schema para atualizar membro da equipe
 */
export const atualizarMembroSchema = z.object({
	membro_id: z.string().uuid("ID do membro inválido"),
	nome: z
		.string()
		.min(2, "Nome deve ter pelo menos 2 caracteres")
		.max(50, "Nome deve ter no máximo 50 caracteres")
		.optional(),
	sobrenome: z
		.string()
		.min(2, "Sobrenome deve ter pelo menos 2 caracteres")
		.max(50, "Sobrenome deve ter no máximo 50 caracteres")
		.optional(),
	telefone: z
		.string()
		.regex(VALIDATION_PATTERNS.PHONE, VALIDATION_MESSAGES.PHONE_LENGTH)
		.optional(),
	cargo: cargoEstabelecimentoSchema.optional(),
	ativo: z.boolean().optional(),
});

/**
 * Schema para remover membro da equipe (soft delete)
 */
export const removerMembroSchema = z.object({
	membro_id: z.string().uuid("ID do membro inválido"),
});

/**
 * Schema para deletar membro da equipe (hard delete)
 */
export const deletarMembroSchema = z.object({
	membro_id: z.string().uuid("ID do membro inválido"),
});

// ========================================
// SCHEMAS DE PERFIL DO MEMBRO
// ========================================

/**
 * Schema para atualizar perfil próprio
 */
export const atualizarPerfilSchema = z.object({
	nome: z
		.string()
		.min(2, "Nome deve ter pelo menos 2 caracteres")
		.max(50, "Nome deve ter no máximo 50 caracteres")
		.optional(),
	sobrenome: z
		.string()
		.min(2, "Sobrenome deve ter pelo menos 2 caracteres")
		.max(50, "Sobrenome deve ter no máximo 50 caracteres")
		.optional(),
	telefone: z
		.string()
		.regex(VALIDATION_PATTERNS.PHONE, VALIDATION_MESSAGES.PHONE_LENGTH)
		.optional(),
	avatar_url: z.string().url("URL do avatar inválida").optional().or(z.literal("")),
});

/**
 * Schema para alterar senha
 */
export const alterarSenhaSchema = z
	.object({
		senha_atual: z.string().min(1, "Senha atual é obrigatória"),
		nova_senha: z
			.string()
			.min(8, "Nova senha deve ter pelo menos 8 caracteres")
			.regex(/[a-zA-Z]/, "Nova senha deve conter pelo menos uma letra")
			.regex(/\d/, "Nova senha deve conter pelo menos um número")
			.regex(/[!@#$%^&*(),.?":{}|<>]/, "Nova senha deve conter pelo menos um caractere especial"),
		confirmar_senha: z.string().min(1, "Confirmação de senha é obrigatória"),
	})
	.refine((data) => data.nova_senha === data.confirmar_senha, {
		message: "As senhas não coincidem",
		path: ["confirmar_senha"],
	})
	.refine((data) => data.senha_atual !== data.nova_senha, {
		message: "Nova senha deve ser diferente da senha atual",
		path: ["nova_senha"],
	});

// ========================================
// SCHEMAS DE FILTROS
// ========================================

/**
 * Schema para filtros de membros da equipe
 */
export const filtrosEquipeSchema = z.object({
	cargo: cargoEstabelecimentoSchema.nullable().optional(),
	ativo: z.boolean().nullable().optional(),
	busca: z.string().max(100, "Busca deve ter no máximo 100 caracteres").optional(),
});

// ========================================
// TIPOS INFERIDOS DOS SCHEMAS
// ========================================

export type Cargo = z.infer<typeof cargoSchema>;
export type CargoEstabelecimento = z.infer<typeof cargoEstabelecimentoSchema>;
export type CargoGerente = z.infer<typeof cargoGerenteSchema>;
export type GerarCodigoConviteFormData = z.infer<typeof gerarCodigoConviteSchema>;
export type ValidarCodigoConviteFormData = z.infer<typeof validarCodigoConviteSchema>;
export type RevogarCodigoConviteFormData = z.infer<typeof revogarCodigoConviteSchema>;
export type AtualizarMembroFormData = z.infer<typeof atualizarMembroSchema>;
export type RemoverMembroFormData = z.infer<typeof removerMembroSchema>;
export type DeletarMembroFormData = z.infer<typeof deletarMembroSchema>;
export type AtualizarPerfilFormData = z.infer<typeof atualizarPerfilSchema>;
export type AlterarSenhaFormData = z.infer<typeof alterarSenhaSchema>;
export type FiltrosEquipeFormData = z.infer<typeof filtrosEquipeSchema>;
