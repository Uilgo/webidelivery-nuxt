/**
 * 📌 Formatadores de Pedidos
 *
 * Funções utilitárias para formatar dados de pedidos.
 */

import type { StatusPedido } from "~/features/admin/pedidos/types/pedidos-admin";

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
 * Retorna informações de exibição do status
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
 * Formata forma de pagamento
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
 * Formata tipo de entrega
 */
export const formatarTipoEntrega = (tipo: string): string => {
	const mapa: Record<string, string> = {
		delivery: "Entrega",
		retirada: "Retirada",
	};

	return mapa[tipo] || tipo;
};

/**
 * Formata data relativa (há X minutos/horas)
 */
export const formatarDataRelativa = (data: string): string => {
	const agora = new Date();
	const dataObj = new Date(data);
	const diffMs = agora.getTime() - dataObj.getTime();
	const diffMinutos = Math.floor(diffMs / 60000);

	if (diffMinutos < 1) {
		return "Agora mesmo";
	}

	if (diffMinutos < 60) {
		return `Há ${diffMinutos} minuto${diffMinutos > 1 ? "s" : ""}`;
	}

	const diffHoras = Math.floor(diffMinutos / 60);
	if (diffHoras < 24) {
		return `Há ${diffHoras} hora${diffHoras > 1 ? "s" : ""}`;
	}

	const diffDias = Math.floor(diffHoras / 24);
	return `Há ${diffDias} dia${diffDias > 1 ? "s" : ""}`;
};

/**
 * Formata data completa
 */
export const formatarDataCompleta = (data: string): string => {
	return new Date(data).toLocaleString("pt-BR", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
};

/**
 * Formata apenas hora
 */
export const formatarHora = (data: string): string => {
	return new Date(data).toLocaleTimeString("pt-BR", {
		hour: "2-digit",
		minute: "2-digit",
	});
};

/**
 * Formata status do pedido (apenas o label)
 */
export const formatarStatus = (status: StatusPedido): string => {
	return getStatusInfo(status).label;
};

/**
 * Formata tempo decorrido desde a criação do pedido
 */
export const formatarTempoDecorrido = (data: string): string => {
	return formatarDataRelativa(data);
};

/**
 * Formata data e hora completa
 */
export const formatarDataHora = (data: string): string => {
	return formatarDataCompleta(data);
};
