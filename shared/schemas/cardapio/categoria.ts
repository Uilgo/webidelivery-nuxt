/**
 * 📌 Schemas de Validação - Categorias
 *
 * Schemas Zod para validação de formulários de categorias do cardápio.
 */

import { z } from "zod";

// ========================================
// VALIDAÇÕES CUSTOMIZADAS
// ========================================

/**
 * Validação de nome de categoria
 */
const nomeCategoriaSchema = z
	.string()
	.min(1, "Nome é obrigatório")
	.min(3, "Nome deve ter pelo menos 3 caracteres")
	.max(100, "Nome deve ter no máximo 100 caracteres")
	.transform((nome) => nome.trim());

/**
 * Validação de descrição de categoria
 */
const descricaoCategoriaSchema = z
	.string()
	.max(500, "Descrição deve ter no máximo 500 caracteres")
	.optional()
	.transform((desc) => (desc ? desc.trim() : undefined));

/**
 * Validação de URL de imagem
 */
const imagemUrlSchema = z
	.string()
	.url("URL de imagem inválida")
	.optional()
	.or(z.literal(""))
	.transform((url) => (url && url.trim() !== "" ? url.trim() : undefined));

// ========================================
// SCHEMAS PRINCIPAIS
// ========================================

/**
 * Schema para criação de categoria
 */
export const createCategoriaSchema = z.object({
	nome: nomeCategoriaSchema,
	descricao: descricaoCategoriaSchema,
	imagem_url: imagemUrlSchema,
	ativo: z.boolean().default(true),
	ordem: z.number().int().min(0).optional(),
	categoria_pai_id: z.string().uuid().optional().nullable(),
});

/**
 * Schema para edição de categoria
 */
export const updateCategoriaSchema = z.object({
	nome: nomeCategoriaSchema.optional(),
	descricao: descricaoCategoriaSchema,
	imagem_url: imagemUrlSchema,
	ativo: z.boolean().optional(),
	ordem: z.number().int().min(0).optional(),
});

// ========================================
// TIPOS INFERIDOS DOS SCHEMAS
// ========================================

export type CreateCategoriaFormData = z.infer<typeof createCategoriaSchema>;
export type UpdateCategoriaFormData = z.infer<typeof updateCategoriaSchema>;
