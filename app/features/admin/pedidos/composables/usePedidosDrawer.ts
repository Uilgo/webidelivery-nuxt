/**
 * 📌 usePedidosDrawer - Estado do Drawer de Pedidos
 *
 * Responsável por:
 * - Controle de abertura/fechamento do drawer
 * - Pedido selecionado para visualização/ações
 */

import type { PedidoCompleto } from "~/features/admin/pedidos/types/pedidos-admin";

export interface UsePedidosDrawerReturn {
	isOpen: Ref<boolean>;
	selected: Ref<PedidoCompleto | null>;
	open: (pedido: PedidoCompleto) => void;
	close: () => void;
}

export const usePedidosDrawer = (): UsePedidosDrawerReturn => {
	// Estado do drawer
	const isOpen = ref(false);
	const selected = ref<PedidoCompleto | null>(null);

	/**
	 * Abre drawer com pedido selecionado
	 */
	const open = (pedido: PedidoCompleto): void => {
		selected.value = pedido;
		isOpen.value = true;
	};

	/**
	 * Fecha o drawer e limpa seleção
	 */
	const close = (): void => {
		isOpen.value = false;
		// Delay para animação de fechamento
		setTimeout(() => {
			selected.value = null;
		}, 200);
	};

	return {
		isOpen,
		selected,
		open,
		close,
	};
};
