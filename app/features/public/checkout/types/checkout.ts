/**
 * 📌 Tipos do Checkout
 *
 * Define todas as interfaces e tipos relacionados ao fluxo de checkout.
 */

/**
 * Tipo de entrega do pedido
 */
export type TipoEntrega = "delivery" | "retirada";

/**
 * Forma de pagamento do pedido
 */
export type FormaPagamento = "dinheiro" | "pix" | "credito" | "debito";

/**
 * Dados do cliente
 */
export interface DadosCliente {
	nome: string;
	telefone: string;
	email?: string;
	cpf?: string;
}

/**
 * Endereço de entrega
 */
export interface EnderecoEntrega {
	cep: string;
	rua: string;
	numero: string;
	complemento?: string;
	bairro: string;
	cidade: string;
	estado: string;
	referencia?: string;
}

/**
 * Dados de pagamento
 */
export interface DadosPagamento {
	forma_pagamento: FormaPagamento;
	troco_para?: number;
}

/**
 * Dados completos do checkout
 */
export interface CheckoutData {
	// Etapa 1: Dados do cliente
	cliente: DadosCliente;

	// Etapa 2: Tipo de entrega
	tipo_entrega: TipoEntrega;
	endereco?: EnderecoEntrega;

	// Etapa 3: Forma de pagamento
	pagamento: DadosPagamento;

	// Etapa 4: Observações
	observacoes?: string;
}

/**
 * Etapas do checkout
 */
export type EtapaCheckout = 1 | 2 | 3 | 4;

/**
 * Estado do checkout
 */
export interface CheckoutState {
	etapa_atual: EtapaCheckout;
	dados: Partial<CheckoutData>;
	loading: boolean;
	erro?: string;
}
