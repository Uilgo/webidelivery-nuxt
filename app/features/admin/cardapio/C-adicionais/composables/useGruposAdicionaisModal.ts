/**
 * 📌 useGruposAdicionaisModal - Controle de Modal de Grupos de Adicionais
 *
 * Responsável por:
 * - Controlar abertura/fechamento do modal
 * - Gerenciar modo do modal (criar/editar/visualizar)
 * - Armazenar grupo selecionado
 */

import type { GrupoAdicional } from "../../../types/adicional";

export type ModalMode = "create" | "edit" | "view";

export interface UseGruposAdicionaisModalReturn {
	isOpen: Ref<boolean>;
	mode: Ref<ModalMode>;
	selected: Ref<GrupoAdicional | null>;
	openCreate: () => void;
	openEdit: (grupo: GrupoAdicional) => void;
	openView: (grupo: GrupoAdicional) => void;
	close: () => void;
}

export const useGruposAdicionaisModal = (): UseGruposAdicionaisModalReturn => {
	// Estados
	const isOpen = ref(false);
	const mode = ref<ModalMode>("create");
	const selected = ref<GrupoAdicional | null>(null);

	/**
	 * Abre modal para criar
	 */
	const openCreate = (): void => {
		mode.value = "create";
		selected.value = null;
		isOpen.value = true;
	};

	/**
	 * Abre modal para editar
	 */
	const openEdit = (grupo: GrupoAdicional): void => {
		mode.value = "edit";
		selected.value = grupo;
		isOpen.value = true;
	};

	/**
	 * Abre modal para visualizar
	 */
	const openView = (grupo: GrupoAdicional): void => {
		mode.value = "view";
		selected.value = grupo;
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
		}, 300);
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
