/**
 * 📌 Schemas de Validação - Variações de Produtos
 *
 * Schemas Zod para validação de variações (tamanhos/sabores) de produtos.
 */

import { z } from "zod";

// ========================================
// VALIDAÇÕES CUSTOMIZADAS
// ========================================

/**
 * Validação de nome de variação
 */
const nomeVariacaoSchema = z
	.string()
	.min(1, "Nome é obrigatório")
	.min(2, "Nome deve ter pelo menos 2 caracteres")
	.max(50, "Nome deve ter no máximo 50 caracteres")
	.transform((nome) => nome.trim());

/**
 * Validação de preço
 */
const precoSchema = z
	.number()
	.min(0, "Preço não pode ser negativo")
	.max(999999.99, "Preço muito alto")
	.multipleOf(0.01, "Preço deve ter no máximo 2 casas decimais");

/**
 * Validação de preço promocional
 */
const precoPromocionalSchema = z
	.number()
	.min(0, "Preço promocional não pode ser negativo")
	.max(999999.99, "Preço muito alto")
	.multipleOf(0.01, "Preço deve ter no máximo 2 casas decimais")
	.nullable()
	.optional();

// ========================================
// SCHEMAS PRINCIPAIS
// ========================================

/**
 * Schema para criação de variação
 */
export const createVariacaoSchema = z
	.object({
		nome: nomeVariacaoSchema,
		preco: precoSchema,
		preco_promocional: precoPromocionalSchema,
		ativo: z.boolean(),
	})
	.refine(
		(data) => {
			// Se preço promocional existir, deve ser menor que o preço normal
			if (data.preco_promocional !== null && data.preco_promocional !== undefined) {
				return data.preco_promocional < data.preco;
			}
			return true;
		},
		{
			message: "Preço promocional deve ser menor que o preço normal",
			path: ["preco_promocional"],
		},
	);

/**
 * Schema para edição de variação
 */
export const updateVariacaoSchema = z
	.object({
		nome: nomeVariacaoSchema.optional(),
		preco: precoSchema.optional(),
		preco_promocional: precoPromocionalSchema,
		ativo: z.boolean().optional(),
		ordem: z.number().int().min(0).optional(),
	})
	.refine(
		(data) => {
			// Se ambos forem definidos, promocional deve ser menor que normal
			if (
				data.preco !== undefined &&
				data.preco_promocional !== null &&
				data.preco_promocional !== undefined
			) {
				return data.preco_promocional < data.preco;
			}
			return true;
		},
		{
			message: "Preço promocional deve ser menor que o preço normal",
			path: ["preco_promocional"],
		},
	);

// ========================================
// TIPOS INFERIDOS DOS SCHEMAS
// ========================================

export type CreateVariacaoFormData = z.infer<typeof createVariacaoSchema>;
export type UpdateVariacaoFormData = z.infer<typeof updateVariacaoSchema>;
