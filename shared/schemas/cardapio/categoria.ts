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
export const createCategoriaSchema = z
	.object({
		nome: nomeCategoriaSchema,
		descricao: descricaoCategoriaSchema,
		imagem_url: imagemUrlSchema,
		ativo: z.boolean(),
		ordem: z.number().int().min(0).optional(),
		categoria_pai_id: z.string().uuid().optional().nullable(),
		em_promocao: z.boolean().optional(),
		promocao_tipo: z.enum(["percentual", "valor_fixo"]).nullable().optional(),
		promocao_valor: z.number().min(0).nullable().optional(),
		promocao_inicio: z.string().nullable().optional(),
		promocao_fim: z.string().nullable().optional(),
	})
	.refine(
		(data) => {
			// Se em promoção, campos de promoção são obrigatórios
			if (data.em_promocao) {
				return (
					data.promocao_tipo !== null &&
					data.promocao_tipo !== undefined &&
					data.promocao_valor !== null &&
					data.promocao_valor !== undefined &&
					data.promocao_valor > 0
				);
			}
			return true;
		},
		{
			message: "Categoria em promoção deve ter tipo e valor de desconto definidos",
			path: ["em_promocao"],
		},
	)
	.refine(
		(data) => {
			// Se tipo percentual, valor deve ser entre 0 e 100
			if (data.em_promocao && data.promocao_tipo === "percentual" && data.promocao_valor) {
				return data.promocao_valor > 0 && data.promocao_valor <= 100;
			}
			return true;
		},
		{
			message: "Desconto percentual deve ser entre 0% e 100%",
			path: ["promocao_valor"],
		},
	)
	.refine(
		(data) => {
			// Se tem data de fim, deve ter data de início
			if (data.promocao_fim && !data.promocao_inicio) {
				return false;
			}
			return true;
		},
		{
			message: "Data de início é obrigatória quando há data de término",
			path: ["promocao_inicio"],
		},
	)
	.refine(
		(data) => {
			// Data de fim deve ser posterior à data de início
			if (data.promocao_inicio && data.promocao_fim) {
				return new Date(data.promocao_fim) > new Date(data.promocao_inicio);
			}
			return true;
		},
		{
			message: "Data de término deve ser posterior à data de início",
			path: ["promocao_fim"],
		},
	);

/**
 * Schema para edição de categoria
 */
export const updateCategoriaSchema = z
	.object({
		nome: nomeCategoriaSchema.optional(),
		descricao: descricaoCategoriaSchema,
		imagem_url: imagemUrlSchema,
		ativo: z.boolean().optional(),
		ordem: z.number().int().min(0).optional(),
		em_promocao: z.boolean().optional(),
		promocao_tipo: z.enum(["percentual", "valor_fixo"]).nullable().optional(),
		promocao_valor: z.number().min(0).nullable().optional(),
		promocao_inicio: z.string().nullable().optional(),
		promocao_fim: z.string().nullable().optional(),
	})
	.refine(
		(data) => {
			// Se em promoção, campos de promoção são obrigatórios
			if (data.em_promocao) {
				return (
					data.promocao_tipo !== null &&
					data.promocao_tipo !== undefined &&
					data.promocao_valor !== null &&
					data.promocao_valor !== undefined &&
					data.promocao_valor > 0
				);
			}
			return true;
		},
		{
			message: "Categoria em promoção deve ter tipo e valor de desconto definidos",
			path: ["em_promocao"],
		},
	)
	.refine(
		(data) => {
			// Se tipo percentual, valor deve ser entre 0 e 100
			if (data.em_promocao && data.promocao_tipo === "percentual" && data.promocao_valor) {
				return data.promocao_valor > 0 && data.promocao_valor <= 100;
			}
			return true;
		},
		{
			message: "Desconto percentual deve ser entre 0% e 100%",
			path: ["promocao_valor"],
		},
	)
	.refine(
		(data) => {
			// Se tem data de fim, deve ter data de início
			if (data.promocao_fim && !data.promocao_inicio) {
				return false;
			}
			return true;
		},
		{
			message: "Data de início é obrigatória quando há data de término",
			path: ["promocao_inicio"],
		},
	)
	.refine(
		(data) => {
			// Data de fim deve ser posterior à data de início
			if (data.promocao_inicio && data.promocao_fim) {
				return new Date(data.promocao_fim) > new Date(data.promocao_inicio);
			}
			return true;
		},
		{
			message: "Data de término deve ser posterior à data de início",
			path: ["promocao_fim"],
		},
	);

// ========================================
// TIPOS INFERIDOS DOS SCHEMAS
// ========================================

export type CreateCategoriaFormData = z.infer<typeof createCategoriaSchema>;
export type UpdateCategoriaFormData = z.infer<typeof updateCategoriaSchema>;
