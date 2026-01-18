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
	categoriaPai: Ref<CategoriaComputada | null>; // ✅ NOVO: categoria pai para subcategorias
	openCreate: () => void;
	openEdit: (categoria: Categoria) => void;
	openView: (categoria: Categoria) => void;
	openCreateSubcategoria: (categoriaPai: CategoriaComputada) => void; // ✅ NOVO: criar subcategoria
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

	// ✅ NOVO: Estado para categoria pai (subcategorias)
	const categoriaPai = ref<CategoriaComputada | null>(null);

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
		// ✅ NOVO: Inclui categoria_pai_id se estiver criando subcategoria
		const createData = {
			...data,
			...(categoriaPai.value && { categoria_pai_id: categoriaPai.value.id }),
		};

		const id = await actionsComposable.create(createData);

		if (id) {
			modalComposable.close();
			categoriaPai.value = null; // ✅ NOVO: Limpa categoria pai
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

	// ✅ NOVO: Abre modal para criar subcategoria
	const openCreateSubcategoria = (pai: CategoriaComputada): void => {
		categoriaPai.value = pai;
		modalComposable.openCreateSubcategoria(pai);
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
		categoriaPai: readonly(categoriaPai), // ✅ NOVO: expõe categoria pai
		openCreate: modalComposable.openCreate,
		openEdit: modalComposable.openEdit,
		openView: modalComposable.openView,
		openCreateSubcategoria, // ✅ NOVO: método para criar subcategoria
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
