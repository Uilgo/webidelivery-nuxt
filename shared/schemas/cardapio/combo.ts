/**
 * 📌 Schemas de Validação - Combos
 *
 * Schemas Zod para validação de formulários de combos do cardápio.
 */

import { z } from "zod";

// ========================================
// VALIDAÇÕES CUSTOMIZADAS
// ========================================

/**
 * Validação de nome de combo
 */
const nomeComboSchema = z
	.string()
	.min(1, "Nome é obrigatório")
	.min(3, "Nome deve ter pelo menos 3 caracteres")
	.max(100, "Nome deve ter no máximo 100 caracteres")
	.transform((nome) => nome.trim());

/**
 * Validação de descrição de combo
 */
const descricaoComboSchema = z
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

/**
 * Validação de preço
 */
const precoSchema = z
	.number()
	.min(0, "Preço não pode ser negativo")
	.max(999999.99, "Preço muito alto")
	.multipleOf(0.01, "Preço deve ter no máximo 2 casas decimais");

/**
 * Schema para item fixo do combo
 */
const itemFixoSchema = z.object({
	produto_id: z.string().uuid("Produto inválido"),
	variacao_id: z.string().uuid("Variação inválida").nullable().optional(),
	quantidade: z.number().int().min(1, "Quantidade deve ser pelo menos 1"),
});

/**
 * Schema para opção de escolha do combo
 */
const opcaoEscolhaSchema = z.object({
	produto_id: z.string().uuid("Produto inválido"),
	variacao_id: z.string().uuid("Variação inválida").nullable().optional(),
});

/**
 * Schema para grupo de escolha do combo
 */
const grupoEscolhaSchema = z.object({
	nome: z
		.string()
		.min(1, "Nome do grupo é obrigatório")
		.max(100, "Nome deve ter no máximo 100 caracteres"),
	min_selecao: z.number().int().min(1, "Mínimo deve ser pelo menos 1"),
	max_selecao: z.number().int().min(1, "Máximo deve ser pelo menos 1"),
	opcoes: z.array(opcaoEscolhaSchema).min(1, "Grupo deve ter pelo menos uma opção"),
});

// ========================================
// SCHEMAS PRINCIPAIS
// ========================================

/**
 * Schema para criação de combo
 */
export const createComboSchema = z
	.object({
		nome: nomeComboSchema,
		descricao: descricaoComboSchema,
		imagem_url: imagemUrlSchema,
		preco_combo: precoSchema,
		itens_fixos: z.array(itemFixoSchema).optional().default([]),
		grupos_escolha: z.array(grupoEscolhaSchema).optional().default([]),
		ativo: z.boolean().default(true),
		destaque: z.boolean().default(false),
		validade_inicio: z.string().datetime().nullable().optional(),
		validade_fim: z.string().datetime().nullable().optional(),
	})
	.refine(
		(data) => {
			// Combo deve ter pelo menos itens fixos OU grupos de escolha
			return (
				(data.itens_fixos && data.itens_fixos.length > 0) ||
				(data.grupos_escolha && data.grupos_escolha.length > 0)
			);
		},
		{
			message: "Combo deve ter pelo menos itens fixos ou grupos de escolha",
			path: ["itens_fixos"],
		},
	)
	.refine(
		(data) => {
			// Se tiver validade, data fim deve ser maior que início
			if (data.validade_inicio && data.validade_fim) {
				return new Date(data.validade_fim) > new Date(data.validade_inicio);
			}
			return true;
		},
		{
			message: "Data de fim deve ser posterior à data de início",
			path: ["validade_fim"],
		},
	)
	.refine(
		(data) => {
			// Validar min/max de cada grupo de escolha
			if (data.grupos_escolha) {
				return data.grupos_escolha.every((grupo) => grupo.max_selecao >= grupo.min_selecao);
			}
			return true;
		},
		{
			message: "Máximo deve ser maior ou igual ao mínimo em todos os grupos",
			path: ["grupos_escolha"],
		},
	);

/**
 * Schema para edição de combo
 */
export const updateComboSchema = z
	.object({
		nome: nomeComboSchema.optional(),
		descricao: descricaoComboSchema,
		imagem_url: imagemUrlSchema,
		preco_combo: precoSchema.optional(),
		ativo: z.boolean().optional(),
		destaque: z.boolean().optional(),
		validade_inicio: z.string().datetime().nullable().optional(),
		validade_fim: z.string().datetime().nullable().optional(),
		ordem: z.number().int().min(0).optional(),
	})
	.refine(
		(data) => {
			// Se tiver validade, data fim deve ser maior que início
			if (data.validade_inicio && data.validade_fim) {
				return new Date(data.validade_fim) > new Date(data.validade_inicio);
			}
			return true;
		},
		{
			message: "Data de fim deve ser posterior à data de início",
			path: ["validade_fim"],
		},
	);

// ========================================
// TIPOS INFERIDOS DOS SCHEMAS
// ========================================

export type CreateComboFormData = z.infer<typeof createComboSchema>;
export type UpdateComboFormData = z.infer<typeof updateComboSchema>;
export type ItemFixoFormData = z.infer<typeof itemFixoSchema>;
export type OpcaoEscolhaFormData = z.infer<typeof opcaoEscolhaSchema>;
export type GrupoEscolhaFormData = z.infer<typeof grupoEscolhaSchema>;
