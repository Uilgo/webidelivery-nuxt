/**
 * 📌 useCombosModal
 *
 * Composable responsável pelo estado do modal de combos.
 * Gerencia abertura/fechamento e modo (create/edit/view).
 */

import type { Combo } from "../../../types/combo";

export const useCombosModal = () => {
	// Estado do modal
	const isModalOpen = ref(false);
	const modalMode = ref<"create" | "edit" | "view">("create");
	const selectedCombo = ref<Combo | null>(null);

	/**
	 * Abrir modal para criar
	 */
	const openCreate = (): void => {
		modalMode.value = "create";
		selectedCombo.value = null;
		isModalOpen.value = true;
	};

	/**
	 * Abrir modal para editar
	 */
	const openEdit = (combo: Combo): void => {
		modalMode.value = "edit";
		selectedCombo.value = combo;
		isModalOpen.value = true;
	};

	/**
	 * Abrir modal para visualizar
	 */
	const openView = (combo: Combo): void => {
		modalMode.value = "view";
		selectedCombo.value = combo;
		isModalOpen.value = true;
	};

	/**
	 * Fechar modal
	 */
	const closeModal = (): void => {
		isModalOpen.value = false;
		selectedCombo.value = null;
	};

	return {
		isModalOpen,
		modalMode,
		selectedCombo,
		openCreate,
		openEdit,
		openView,
		closeModal,
	};
};
