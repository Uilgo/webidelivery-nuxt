/**
 * 📌 useCancelarPedido
 *
 * Composable para cliente cancelar pedido na página pública.
 */

import type {
	CancelarPedidoResponse,
	MotivoCancelamentoCliente,
} from "~/features/admin/pedidos/types/pedidos-admin";

export const useCancelarPedido = () => {
	const supabase = useSupabaseClient();

	const cancelando = ref(false);

	/**
	 * Verificar se pode cancelar
	 */
	const verificarPodeCancelar = async (pedidoId: string): Promise<boolean> => {
		try {
			const { data, error } = await supabase.rpc("verificar_pode_cancelar", {
				p_pedido_id: pedidoId,
			});

			if (error) throw error;

			return (data as { pode_cancelar?: boolean })?.pode_cancelar ?? false;
		} catch (err) {
			console.error("[useCancelarPedido] Erro ao verificar:", err);
			return false;
		}
	};

	/**
	 * Cancelar pedido
	 */
	const cancelar = async (
		pedidoId: string,
		motivo?: MotivoCancelamentoCliente,
	): Promise<CancelarPedidoResponse> => {
		cancelando.value = true;

		try {
			const { data, error } = await supabase.rpc("cancelar_pedido_cliente", {
				p_pedido_id: pedidoId,
				p_motivo: motivo || null,
			});

			if (error) throw error;

			const response = data as CancelarPedidoResponse;

			return response;
		} catch (err) {
			console.error("[useCancelarPedido] Erro:", err);

			return {
				success: false,
				error: "Erro ao cancelar pedido",
			};
		} finally {
			cancelando.value = false;
		}
	};

	return {
		cancelando: readonly(cancelando),
		verificarPodeCancelar,
		cancelar,
	};
};
