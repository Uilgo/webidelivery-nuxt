/**
 * 📌 useAdicionaisModal - Controle de Modal de Adicionais
 *
 * Responsável por:
 * - Controlar abertura/fechamento do modal
 * - Gerenciar modo do modal (criar/editar/visualizar)
 * - Armazenar adicional selecionado
 */

import type { Adicional } from "../../../types/adicional";

export type ModalMode = "create" | "edit" | "view";

export interface UseAdicionaisModalReturn {
	isOpen: Ref<boolean>;
	mode: Ref<ModalMode>;
	selected: Ref<Adicional | null>;
	grupoId: Ref<string | null>;
	openCreate: (grupoId: string) => void;
	openEdit: (adicional: Adicional) => void;
	openView: (adicional: Adicional) => void;
	close: () => void;
}

export const useAdicionaisModal = (): UseAdicionaisModalReturn => {
	// Estados
	const isOpen = ref(false);
	const mode = ref<ModalMode>("create");
	const selected = ref<Adicional | null>(null);
	const grupoId = ref<string | null>(null);

	/**
	 * Abre modal para criar
	 */
	const openCreate = (grupoIdParam: string): void => {
		mode.value = "create";
		selected.value = null;
		grupoId.value = grupoIdParam;
		isOpen.value = true;
	};

	/**
	 * Abre modal para editar
	 */
	const openEdit = (adicional: Adicional): void => {
		mode.value = "edit";
		selected.value = adicional;
		grupoId.value = adicional.grupo_id;
		isOpen.value = true;
	};

	/**
	 * Abre modal para visualizar
	 */
	const openView = (adicional: Adicional): void => {
		mode.value = "view";
		selected.value = adicional;
		grupoId.value = adicional.grupo_id;
		isOpen.value = true;
	};

	/**
	 * Fecha modal
	 */
	const close = (): void => {
		isOpen.value = false;
		// Aguarda animação antes de limpar
		setTimeout(() => {
			mode.value = "create";
			selected.value = null;
			grupoId.value = null;
		}, 300);
	};

	return {
		isOpen,
		mode,
		selected,
		grupoId,
		openCreate,
		openEdit,
		openView,
		close,
	};
};
