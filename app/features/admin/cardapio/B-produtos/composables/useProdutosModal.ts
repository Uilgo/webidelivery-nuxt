/**
 * 📌 useProdutosModal - Gerenciamento de Modal de Produtos
 *
 * Responsável por:
 * - Controlar abertura/fechamento do modal
 * - Gerenciar modo (criar/editar/visualizar)
 * - Armazenar produto selecionado
 * - Buscar produto completo com variações ao editar
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
	const supabase = useSupabaseClient();

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
	 * Busca o produto completo com variações e grupos de adicionais
	 */
	const openEdit = async (produto: Produto): Promise<void> => {
		mode.value = "edit";

		// Buscar produto completo com variações
		try {
			const { data, error } = await supabase
				.from("produtos")
				.select(
					`
					*,
					categoria:categorias!produtos_categoria_id_fkey(id, nome),
					variacoes:produto_variacoes(id, nome, preco, preco_promocional, ordem, ativo),
					grupos_adicionais:produto_grupos_adicionais(grupo_adicional_id)
				`,
				)
				.eq("id", produto.id)
				.single();

			if (error) throw error;

			selected.value = data as Produto;
		} catch {
			// Se falhar, usa o produto passado
			selected.value = produto;
		}

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
