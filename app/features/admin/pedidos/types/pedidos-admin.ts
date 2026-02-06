/**
 * 📌 Tipos do Admin - Pedidos
 *
 * Tipos específicos para gerenciamento de pedidos no painel admin.
 */

import type {
	StatusPedido,
	TipoEntregaPedido,
	FormaPagamentoPedido,
	PedidoCompleto,
} from "~/features/public/pedido/types/pedido";

/**
 * Filtros de pedidos
 */
export interface FiltrosPedidos {
	status: StatusPedido | null;
	data_inicio: Date | null;
	data_fim: Date | null;
	tipo_entrega: TipoEntregaPedido | null;
	forma_pagamento: FormaPagamentoPedido | null;
	busca: string;
}

/**
 * Preset de filtros de data
 */
export type PresetData = "hoje" | "ontem" | "ultimos_7_dias" | "custom";

/**
 * Modo de visualização
 */
export type ModoVisualizacao = "cards" | "lista";

/**
 * Ação disponível para um pedido
 */
export interface AcaoPedido {
	label: string;
	action: () => void;
	icon: string;
	variant: "primary" | "success" | "warning" | "danger";
	loading?: boolean;
}

/**
 * Estatísticas de pedidos
 */
export interface EstatisticasPedidos {
	total: number;
	pendentes: number;
	em_andamento: number;
	concluidos: number;
	cancelados: number;
	ticket_medio: number;
}

/**
 * Item do histórico de mudanças de status
 */
export interface PedidoHistoricoItem {
	id: string;
	created_at: string;
	pedido_id: string;
	status_anterior: StatusPedido | null;
	status_novo: StatusPedido;
	usuario_id: string | null;
	usuario_nome: string | null;
	observacao: string | null;
	metadata?: Record<string, unknown>;
}

/**
 * Motivos de cancelamento do cliente
 */
export type MotivoCancelamentoCliente =
	| "mudei_ideia"
	| "pedido_errado"
	| "demora"
	| "preco"
	| "outro";

/**
 * Labels dos motivos de cancelamento
 */
export const MOTIVOS_CANCELAMENTO_LABELS: Record<MotivoCancelamentoCliente, string> = {
	mudei_ideia: "Mudei de ideia",
	pedido_errado: "Fiz o pedido errado",
	demora: "Está demorando muito",
	preco: "Preço muito alto",
	outro: "Outro motivo",
};

/**
 * Resposta do RPC de cancelamento
 */
export interface CancelarPedidoResponse {
	success: boolean;
	error?: string;
	numero?: number;
	status_anterior?: StatusPedido;
	estabelecimento_id?: string;
	pode_cancelar?: boolean;
	status_atual?: StatusPedido;
}

/**
 * Re-exportar tipos do público
 */
export type { StatusPedido, TipoEntregaPedido, FormaPagamentoPedido, PedidoCompleto };
