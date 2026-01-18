/**
 * 📌 Schemas de Validação - Produtos
 *
 * Schemas Zod para validação de formulários de produtos do cardápio.
 */

import { z } from "zod";
import { createVariacaoSchema } from "./variacao";

// ========================================
// VALIDAÇÕES CUSTOMIZADAS
// ========================================

/**
 * Validação de nome de produto
 */
const nomeProdutoSchema = z
	.string()
	.min(1, "Nome é obrigatório")
	.min(3, "Nome deve ter pelo menos 3 caracteres")
	.max(100, "Nome deve ter no máximo 100 caracteres")
	.transform((nome) => nome.trim());

/**
 * Validação de descrição de produto
 */
const descricaoProdutoSchema = z
	.string()
	.max(1000, "Descrição deve ter no máximo 1000 caracteres")
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
 * Schema para criação de produto
 */
export const createProdutoSchema = z
	.object({
		nome: nomeProdutoSchema,
		descricao: descricaoProdutoSchema,
		imagem_url: imagemUrlSchema,
		categoria_id: z.string().uuid("Categoria inválida"),
		variacoes: z
			.array(createVariacaoSchema)
			.min(1, "Produto deve ter pelo menos uma variação")
			.max(10, "Produto pode ter no máximo 10 variações"),
		grupos_adicionais_ids: z.array(z.string().uuid()).optional().default([]),
		ativo: z.boolean().default(true),
		destaque: z.boolean().default(false),
		em_promocao: z.boolean().default(false),
	})
	.refine(
		(data) => {
			// Se em promoção, pelo menos uma variação deve ter preço promocional
			if (data.em_promocao) {
				return data.variacoes.some(
					(v) => v.preco_promocional !== null && v.preco_promocional !== undefined,
				);
			}
			return true;
		},
		{
			message: "Produto em promoção deve ter pelo menos uma variação com preço promocional",
			path: ["em_promocao"],
		},
	);

/**
 * Schema para edição de produto
 */
export const updateProdutoSchema = z
	.object({
		nome: nomeProdutoSchema.optional(),
		descricao: descricaoProdutoSchema,
		imagem_url: imagemUrlSchema,
		categoria_id: z.string().uuid("Categoria inválida").optional(),
		ativo: z.boolean().optional(),
		destaque: z.boolean().optional(),
		em_promocao: z.boolean().optional(),
		ordem: z.number().int().min(0).optional(),
	})
	.refine(
		(_data) => {
			// Validação de promoção será feita no backend considerando variações existentes
			return true;
		},
		{
			message: "Validação de promoção",
			path: ["em_promocao"],
		},
	);

// ========================================
// TIPOS INFERIDOS DOS SCHEMAS
// ========================================

export type CreateProdutoFormData = z.infer<typeof createProdutoSchema>;
export type UpdateProdutoFormData = z.infer<typeof updateProdutoSchema>;
