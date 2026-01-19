/**
 * 📌 Schemas de Validação - Pedidos
 *
 * Schemas Zod para validação de operações com pedidos.
 */

import { z } from "zod";
import { VALIDATION_PATTERNS, VALIDATION_MESSAGES } from "../constants/validation";

// ========================================
// SCHEMAS DE ENUMS
// ========================================

/**
 * Schema para status do pedido
 */
export const statusPedidoSchema = z.enum(
	["pendente", "aceito", "preparo", "pronto", "entrega", "concluido", "cancelado"],
	{
		message: "Status de pedido inválido",
	},
);

/**
 * Schema para tipo de entrega
 */
export const tipoEntregaPedidoSchema = z.enum(["delivery", "retirada"], {
	message: "Tipo de entrega inválido",
});

/**
 * Schema para forma de pagamento
 */
export const formaPagamentoPedidoSchema = z.enum(["dinheiro", "pix", "credito", "debito"], {
	message: "Forma de pagamento inválida",
});

/**
 * Schema para motivo de cancelamento do cliente
 */
export const motivoCancelamentoClienteSchema = z.enum(
	["mudei_ideia", "pedido_errado", "demora", "preco", "outro"],
	{
		message: "Motivo de cancelamento inválido",
	},
);

// ========================================
// SCHEMAS DE ATUALIZAÇÃO DE STATUS
// ========================================

/**
 * Schema para atualizar status do pedido
 */
export const atualizarStatusSchema = z.object({
	pedido_id: z.string().uuid("ID do pedido inválido"),
	novo_status: statusPedidoSchema,
	observacao: z
		.string()
		.max(500, "Observação deve ter no máximo 500 caracteres")
		.optional()
		.or(z.literal("")),
});

// ========================================
// SCHEMAS DE CANCELAMENTO
// ========================================

/**
 * Schema para cancelamento pelo admin/estabelecimento
 */
export const cancelarPedidoAdminSchema = z.object({
	pedido_id: z.string().uuid("ID do pedido inválido"),
	motivo: z
		.string()
		.min(1, "Motivo é obrigatório")
		.max(500, "Motivo deve ter no máximo 500 caracteres")
		.transform((motivo) => motivo.trim()),
});

/**
 * Schema para cancelamento pelo cliente
 */
export const cancelarPedidoClienteSchema = z.object({
	pedido_id: z.string().uuid("ID do pedido inválido"),
	motivo: motivoCancelamentoClienteSchema.optional(),
});

// ========================================
// SCHEMAS DE AVALIAÇÃO
// ========================================

/**
 * Schema para avaliação do pedido
 */
export const avaliarPedidoSchema = z.object({
	pedido_id: z.string().uuid("ID do pedido inválido"),
	nota: z
		.number()
		.int("Nota deve ser um número inteiro")
		.min(1, "Nota mínima é 1")
		.max(5, "Nota máxima é 5"),
	comentario: z
		.string()
		.max(500, "Comentário deve ter no máximo 500 caracteres")
		.optional()
		.or(z.literal("")),
});

// ========================================
// SCHEMAS DE FILTROS
// ========================================

/**
 * Schema para filtros de pedidos
 */
export const filtrosPedidosSchema = z.object({
	status: statusPedidoSchema.nullable().optional(),
	data_inicio: z.date().nullable().optional(),
	data_fim: z.date().nullable().optional(),
	tipo_entrega: tipoEntregaPedidoSchema.nullable().optional(),
	forma_pagamento: formaPagamentoPedidoSchema.nullable().optional(),
	busca: z.string().max(100, "Busca deve ter no máximo 100 caracteres").optional(),
});

// ========================================
// SCHEMAS DE CRIAÇÃO DE PEDIDO
// ========================================

/**
 * Schema para item do pedido
 */
export const pedidoItemSchema = z.object({
	produto_id: z.string().uuid("ID do produto inválido"),
	variacao_id: z.string().uuid("ID da variação inválido").nullable().optional(),
	produto_nome: z.string().min(1, "Nome do produto é obrigatório"),
	variacao_nome: z.string().nullable().optional(),
	quantidade: z.number().int("Quantidade deve ser inteira").min(1, "Quantidade mínima é 1"),
	preco_unitario: z.number().nonnegative("Preço deve ser não negativo"),
	observacoes: z.string().max(200, "Observações devem ter no máximo 200 caracteres").optional(),
	adicionais: z
		.array(
			z.object({
				adicional_id: z.string().uuid("ID do adicional inválido"),
				adicional_nome: z.string().min(1, "Nome do adicional é obrigatório"),
				quantidade: z.number().int("Quantidade deve ser inteira").min(1, "Quantidade mínima é 1"),
				preco_unitario: z.number().nonnegative("Preço deve ser não negativo"),
			}),
		)
		.optional()
		.default([]),
});

/**
 * Schema para criar pedido
 */
export const criarPedidoSchema = z.object({
	estabelecimento_id: z.string().uuid("ID do estabelecimento inválido"),
	tipo_entrega: tipoEntregaPedidoSchema,
	cliente_nome: z.string().min(1, "Nome do cliente é obrigatório"),
	cliente_telefone: z.string().regex(VALIDATION_PATTERNS.PHONE, VALIDATION_MESSAGES.PHONE_INVALID),
	cliente_email: z.string().email("E-mail inválido").optional().or(z.literal("")),
	endereco: z
		.object({
			rua: z.string().min(1, "Rua é obrigatória"),
			numero: z.string().min(1, "Número é obrigatório"),
			complemento: z.string().optional(),
			bairro: z.string().min(1, "Bairro é obrigatório"),
			cidade: z.string().min(1, "Cidade é obrigatória"),
			estado: z.string().length(2, "Estado deve ter 2 caracteres"),
			cep: z
				.string()
				.regex(/^\d{8}$/, "CEP inválido")
				.optional(),
			referencia: z.string().optional(),
		})
		.optional(),
	forma_pagamento: formaPagamentoPedidoSchema,
	troco_para: z.number().positive("Valor do troco deve ser positivo").optional(),
	observacoes: z.string().max(500, "Observações devem ter no máximo 500 caracteres").optional(),
	itens: z.array(pedidoItemSchema).min(1, "Pedido deve ter pelo menos 1 item"),
});

// ========================================
// TIPOS INFERIDOS DOS SCHEMAS
// ========================================

export type StatusPedido = z.infer<typeof statusPedidoSchema>;
export type TipoEntregaPedido = z.infer<typeof tipoEntregaPedidoSchema>;
export type FormaPagamentoPedido = z.infer<typeof formaPagamentoPedidoSchema>;
export type MotivoCancelamentoCliente = z.infer<typeof motivoCancelamentoClienteSchema>;
export type AtualizarStatusFormData = z.infer<typeof atualizarStatusSchema>;
export type CancelarPedidoAdminFormData = z.infer<typeof cancelarPedidoAdminSchema>;
export type CancelarPedidoClienteFormData = z.infer<typeof cancelarPedidoClienteSchema>;
export type AvaliarPedidoFormData = z.infer<typeof avaliarPedidoSchema>;
export type FiltrosPedidosFormData = z.infer<typeof filtrosPedidosSchema>;
export type PedidoItemFormData = z.infer<typeof pedidoItemSchema>;
export type CriarPedidoFormData = z.infer<typeof criarPedidoSchema>;
