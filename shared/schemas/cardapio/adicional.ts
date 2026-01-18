/**
 * 📌 Schemas de Validação - Adicionais
 *
 * Schemas Zod para validação de formulários de adicionais do cardápio.
 */

import { z } from "zod";

// ========================================
// VALIDAÇÕES CUSTOMIZADAS
// ========================================

/**
 * Validação de nome de adicional
 */
const nomeAdicionalSchema = z
	.string()
	.min(1, "Nome é obrigatório")
	.min(2, "Nome deve ter pelo menos 2 caracteres")
	.max(100, "Nome deve ter no máximo 100 caracteres")
	.transform((nome) => nome.trim());

/**
 * Validação de descrição de adicional
 */
const descricaoAdicionalSchema = z
	.string()
	.max(500, "Descrição deve ter no máximo 500 caracteres")
	.optional()
	.transform((desc) => (desc ? desc.trim() : undefined));

/**
 * Validação de preço
 */
const precoSchema = z
	.number()
	.min(0, "Preço não pode ser negativo")
	.max(999999.99, "Preço muito alto")
	.multipleOf(0.01, "Preço deve ter no máximo 2 casas decimais");

// ========================================
// SCHEMAS PRINCIPAIS
// ========================================

/**
 * Schema para criação de adicional
 */
export const createAdicionalSchema = z.object({
	nome: nomeAdicionalSchema,
	descricao: descricaoAdicionalSchema,
	preco: precoSchema,
	grupo_id: z.string().uuid("ID do grupo inválido"),
	ativo: z.boolean().default(true),
});

/**
 * Schema para edição de adicional
 */
export const updateAdicionalSchema = z.object({
	nome: nomeAdicionalSchema.optional(),
	descricao: descricaoAdicionalSchema,
	preco: precoSchema.optional(),
	ativo: z.boolean().optional(),
	ordem: z.number().int().min(0).optional(),
});

// ========================================
// TIPOS INFERIDOS DOS SCHEMAS
// ========================================

export type CreateAdicionalFormData = z.infer<typeof createAdicionalSchema>;
export type UpdateAdicionalFormData = z.infer<typeof updateAdicionalSchema>;
