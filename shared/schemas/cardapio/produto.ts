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
		grupos_adicionais_ids: z.array(z.string().uuid()).optional(),
		ativo: z.boolean(),
		destaque: z.boolean(),
		em_promocao: z.boolean(),
		promocao_tipo: z.enum(["percentual", "valor_fixo"]).nullable().optional(),
		promocao_valor: z.number().min(0).nullable().optional(),
		promocao_inicio: z.string().nullable().optional(),
		promocao_fim: z.string().nullable().optional(),
		permite_divisao_sabores_override: z.boolean().nullable().optional(),
		max_sabores_divisao_override: z.number().int().min(2).max(4).nullable().optional(),
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
			message: "Produto em promoção deve ter tipo e valor de desconto definidos",
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
	)
	.refine(
		(data) => {
			// Se permite divisão (override), max_sabores deve estar entre 2-4
			if (data.permite_divisao_sabores_override === true) {
				return (
					data.max_sabores_divisao_override !== undefined &&
					data.max_sabores_divisao_override !== null &&
					data.max_sabores_divisao_override >= 2 &&
					data.max_sabores_divisao_override <= 4
				);
			}
			return true;
		},
		{
			message: "Quantidade de sabores deve ser 2, 3 ou 4",
			path: ["max_sabores_divisao_override"],
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
		promocao_tipo: z.enum(["percentual", "valor_fixo"]).nullable().optional(),
		promocao_valor: z.number().min(0).nullable().optional(),
		promocao_inicio: z.string().nullable().optional(),
		promocao_fim: z.string().nullable().optional(),
		ordem: z.number().int().min(0).optional(),
		permite_divisao_sabores_override: z.boolean().nullable().optional(),
		max_sabores_divisao_override: z.number().int().min(2).max(4).nullable().optional(),
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
			message: "Produto em promoção deve ter tipo e valor de desconto definidos",
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
	)
	.refine(
		(data) => {
			// Se permite divisão (override), max_sabores deve estar entre 2-4
			if (data.permite_divisao_sabores_override === true) {
				return (
					data.max_sabores_divisao_override !== undefined &&
					data.max_sabores_divisao_override !== null &&
					data.max_sabores_divisao_override >= 2 &&
					data.max_sabores_divisao_override <= 4
				);
			}
			return true;
		},
		{
			message: "Quantidade de sabores deve ser 2, 3 ou 4",
			path: ["max_sabores_divisao_override"],
		},
	);

// ========================================
// TIPOS INFERIDOS DOS SCHEMAS
// ========================================

export type CreateProdutoFormData = z.infer<typeof createProdutoSchema>;
export type UpdateProdutoFormData = z.infer<typeof updateProdutoSchema>;
