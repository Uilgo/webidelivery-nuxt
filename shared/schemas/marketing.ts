/**
 * 📌 Schemas de Validação - Marketing
 *
 * Schemas Zod para validação de formulários de marketing.
 * Compatível com vee-validate via toTypedSchema.
 */

import { z } from "zod";

/**
 * Schema: Cupom
 */
export const cupomSchema = z
	.object({
		codigo: z
			.string()
			.min(3, "Código deve ter no mínimo 3 caracteres")
			.max(20, "Código deve ter no máximo 20 caracteres")
			.regex(/^[A-Z0-9]+$/, "Código deve conter apenas letras maiúsculas e números"),
		tipo: z.enum(["percentual", "valor_fixo", "frete_gratis"]),
		valor_desconto: z.number().min(0, "Valor não pode ser negativo").optional(),
		valor_minimo: z.number().min(0, "Valor mínimo não pode ser negativo").optional(),
		limite_uso: z.number().min(1, "Limite deve ser pelo menos 1").optional(),
		data_expiracao: z.string().optional(),
		descricao: z.string().max(200, "Descrição deve ter no máximo 200 caracteres").optional(),
	})
	.refine(
		(data) => {
			// Para frete grátis, não precisa de valor_desconto
			if (data.tipo === "frete_gratis") {
				return true;
			}

			// Para outros tipos, valor_desconto é obrigatório
			if (!data.valor_desconto || data.valor_desconto <= 0) {
				return false;
			}

			// Validação específica para percentual
			if (data.tipo === "percentual") {
				return data.valor_desconto >= 1 && data.valor_desconto <= 100;
			}

			return true;
		},
		{
			message: "Valor do desconto é obrigatório",
			path: ["valor_desconto"],
		},
	)
	.refine(
		(data) => {
			if (data.tipo === "percentual" && data.valor_desconto) {
				return data.valor_desconto >= 1 && data.valor_desconto <= 100;
			}
			return true;
		},
		{
			message: "Percentual deve estar entre 1% e 100%",
			path: ["valor_desconto"],
		},
	);

/**
 * Schema: Banner
 */
export const bannerSchema = z.object({
	titulo: z
		.string()
		.min(3, "Título deve ter no mínimo 3 caracteres")
		.max(100, "Título deve ter no máximo 100 caracteres"),
	descricao: z.string().max(200, "Descrição deve ter no máximo 200 caracteres").optional(),
	tipo: z.enum(["carrossel", "destaque", "popup"]),
	tipo_conteudo: z.enum(["imagem", "texto", "misto"]),
	imagem_url: z.string().url("URL inválida").optional(),
	link_url: z.string().url("URL inválida").optional(),
	cor_fundo: z
		.string()
		.regex(/^#[0-9A-Fa-f]{6}$/, "Cor inválida")
		.optional(),
	cor_texto: z
		.string()
		.regex(/^#[0-9A-Fa-f]{6}$/, "Cor inválida")
		.optional(),
	texto_cta: z.string().max(50, "CTA deve ter no máximo 50 caracteres").optional(),
	texto_posicao: z.enum(["centro", "esquerda", "direita", "superior", "inferior"]).optional(),
	texto_cor_fundo: z
		.string()
		.regex(/^#[0-9A-Fa-f]{6}$/, "Cor inválida")
		.optional(),
});

/**
 * Schema: Promoção
 */
export const promocaoSchema = z
	.object({
		nome: z
			.string()
			.min(3, "Nome deve ter no mínimo 3 caracteres")
			.max(100, "Nome deve ter no máximo 100 caracteres"),
		descricao: z.string().max(200, "Descrição deve ter no máximo 200 caracteres").optional(),
		tipo: z.enum(["desconto_produto", "desconto_categoria", "combo_promocional", "leve_pague"]),
		desconto: z.number().min(0.01, "Desconto deve ser maior que zero"),
		data_inicio: z.string().min(1, "Data de início é obrigatória"),
		data_fim: z.string().optional(),
	})
	.refine(
		(data) => {
			if (data.data_fim) {
				return new Date(data.data_fim) > new Date(data.data_inicio);
			}
			return true;
		},
		{
			message: "Data fim deve ser posterior à data início",
			path: ["data_fim"],
		},
	);

/**
 * Schema: Filtros de Cupom
 */
export const cupomFiltersSchema = z.object({
	tipo: z.enum(["percentual", "valor_fixo", "frete_gratis"]).optional(),
	status: z.enum(["ativo", "inativo", "expirado", "esgotado"]).optional(),
	periodo: z
		.object({
			inicio: z.string().optional(),
			fim: z.string().optional(),
		})
		.optional(),
});

/**
 * Schema: Filtros de Banner
 */
export const bannerFiltersSchema = z.object({
	tipo: z.enum(["carrossel", "destaque", "popup"]).optional(),
	tipo_conteudo: z.enum(["imagem", "texto", "misto"]).optional(),
	status: z.enum(["ativo", "inativo"]).optional(),
});

/**
 * Schema: Filtros de Promoção
 */
export const promocaoFiltersSchema = z.object({
	tipo: z
		.enum(["desconto_produto", "desconto_categoria", "combo_promocional", "leve_pague"])
		.optional(),
	status: z.enum(["ativo", "inativo", "expirado"]).optional(),
	periodo: z
		.object({
			inicio: z.string().optional(),
			fim: z.string().optional(),
		})
		.optional(),
});
