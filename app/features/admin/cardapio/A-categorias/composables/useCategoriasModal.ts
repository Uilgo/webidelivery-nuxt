/**
 * 📌 useCategoriasModal - Estado do Modal de Categorias
 *
 * Responsável por:
 * - Controle de abertura/fechamento do modal
 * - Modo do modal (criar/editar/visualizar/criar-subcategoria)
 * - Categoria selecionada para edição
 */

import type { Categoria, CategoriaComputada } from "../../../types/categoria";

export type ModalMode = "create" | "edit" | "view" | "create-subcategoria";

export interface UseCategoriasModalReturn {
	isOpen: Ref<boolean>;
	mode: Ref<ModalMode>;
	selected: Ref<Categoria | null>;
	openCreate: () => void;
	openEdit: (categoria: Categoria) => void;
	openView: (categoria: Categoria) => void;
	openCreateSubcategoria: (categoriaPai: CategoriaComputada) => void; // ✅ NOVO
	close: () => void;
}

export const useCategoriasModal = (): UseCategoriasModalReturn => {
	// Estado do modal
	const isOpen = ref(false);
	const mode = ref<ModalMode>("create");
	const selected = ref<Categoria | null>(null);

	/**
	 * Abre modal para criar nova categoria
	 */
	const openCreate = (): void => {
		mode.value = "create";
		selected.value = null;
		isOpen.value = true;
	};

	/**
	 * Abre modal para editar categoria existente
	 */
	const openEdit = (categoria: Categoria): void => {
		mode.value = "edit";
		selected.value = categoria;
		isOpen.value = true;
	};

	/**
	 * Abre modal para visualizar categoria (somente leitura)
	 */
	const openView = (categoria: Categoria): void => {
		mode.value = "view";
		selected.value = categoria;
		isOpen.value = true;
	};

	/**
	 * ✅ NOVO: Abre modal para criar subcategoria
	 */
	const openCreateSubcategoria = (_categoriaPai: CategoriaComputada): void => {
		mode.value = "create-subcategoria";
		selected.value = null; // Não há categoria selecionada, será criada nova
		isOpen.value = true;
	};

	/**
	 * Fecha o modal e limpa seleção
	 */
	const close = (): void => {
		isOpen.value = false;
		// Delay para animação de fechamento
		setTimeout(() => {
			selected.value = null;
			mode.value = "create";
		}, 200);
	};

	return {
		isOpen,
		mode,
		selected,
		openCreate,
		openEdit,
		openView,
		openCreateSubcategoria, // ✅ NOVO
		close,
	};
};
