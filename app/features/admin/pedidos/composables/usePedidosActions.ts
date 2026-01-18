/**
 * 📌 usePedidosActions - Ações em Pedidos
 *
 * Responsável por:
 * - Atualizar status do pedido (via RPC com histórico)
 * - Ações específicas (aceitar, preparo, pronto, entrega, concluir, cancelar)
 * - Estados de loading por ação
 */

import type { StatusPedido } from "~/features/admin/pedidos/types/pedidos-admin";

export interface UsePedidosActionsReturn {
	updating: Ref<Record<string, boolean>>;
	actionError: Ref<string | null>;
	updateStatus: (
		pedidoId: string,
		novoStatus: StatusPedido,
		observacao?: string,
	) => Promise<boolean>;
	accept: (pedidoId: string) => Promise<boolean>;
	startPreparation: (pedidoId: string) => Promise<boolean>;
	markReady: (pedidoId: string) => Promise<boolean>;
	startDelivery: (pedidoId: string) => Promise<boolean>;
	complete: (pedidoId: string) => Promise<boolean>;
	cancel: (pedidoId: string, motivo: string) => Promise<boolean>;
	isLoading: (pedidoId: string, acao: string) => boolean;
}

export const usePedidosActions = (): UsePedidosActionsReturn => {
	const supabase = useSupabaseClient();

	// Estados de loading por ação
	const updating = ref<Record<string, boolean>>({});
	const actionError = ref<string | null>(null);

	/**
	 * Atualizar status do pedido (usa RPC v2 com histórico)
	 */
	const updateStatus = async (
		pedidoId: string,
		novoStatus: StatusPedido,
		observacao?: string,
	): Promise<boolean> => {
		const key = `${pedidoId}-${novoStatus}`;
		updating.value[key] = true;
		actionError.value = null;

		try {
			const { data, error } = await supabase.rpc("atualizar_status_pedido_v2", {
				p_pedido_id: pedidoId,
				p_novo_status: novoStatus,
				p_observacao: observacao || null,
			});

			if (error) {
				throw error;
			}

			if (!data?.success) {
				const errorMsg = data?.error || "Erro ao atualizar status";
				actionError.value = errorMsg;
				console.error("[usePedidosActions] Erro ao atualizar status:", errorMsg);
				return false;
			}

			return true;
		} catch (err) {
			const message = err instanceof Error ? err.message : "Erro ao atualizar status";
			actionError.value = message;
			console.error("[usePedidosActions] Erro ao atualizar status:", message);
			return false;
		} finally {
			updating.value[key] = false;
		}
	};

	/**
	 * Aceitar pedido
	 */
	const accept = async (pedidoId: string): Promise<boolean> => {
		return await updateStatus(pedidoId, "aceito");
	};

	/**
	 * Iniciar preparo
	 */
	const startPreparation = async (pedidoId: string): Promise<boolean> => {
		return await updateStatus(pedidoId, "preparo");
	};

	/**
	 * Marcar como pronto
	 */
	const markReady = async (pedidoId: string): Promise<boolean> => {
		return await updateStatus(pedidoId, "pronto");
	};

	/**
	 * Saiu para entrega
	 */
	const startDelivery = async (pedidoId: string): Promise<boolean> => {
		return await updateStatus(pedidoId, "entrega");
	};

	/**
	 * Concluir pedido
	 */
	const complete = async (pedidoId: string): Promise<boolean> => {
		return await updateStatus(pedidoId, "concluido");
	};

	/**
	 * Cancelar pedido (estabelecimento)
	 */
	const cancel = async (pedidoId: string, motivo: string): Promise<boolean> => {
		return await updateStatus(pedidoId, "cancelado", motivo);
	};

	/**
	 * Verificar se ação está em loading
	 */
	const isLoading = (pedidoId: string, acao: string): boolean => {
		return updating.value[`${pedidoId}-${acao}`] || false;
	};

	return {
		updating,
		actionError,
		updateStatus,
		accept,
		startPreparation,
		markReady,
		startDelivery,
		complete,
		cancel,
		isLoading,
	};
};
