/**
 * 📌 Formatadores de Pedidos
 *
 * Funções utilitárias específicas do domínio de pedidos.
 * Formatadores genéricos (data, moeda, etc) estão em lib/formatters.
 */

import type { StatusPedido } from "~/features/admin/pedidos/types/pedidos-admin";
import { formatDateTime, formatTime, formatRelativeTime } from "~/lib/formatters/date";

/**
 * Informações de exibição do status
 */
export interface StatusInfo {
	label: string;
	cor: string;
	icone: string;
	descricao: string;
}

/**
 * Retorna informações de exibição do status do pedido
 *
 * @param status - Status do pedido
 * @returns Objeto com informações de exibição (label, cor, ícone, descrição)
 */
export const getStatusInfo = (status: StatusPedido): StatusInfo => {
	const statusMap: Record<StatusPedido, StatusInfo> = {
		pendente: {
			label: "Pendente",
			cor: "text-yellow-600 bg-yellow-500/10 border-yellow-500/20",
			icone: "lucide:clock",
			descricao: "Aguardando confirmação",
		},
		aceito: {
			label: "Aceito",
			cor: "text-blue-600 bg-blue-500/10 border-blue-500/20",
			icone: "lucide:check-circle",
			descricao: "Pedido aceito",
		},
		preparo: {
			label: "Em Preparo",
			cor: "text-orange-600 bg-orange-500/10 border-orange-500/20",
			icone: "lucide:chef-hat",
			descricao: "Sendo preparado",
		},
		pronto: {
			label: "Pronto",
			cor: "text-purple-600 bg-purple-500/10 border-purple-500/20",
			icone: "lucide:package-check",
			descricao: "Aguardando retirada/entrega",
		},
		entrega: {
			label: "Em Entrega",
			cor: "text-indigo-600 bg-indigo-500/10 border-indigo-500/20",
			icone: "lucide:bike",
			descricao: "Saiu para entrega",
		},
		concluido: {
			label: "Concluído",
			cor: "text-green-600 bg-green-500/10 border-green-500/20",
			icone: "lucide:check-circle-2",
			descricao: "Pedido concluído",
		},
		cancelado: {
			label: "Cancelado",
			cor: "text-red-600 bg-red-500/10 border-red-500/20",
			icone: "lucide:x-circle",
			descricao: "Pedido cancelado",
		},
	};

	return statusMap[status];
};

/**
 * Formata forma de pagamento para exibição
 *
 * @param forma - Código da forma de pagamento
 * @returns Label formatado
 */
export const formatarFormaPagamento = (forma: string): string => {
	const mapa: Record<string, string> = {
		dinheiro: "Dinheiro",
		pix: "PIX",
		credito: "Cartão de Crédito",
		debito: "Cartão de Débito",
	};

	return mapa[forma] || forma;
};

/**
 * Formata tipo de entrega para exibição
 *
 * @param tipo - Código do tipo de entrega
 * @returns Label formatado
 */
export const formatarTipoEntrega = (tipo: string): string => {
	const mapa: Record<string, string> = {
		delivery: "Entrega",
		retirada: "Retirada",
	};

	return mapa[tipo] || tipo;
};

/**
 * Formata status do pedido (apenas o label)
 *
 * @param status - Status do pedido
 * @returns Label do status
 */
export const formatarStatus = (status: StatusPedido): string => {
	return getStatusInfo(status).label;
};

/**
 * Formata tempo decorrido desde a criação do pedido
 * Usa formatter centralizado de lib/formatters/date
 *
 * @param data - Data ISO string
 * @returns String formatada (ex: "Há 5 minutos")
 */
export const formatarTempoDecorrido = (data: string): string => {
	return formatRelativeTime(data);
};

/**
 * Formata data e hora completa do pedido
 * Usa formatter centralizado de lib/formatters/date
 *
 * @param data - Data ISO string
 * @returns String formatada (ex: "25/01/2024 14:30")
 */
export const formatarDataHora = (data: string): string => {
	return formatDateTime(data);
};

/**
 * Formata apenas hora do pedido
 * Usa formatter centralizado de lib/formatters/date
 *
 * @param data - Data ISO string
 * @returns String formatada (ex: "14:30")
 */
export const formatarHora = (data: string): string => {
	return formatTime(data);
};
