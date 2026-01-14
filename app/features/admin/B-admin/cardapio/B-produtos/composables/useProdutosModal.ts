/**
 * 📌 useProdutosModal - Gerenciamento de Modal de Produtos
 *
 * Responsável por:
 * - Controlar abertura/fechamento do modal
 * - Gerenciar modo (criar/editar/visualizar)
 * - Armazenar produto selecionado
 */

import type { Produto } from "../../../types/produto";

export type ModalMode = "create" | "edit" | "view";

export interface UseProdutosModalReturn {
	isOpen: Ref<boolean>;
	mode: Ref<ModalMode>;
	selected: Ref<Produto | null>;
	openCreate: () => void;
	openEdit: (produto: Produto) => void;
	openView: (produto: Produto) => void;
	close: () => void;
}

export const useProdutosModal = (): UseProdutosModalReturn => {
	// Estado do modal
	const isOpen = ref(false);
	const mode = ref<ModalMode>("create");
	const selected = ref<Produto | null>(null);

	/**
	 * Abrir modal para criar
	 */
	const openCreate = (): void => {
		mode.value = "create";
		selected.value = null;
		isOpen.value = true;
	};

	/**
	 * Abrir modal para editar
	 */
	const openEdit = (produto: Produto): void => {
		mode.value = "edit";
		selected.value = produto;
		isOpen.value = true;
	};

	/**
	 * Abrir modal para visualizar
	 */
	const openView = (produto: Produto): void => {
		mode.value = "view";
		selected.value = produto;
		isOpen.value = true;
	};

	/**
	 * Fechar modal
	 */
	const close = (): void => {
		isOpen.value = false;
		// Delay para limpar após animação
		setTimeout(() => {
			mode.value = "create";
			selected.value = null;
		}, 200);
	};

	return {
		isOpen,
		mode,
		selected,
		openCreate,
		openEdit,
		openView,
		close,
	};
};
