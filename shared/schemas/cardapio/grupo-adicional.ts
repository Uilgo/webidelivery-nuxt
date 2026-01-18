/**
 * 📌 Schemas de Validação - Grupos de Adicionais
 *
 * Schemas Zod para validação de formulários de grupos de adicionais do cardápio.
 */

import { z } from "zod";

// ========================================
// VALIDAÇÕES CUSTOMIZADAS
// ========================================

/**
 * Validação de nome de grupo de adicionais
 */
const nomeGrupoSchema = z
	.string()
	.min(1, "Nome é obrigatório")
	.min(3, "Nome deve ter pelo menos 3 caracteres")
	.max(100, "Nome deve ter no máximo 100 caracteres")
	.transform((nome) => nome.trim());

/**
 * Validação de descrição de grupo
 */
const descricaoGrupoSchema = z
	.string()
	.max(500, "Descrição deve ter no máximo 500 caracteres")
	.optional()
	.transform((desc) => (desc ? desc.trim() : undefined));

/**
 * Validação de quantidade mínima de seleção
 */
const minSelecaoSchema = z
	.number()
	.int("Deve ser um número inteiro")
	.min(0, "Mínimo não pode ser negativo")
	.default(0);

/**
 * Validação de quantidade máxima de seleção
 */
const maxSelecaoSchema = z
	.number()
	.int("Deve ser um número inteiro")
	.min(1, "Máximo deve ser pelo menos 1")
	.nullable()
	.optional();

// ========================================
// SCHEMAS PRINCIPAIS
// ========================================

/**
 * Schema para criação de grupo de adicionais
 */
export const createGrupoAdicionalSchema = z
	.object({
		nome: nomeGrupoSchema,
		descricao: descricaoGrupoSchema,
		min_selecao: minSelecaoSchema,
		max_selecao: maxSelecaoSchema,
		obrigatorio: z.boolean().default(false),
		ativo: z.boolean().default(true),
	})
	.refine(
		(data) => {
			// Se max_selecao for definido, deve ser maior ou igual a min_selecao
			if (data.max_selecao !== null && data.max_selecao !== undefined) {
				return data.max_selecao >= data.min_selecao;
			}
			return true;
		},
		{
			message: "Máximo deve ser maior ou igual ao mínimo",
			path: ["max_selecao"],
		},
	)
	.refine(
		(data) => {
			// Se obrigatório, min_selecao deve ser maior que 0
			if (data.obrigatorio) {
				return data.min_selecao > 0;
			}
			return true;
		},
		{
			message: "Grupo obrigatório deve ter mínimo maior que 0",
			path: ["min_selecao"],
		},
	);

/**
 * Schema para edição de grupo de adicionais
 */
export const updateGrupoAdicionalSchema = z
	.object({
		nome: nomeGrupoSchema.optional(),
		descricao: descricaoGrupoSchema,
		min_selecao: minSelecaoSchema.optional(),
		max_selecao: maxSelecaoSchema,
		obrigatorio: z.boolean().optional(),
		ativo: z.boolean().optional(),
		ordem: z.number().int().min(0).optional(),
	})
	.refine(
		(data) => {
			// Se ambos forem definidos, max deve ser >= min
			if (
				data.max_selecao !== null &&
				data.max_selecao !== undefined &&
				data.min_selecao !== undefined
			) {
				return data.max_selecao >= data.min_selecao;
			}
			return true;
		},
		{
			message: "Máximo deve ser maior ou igual ao mínimo",
			path: ["max_selecao"],
		},
	);

// ========================================
// TIPOS INFERIDOS DOS SCHEMAS
// ========================================

export type CreateGrupoAdicionalFormData = z.infer<typeof createGrupoAdicionalSchema>;
export type UpdateGrupoAdicionalFormData = z.infer<typeof updateGrupoAdicionalSchema>;
