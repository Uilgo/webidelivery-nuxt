/**
 * 📌 useCategorias - Composable Orquestrador de Categorias
 *
 * Unifica todos os composables de categorias em uma API única:
 * - useCategoriasFetch (listagem)
 * - useCategoriasActions (CRUD)
 * - useCategoriasFilters (filtros)
 * - useCategoriasModal (modal)
 */

import type {
	Categoria,
	CategoriaComputada,
	CategoriaCreateData,
	CategoriaUpdateData,
} from "../../../types/categoria";
import { useCategoriasFetch } from "./useCategoriasFetch";
import { useCategoriasActions } from "./useCategoriasActions";
import { useCategoriasFilters } from "./useCategoriasFilters";
import { useCategoriasModal, type ModalMode } from "./useCategoriasModal";

export interface UseCategoriasReturn {
	// Dados
	categorias: ComputedRef<CategoriaComputada[]>;
	categoriasRaw: Ref<CategoriaComputada[]>;
	totalCategorias: ComputedRef<number>;

	// Estados
	loading: Ref<boolean>;
	error: Ref<unknown>;
	creating: Ref<boolean>;
	updating: Ref<boolean>;
	deleting: Ref<boolean>;

	// Filtros
	filters: Ref<{
		busca?: string;
		ativo?: boolean;
		ordenacao?: "nome" | "ordem" | "created_at";
		direcao?: "asc" | "desc";
	}>;
	setSearch: (value: string) => void;
	setAtivo: (value: boolean | undefined) => void;
	setOrdenacao: (field: "nome" | "ordem" | "created_at", direcao: "asc" | "desc") => void;
	clearFilters: () => void;

	// Modal
	isModalOpen: Ref<boolean>;
	modalMode: Ref<ModalMode>;
	selectedCategoria: Ref<Categoria | null>;
	openCreate: () => void;
	openEdit: (categoria: Categoria) => void;
	openView: (categoria: Categoria) => void;
	closeModal: () => void;

	// Ações
	handleCreate: (data: CategoriaCreateData) => Promise<boolean>;
	handleUpdate: (id: string, data: CategoriaUpdateData) => Promise<boolean>;
	handleDelete: (id: string) => Promise<boolean>;
	handleToggleAtivo: (id: string, ativo: boolean) => Promise<boolean>;

	// Refresh
	refresh: () => Promise<void>;
	init: () => Promise<void>;
}

export const useCategorias = (): UseCategoriasReturn => {
	// Composables internos
	const fetchComposable = useCategoriasFetch();
	const actionsComposable = useCategoriasActions();
	const filtersComposable = useCategoriasFilters();
	const modalComposable = useCategoriasModal();

	// ========================================
	// DADOS FILTRADOS
	// ========================================

	const categorias = computed(() => {
		return filtersComposable.applyFilters(fetchComposable.categorias.value);
	});

	const totalCategorias = computed(() => fetchComposable.categorias.value.length);

	// ========================================
	// HANDLERS DE AÇÕES
	// ========================================

	/**
	 * Criar categoria e atualizar lista
	 */
	const handleCreate = async (data: CategoriaCreateData): Promise<boolean> => {
		const id = await actionsComposable.create(data);

		if (id) {
			modalComposable.close();
			await fetchComposable.refresh();
			return true;
		}

		return false;
	};

	/**
	 * Atualizar categoria e atualizar lista
	 */
	const handleUpdate = async (id: string, data: CategoriaUpdateData): Promise<boolean> => {
		const success = await actionsComposable.update(id, data);

		if (success) {
			modalComposable.close();
			await fetchComposable.refresh();
			return true;
		}

		return false;
	};

	/**
	 * Excluir categoria e atualizar lista
	 */
	const handleDelete = async (id: string): Promise<boolean> => {
		const success = await actionsComposable.remove(id);

		if (success) {
			modalComposable.close();
			await fetchComposable.refresh();
			return true;
		}

		return false;
	};

	/**
	 * Toggle ativo/inativo
	 */
	const handleToggleAtivo = async (id: string, ativo: boolean): Promise<boolean> => {
		const success = await actionsComposable.toggleAtivo(id, ativo);

		if (success) {
			await fetchComposable.refresh();
			return true;
		}

		return false;
	};

	// ========================================
	// INICIALIZAÇÃO
	// ========================================

	/**
	 * Inicializa o composable buscando dados
	 */
	const init = async (): Promise<void> => {
		await fetchComposable.init();
	};

	// ========================================
	// RETORNO
	// ========================================

	return {
		// Dados
		categorias,
		categoriasRaw: fetchComposable.categorias,
		totalCategorias,

		// Estados
		loading: fetchComposable.loading,
		error: fetchComposable.error,
		creating: actionsComposable.creating,
		updating: actionsComposable.updating,
		deleting: actionsComposable.deleting,

		// Filtros
		filters: filtersComposable.filters,
		setSearch: filtersComposable.setSearch,
		setAtivo: filtersComposable.setAtivo,
		setOrdenacao: filtersComposable.setOrdenacao,
		clearFilters: filtersComposable.clearFilters,

		// Modal
		isModalOpen: modalComposable.isOpen,
		modalMode: modalComposable.mode,
		selectedCategoria: modalComposable.selected,
		openCreate: modalComposable.openCreate,
		openEdit: modalComposable.openEdit,
		openView: modalComposable.openView,
		closeModal: modalComposable.close,

		// Ações
		handleCreate,
		handleUpdate,
		handleDelete,
		handleToggleAtivo,

		// Refresh
		refresh: fetchComposable.refresh,
		init,
	};
};
