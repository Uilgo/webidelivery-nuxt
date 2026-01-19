/**
 * 📊 useAvaliacaoPedido - Composable para gerenciar avaliações de pedidos
 *
 * Responsável por:
 * - Controlar estado do modal de avaliação
 * - Gerenciar pedido sendo avaliado
 * - Fornecer interface simples para abrir modal
 */

export interface PedidoParaAvaliar {
	id: string;
	numero: number;
}

export const useAvaliacaoPedido = () => {
	/**
	 * Estado do modal
	 */
	const modalAberto = ref<boolean>(false);
	const pedidoAtual = ref<PedidoParaAvaliar | null>(null);

	/**
	 * Abre modal de avaliação para um pedido
	 */
	const abrirModalAvaliacao = (pedido: PedidoParaAvaliar): void => {
		pedidoAtual.value = pedido;
		modalAberto.value = true;
	};

	/**
	 * Fecha modal de avaliação
	 */
	const fecharModalAvaliacao = (): void => {
		modalAberto.value = false;
		setTimeout(() => {
			pedidoAtual.value = null;
		}, 300);
	};

	/**
	 * Callback quando avaliação é enviada com sucesso
	 */
	const onAvaliacaoEnviada = (): void => {
		// Pode adicionar toast de sucesso aqui
		fecharModalAvaliacao();
	};

	return {
		modalAberto: readonly(modalAberto),
		pedidoAtual: readonly(pedidoAtual),
		abrirModalAvaliacao,
		fecharModalAvaliacao,
		onAvaliacaoEnviada,
	};
};
