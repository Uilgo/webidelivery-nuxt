/**
 * 📌 Tipos do Pedido
 *
 * Tipos para visualização e acompanhamento de pedidos.
 */

export type StatusPedido =
	| "pendente"
	| "aceito"
	| "preparo"
	| "pronto"
	| "entrega"
	| "concluido"
	| "cancelado";

export type TipoEntregaPedido = "delivery" | "retirada";

export type FormaPagamentoPedido = "dinheiro" | "pix" | "credito" | "debito";

/**
 * Pedido completo
 */
export interface Pedido {
	id: string;
	created_at: string;
	updated_at: string;
	estabelecimento_id: string;
	numero: number;
	codigo_rastreamento: string; // ✅ NOVO - Código único para rastreamento público
	status: StatusPedido;
	tipo_entrega: TipoEntregaPedido;
	cliente_nome: string;
	cliente_telefone: string;
	cliente_email: string | null;
	endereco_rua: string | null;
	endereco_numero: string | null;
	endereco_complemento: string | null;
	endereco_bairro: string | null;
	endereco_cidade: string | null;
	endereco_estado: string | null;
	endereco_cep: string | null;
	endereco_referencia: string | null;
	forma_pagamento: FormaPagamentoPedido;
	troco_para: number | null;
	subtotal: number;
	taxa_entrega: number;
	desconto: number;
	total: number;
	observacoes: string | null;
	aceito_em: string | null;
	preparo_em: string | null;
	pronto_em: string | null;
	entrega_em: string | null;
	concluido_em: string | null;
	cancelado_em: string | null;
	motivo_cancelamento: string | null;
	// Comprovante PIX
	comprovante_pix: string | null;
	comprovante_pix_tipo: string | null;
	comprovante_pix_enviado_em: string | null;
	comprovante_validado: boolean;
	comprovante_validado_em: string | null;
	comprovante_validado_por: string | null;
}

/**
 * Item do pedido
 */
export interface PedidoItem {
	id: string;
	created_at: string;
	pedido_id: string;
	produto_id: string;
	variacao_id: string | null;
	produto_nome: string;
	variacao_nome: string | null;
	quantidade: number;
	preco_unitario: number;
	subtotal: number;
	observacoes: string | null;
	adicionais: PedidoItemAdicional[];
}

/**
 * Adicional do item do pedido
 */
export interface PedidoItemAdicional {
	id: string;
	created_at: string;
	pedido_item_id: string;
	adicional_id: string;
	adicional_nome: string;
	quantidade: number;
	preco_unitario: number;
	subtotal: number;
}

/**
 * Pedido completo com itens
 */
export interface PedidoCompleto extends Pedido {
	itens: PedidoItem[];
	avaliacao?: PedidoAvaliacao | null;
}

/**
 * Avaliação do pedido
 */
export interface PedidoAvaliacao {
	id: string;
	pedido_id: string;
	estabelecimento_id: string;
	cliente_id: string | null;
	nota: number;
	comentario: string | null;
	created_at: string;
}

/**
 * Status do pedido com informações de exibição
 */
export interface StatusInfo {
	label: string;
	cor: string;
	icone: string;
	descricao: string;
}
