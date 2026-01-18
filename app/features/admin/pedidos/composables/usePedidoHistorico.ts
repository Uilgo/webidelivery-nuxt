/**
 * 📌 usePedidoHistorico
 *
 * Composable para buscar e gerenciar histórico de mudanças de status.
 */

import type { Ref } from "vue";
import type { PedidoHistoricoItem } from "~/features/admin/pedidos/types/pedidos-admin";

export const usePedidoHistorico = (pedidoId: Ref<string | undefined>) => {
	const supabase = useSupabaseClient();

	const historico = ref<PedidoHistoricoItem[]>([]);
	const loading = ref(false);
	const erro = ref<string | null>(null);

	/**
	 * Buscar histórico do pedido
	 */
	const buscarHistorico = async () => {
		if (!pedidoId.value) {
			historico.value = [];
			return;
		}

		loading.value = true;
		erro.value = null;

		try {
			const { data, error } = await supabase
				.from("pedido_historico")
				.select("*")
				.eq("pedido_id", pedidoId.value)
				.order("created_at", { ascending: true });

			if (error) throw error;

			historico.value = (data || []) as PedidoHistoricoItem[];
		} catch (err) {
			erro.value = "Erro ao buscar histórico";
			console.error("[usePedidoHistorico] Erro:", err);
		} finally {
			loading.value = false;
		}
	};

	// Buscar quando pedidoId mudar
	watch(pedidoId, buscarHistorico, { immediate: true });

	return {
		historico: readonly(historico),
		loading: readonly(loading),
		erro: readonly(erro),
		buscarHistorico,
	};
};
