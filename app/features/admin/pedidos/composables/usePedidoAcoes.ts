/**
 * 📌 usePedidoAcoes
 *
 * Composable para ações em pedidos (CUD via RPC).
 */

import type { StatusPedido } from "~/features/admin/pedidos/types/pedidos-admin";

export const usePedidoAcoes = () => {
	const supabase = useSupabaseClient();

	/**
	 * Estado de loading por ação
	 */
	const loading = ref<Record<string, boolean>>({});

	/**
	 * Atualizar status do pedido (usa RPC v2 com histórico)
	 */
	const atualizarStatus = async (
		pedidoId: string,
		novoStatus: StatusPedido,
		observacao?: string,
	): Promise<boolean> => {
		const key = `${pedidoId}-${novoStatus}`;
		loading.value[key] = true;

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
				console.error("Erro ao atualizar status:", data?.error);
				return false;
			}

			return true;
		} catch (err) {
			console.error("Erro ao atualizar status:", err);
			return false;
		} finally {
			loading.value[key] = false;
		}
	};

	/**
	 * Aceitar pedido
	 */
	const aceitarPedido = async (pedidoId: string): Promise<boolean> => {
		return await atualizarStatus(pedidoId, "aceito");
	};

	/**
	 * Iniciar preparo
	 */
	const iniciarPreparo = async (pedidoId: string): Promise<boolean> => {
		return await atualizarStatus(pedidoId, "preparo");
	};

	/**
	 * Marcar como pronto
	 */
	const marcarPronto = async (pedidoId: string): Promise<boolean> => {
		return await atualizarStatus(pedidoId, "pronto");
	};

	/**
	 * Saiu para entrega
	 */
	const sairParaEntrega = async (pedidoId: string): Promise<boolean> => {
		return await atualizarStatus(pedidoId, "entrega");
	};

	/**
	 * Concluir pedido
	 */
	const concluirPedido = async (pedidoId: string): Promise<boolean> => {
		return await atualizarStatus(pedidoId, "concluido");
	};

	/**
	 * Cancelar pedido (estabelecimento)
	 */
	const cancelarPedido = async (pedidoId: string, motivo: string): Promise<boolean> => {
		return await atualizarStatus(pedidoId, "cancelado", motivo);
	};

	/**
	 * Verificar se ação está em loading
	 */
	const isLoading = (pedidoId: string, acao: string): boolean => {
		return loading.value[`${pedidoId}-${acao}`] || false;
	};

	return {
		loading,
		atualizarStatus,
		aceitarPedido,
		iniciarPreparo,
		marcarPronto,
		sairParaEntrega,
		concluirPedido,
		cancelarPedido,
		isLoading,
	};
};
