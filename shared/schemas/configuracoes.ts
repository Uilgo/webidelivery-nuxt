/**
 * 📌 Schemas de Validação - Configurações
 *
 * Schemas Zod para validação de formulários de configurações.
 * Compatível com vee-validate via toTypedSchema.
 */

import { z } from "zod";

/**
 * Schema: Dados da Empresa
 */
export const dadosEmpresaSchema = z.object({
	nome: z
		.string()
		.min(3, "Nome deve ter no mínimo 3 caracteres")
		.max(100, "Nome deve ter no máximo 100 caracteres"),
	slug: z
		.string()
		.min(3, "Slug deve ter no mínimo 3 caracteres")
		.max(50, "Slug deve ter no máximo 50 caracteres")
		.regex(/^[a-z0-9-]+$/, "Slug deve conter apenas letras minúsculas, números e hífens"),
	descricao: z.string().max(500, "Descrição deve ter no máximo 500 caracteres").optional(),
	logo_url: z.string().url("URL inválida").optional().or(z.literal("")),
	logo_url_dark: z.string().url("URL inválida").optional().or(z.literal("")),
	whatsapp: z.string().optional(),
});

/**
 * Schema: Métodos de Pagamento
 */
export const pagamentosSchema = z
	.object({
		aceita_dinheiro: z.boolean(),
		aceita_pix: z.boolean(),
		tipo_chave_pix: z.enum(["cpf", "cnpj", "email", "telefone", "aleatoria"]).optional(),
		chave_pix: z.string().optional(),
		aceita_cartao_credito: z.boolean(),
		aceita_cartao_debito: z.boolean(),
	})
	.refine(
		(data) => {
			// Pelo menos um método de pagamento deve estar ativo
			return (
				data.aceita_dinheiro ||
				data.aceita_pix ||
				data.aceita_cartao_credito ||
				data.aceita_cartao_debito
			);
		},
		{
			message: "Selecione pelo menos um método de pagamento",
			path: ["aceita_dinheiro"],
		},
	)
	.refine(
		(data) => {
			// Se PIX está ativo, tipo de chave é obrigatório
			if (data.aceita_pix && !data.tipo_chave_pix) {
				return false;
			}
			return true;
		},
		{
			message: "Selecione o tipo de chave PIX",
			path: ["tipo_chave_pix"],
		},
	)
	.refine(
		(data) => {
			// Se PIX está ativo, chave PIX é obrigatória
			if (data.aceita_pix && !data.chave_pix) {
				return false;
			}
			return true;
		},
		{
			message: "Chave PIX é obrigatória quando PIX está ativo",
			path: ["chave_pix"],
		},
	)
	.refine(
		(data) => {
			// Validar formato da chave PIX baseado no tipo
			if (data.aceita_pix && data.tipo_chave_pix && data.chave_pix) {
				const chave = data.chave_pix.replace(/\D/g, ""); // Remove não-dígitos para CPF/CNPJ/Telefone

				switch (data.tipo_chave_pix) {
					case "cpf":
						return chave.length === 11;
					case "cnpj":
						return chave.length === 14;
					case "email":
						return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.chave_pix);
					case "telefone":
						return chave.length >= 10 && chave.length <= 11;
					case "aleatoria":
						return data.chave_pix.length >= 32; // Chaves aleatórias têm 32+ caracteres
					default:
						return true;
				}
			}
			return true;
		},
		{
			message: "Formato de chave PIX inválido para o tipo selecionado",
			path: ["chave_pix"],
		},
	);

/**
 * Schema: Frete e Entrega
 */
export const freteEntregaSchema = z.object({
	taxa_entrega: z.number().min(0, "Taxa de entrega não pode ser negativa"),
	tipo_taxa_entrega: z.enum(["sem_taxa", "taxa_unica", "taxa_distancia", "taxa_localizacao"]),
	taxas_por_distancia: z
		.array(
			z.object({
				id: z.string(),
				distancia_km: z.number().min(0, "Distância não pode ser negativa"),
				taxa_valor: z.number().min(0, "Taxa não pode ser negativa"),
				tempo_min: z.number().min(0, "Tempo mínimo não pode ser negativo"),
				tempo_max: z.number().min(0, "Tempo máximo não pode ser negativo"),
				status: z.enum(["ativado", "desativado"]),
			}),
		)
		.optional(),
	taxas_por_localizacao: z
		.array(
			z.object({
				id: z.string(),
				nome: z.string().min(1, "Nome da localização é obrigatório"),
				taxa_valor: z.number().min(0, "Taxa não pode ser negativa"),
				tempo_min: z.number().min(0, "Tempo mínimo não pode ser negativo"),
				tempo_max: z.number().min(0, "Tempo máximo não pode ser negativo"),
				status: z.enum(["ativado", "desativado"]),
			}),
		)
		.optional(),
	tempo_preparo_min: z
		.number()
		.min(10, "Tempo mínimo deve ser pelo menos 10 minutos")
		.max(180, "Tempo mínimo não pode exceder 180 minutos"),
	tempo_preparo_max: z
		.number()
		.min(10, "Tempo máximo deve ser pelo menos 10 minutos")
		.max(180, "Tempo máximo não pode exceder 180 minutos"),
	valor_minimo_pedido: z.number().min(0, "Valor mínimo não pode ser negativo"),
	raio_entrega_km: z
		.number()
		.min(0, "Raio de entrega não pode ser negativo")
		.max(50, "Raio de entrega não pode exceder 50km"),
});

/**
 * Schema: Personalização (Tema)
 */
export const personalizacaoSchema = z.object({
	cor_primaria: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Cor primária inválida"),
	cor_secundaria: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Cor secundária inválida"),
	cor_fundo: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Cor de fundo inválida"),
	cor_texto: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Cor de texto inválida"),
	fonte_principal: z.string().min(1, "Fonte principal é obrigatória"),
	estilo_botoes: z.enum(["rounded", "square"]),
	layout_cardapio: z.enum(["grid", "list"]),
});
