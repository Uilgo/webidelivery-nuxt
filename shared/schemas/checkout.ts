/**
 * 📌 Schemas de Validação - Checkout
 *
 * Schemas Zod para validação do fluxo de checkout.
 */

import { z } from "zod";
import { VALIDATION_PATTERNS, VALIDATION_MESSAGES } from "../constants/validation";

// ========================================
// SCHEMAS DE TIPOS BÁSICOS
// ========================================

/**
 * Schema para tipo de entrega
 */
export const tipoEntregaSchema = z.enum(["delivery", "retirada"], {
	message: "Tipo de entrega inválido",
});

/**
 * Schema para forma de pagamento
 */
export const formaPagamentoSchema = z.enum(["dinheiro", "pix", "credito", "debito"], {
	message: "Forma de pagamento inválida",
});

// ========================================
// SCHEMAS DE DADOS DO CLIENTE
// ========================================

/**
 * Schema para telefone brasileiro
 */
const telefoneSchema = z
	.string()
	.min(1, VALIDATION_MESSAGES.PHONE_REQUIRED)
	.transform((tel) => tel.replace(/\D/g, "")) // Remove formatação ANTES de validar
	.refine((tel) => VALIDATION_PATTERNS.PHONE.test(tel), {
		message: VALIDATION_MESSAGES.PHONE_LENGTH,
	});

/**
 * Schema para CPF (opcional - para nota fiscal)
 */
const cpfSchema = z
	.string()
	.transform((cpf) => cpf.replace(/\D/g, "")) // Remove formatação ANTES de validar
	.refine((cpf) => cpf === "" || VALIDATION_PATTERNS.CPF.test(cpf), {
		message: VALIDATION_MESSAGES.CPF_LENGTH,
	})
	.optional()
	.or(z.literal(""));

/**
 * Schema para dados do cliente
 */
export const dadosClienteSchema = z.object({
	nome: z
		.string()
		.min(1, "Nome é obrigatório")
		.min(2, "Nome deve ter pelo menos 2 caracteres")
		.max(100, "Nome deve ter no máximo 100 caracteres")
		.transform((nome) => nome.trim()),
	telefone: telefoneSchema,
	email: z.string().email("E-mail inválido").toLowerCase().optional().or(z.literal("")),
	cpf: cpfSchema,
});

// ========================================
// SCHEMAS DE ENDEREÇO
// ========================================

/**
 * Schema para CEP
 */
const cepSchema = z
	.string()
	.min(1, VALIDATION_MESSAGES.CEP_REQUIRED)
	.regex(VALIDATION_PATTERNS.CEP, VALIDATION_MESSAGES.CEP_INVALID)
	.transform((cep) => cep.replace(/\D/g, ""));

/**
 * Schema para estado (UF)
 */
const estadoSchema = z
	.string()
	.length(2, "Estado deve ter 2 caracteres")
	.regex(/^[A-Z]{2}$/, "Estado inválido")
	.toUpperCase();

/**
 * Schema para endereço de entrega
 */
export const enderecoEntregaSchema = z.object({
	cep: cepSchema,
	rua: z
		.string()
		.min(1, "Rua é obrigatória")
		.max(200, "Rua deve ter no máximo 200 caracteres")
		.transform((rua) => rua.trim()),
	numero: z
		.string()
		.min(1, "Número é obrigatório")
		.max(20, "Número deve ter no máximo 20 caracteres")
		.transform((numero) => numero.trim()),
	complemento: z
		.string()
		.max(100, "Complemento deve ter no máximo 100 caracteres")
		.optional()
		.or(z.literal("")),
	bairro: z
		.string()
		.min(1, "Bairro é obrigatório")
		.max(100, "Bairro deve ter no máximo 100 caracteres")
		.transform((bairro) => bairro.trim()),
	cidade: z
		.string()
		.min(1, "Cidade é obrigatória")
		.max(100, "Cidade deve ter no máximo 100 caracteres")
		.transform((cidade) => cidade.trim()),
	estado: estadoSchema,
	referencia: z
		.string()
		.max(200, "Referência deve ter no máximo 200 caracteres")
		.optional()
		.or(z.literal("")),
});

// ========================================
// SCHEMAS DE PAGAMENTO
// ========================================

/**
 * Schema para dados de pagamento
 */
export const dadosPagamentoSchema = z.object({
	forma_pagamento: formaPagamentoSchema,
	troco_para: z.number().positive("Valor do troco deve ser positivo").optional().or(z.literal(0)),
});

// ========================================
// SCHEMAS DE OBSERVAÇÕES
// ========================================

/**
 * Schema para observações do pedido
 */
export const observacoesSchema = z
	.string()
	.max(500, "Observações devem ter no máximo 500 caracteres")
	.optional()
	.or(z.literal(""));

// ========================================
// SCHEMA COMPLETO DO CHECKOUT
// ========================================

/**
 * Schema para dados completos do checkout
 */
export const checkoutDataSchema = z.object({
	cliente: dadosClienteSchema,
	tipo_entrega: tipoEntregaSchema,
	endereco: enderecoEntregaSchema.optional(),
	pagamento: dadosPagamentoSchema,
	observacoes: observacoesSchema,
});

// ========================================
// VALIDAÇÃO CONDICIONAL
// ========================================

/**
 * Schema com validação condicional (delivery requer endereço)
 */
export const checkoutDataComValidacaoSchema = checkoutDataSchema.refine(
	(data) => {
		if (data.tipo_entrega === "delivery") {
			return !!data.endereco;
		}
		return true;
	},
	{
		message: "Endereço é obrigatório para delivery",
		path: ["endereco"],
	},
);

// ========================================
// TIPOS INFERIDOS DOS SCHEMAS
// ========================================

export type DadosClienteFormData = z.infer<typeof dadosClienteSchema>;
export type EnderecoEntregaFormData = z.infer<typeof enderecoEntregaSchema>;
export type DadosPagamentoFormData = z.infer<typeof dadosPagamentoSchema>;
export type CheckoutDataFormData = z.infer<typeof checkoutDataSchema>;
export type TipoEntrega = z.infer<typeof tipoEntregaSchema>;
export type FormaPagamento = z.infer<typeof formaPagamentoSchema>;
