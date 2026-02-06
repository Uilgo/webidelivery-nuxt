/**
 * 📌 status-transitions.ts
 *
 * Utilitários para gerenciar transições de status de pedidos.
 * Define regras de negócio para mudanças de status.
 */

import type { StatusPedido } from "~/features/admin/pedidos/types/pedidos-admin";

/**
 * Define quais transições de status são permitidas para o estabelecimento
 */
export const TRANSICOES_PERMITIDAS: Record<StatusPedido, StatusPedido[]> = {
	pendente: ["aceito", "cancelado"],
	aceito: ["pendente", "preparo", "cancelado"],
	preparo: ["aceito", "pronto", "cancelado"],
	pronto: ["preparo", "entrega", "cancelado"],
	entrega: ["pronto", "concluido", "cancelado"],
	concluido: [], // ❌ Não pode reverter pedido concluído
	cancelado: ["pendente", "aceito"], // ✅ Pode reativar
};

/**
 * Verifica se uma transição de status é permitida
 */
export const podeTransicionar = (statusAtual: StatusPedido, statusNovo: StatusPedido): boolean => {
	return TRANSICOES_PERMITIDAS[statusAtual]?.includes(statusNovo) ?? false;
};

/**
 * Retorna os status possíveis a partir do status atual
 */
export const getProximosStatus = (statusAtual: StatusPedido): StatusPedido[] => {
	return TRANSICOES_PERMITIDAS[statusAtual] || [];
};

/**
 * Verifica se uma transição requer observação obrigatória
 * Reversões sempre requerem observação
 */
export const requerObservacao = (statusAtual: StatusPedido, statusNovo: StatusPedido): boolean => {
	const reversoes: [StatusPedido, StatusPedido][] = [
		["cancelado", "pendente"],
		["cancelado", "aceito"],
		["aceito", "pendente"],
		["preparo", "aceito"],
		["pronto", "preparo"],
		["entrega", "pronto"],
	];

	return reversoes.some(([de, para]) => statusAtual === de && statusNovo === para);
};

/**
 * Verifica se cliente pode cancelar o pedido
 * Cliente só pode cancelar até status "aceito"
 */
export const clientePodeCancelar = (status: StatusPedido): boolean => {
	return ["pendente", "aceito"].includes(status);
};

/**
 * Retorna mensagem de aviso sobre cancelamento para o cliente
 */
export const getAvisoCancelamento = (status: StatusPedido): string | null => {
	switch (status) {
		case "pendente":
			return "Você pode cancelar seu pedido a qualquer momento até ele ser aceito.";

		case "aceito":
			return "Você ainda pode cancelar seu pedido. Após iniciar o preparo, não será mais possível.";

		case "preparo":
			return "Seu pedido já está sendo preparado e não pode mais ser cancelado.";

		case "pronto":
			return "Seu pedido está pronto e não pode mais ser cancelado.";

		case "entrega":
			return "Seu pedido está a caminho e não pode mais ser cancelado.";

		case "concluido":
		case "cancelado":
			return null;

		default:
			return null;
	}
};

/**
 * Retorna cor do botão de status para UI
 */
export const getStatusButtonColor = (
	status: StatusPedido,
): "primary" | "success" | "warning" | "error" | "neutral" => {
	switch (status) {
		case "aceito":
		case "preparo":
			return "primary";
		case "pronto":
		case "entrega":
			return "success";
		case "pendente":
			return "warning";
		case "cancelado":
			return "error";
		default:
			return "neutral";
	}
};
