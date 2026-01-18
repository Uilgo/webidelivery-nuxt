/**
 * 📌 useProdutos - Composable Orquestrador de Produtos
 *
 * Unifica todos os composables de produtos em uma API única:
 * - useProdutosFetch (listagem)
 * - useProdutosActions (CRUD)
 * - useProdutosFilters (filtros)
 * - useProdutosModal (modal)
 */

import type {
	Produto,
	ProdutoComputado,
	ProdutoCreateData,
	ProdutoUpdateData,
} from "../../../types/produto";
import { useProdutosFetch } from "./useProdutosFetch";
import { useProdutosActions } from "./useProdutosActions";
import { useProdutosFilters } from "./useProdutosFilters";
import { useProdutosModal, type ModalMode } from "./useProdutosModal";

export interface UseProdutosReturn {
	// Dados
	produtos: ComputedRef<ProdutoComputado[]>;
	produtosRaw: Ref<ProdutoComputado[]>;
	totalProdutos: ComputedRef<number>;

	// Estados
	loading: Ref<boolean>;
	error: Ref<unknown>;
	creating: Ref<boolean>;
	updating: Ref<boolean>;
	deleting: Ref<boolean>;

	// Filtros
	filters: Ref<{
		busca?: string;
		categoria_id?: string;
		ativo?: boolean;
		destaque?: boolean;
		em_promocao?: boolean;
		ordenacao?: "nome" | "ordem" | "total_vendas" | "created_at";
		direcao?: "asc" | "desc";
	}>;
	setSearch: (value: string) => void;
	setAtivo: (value: boolean | undefined) => void;
	setCategoria: (value: string | undefined) => void;
	setDestaque: (value: boolean | undefined) => void;
	setEmPromocao: (value: boolean | undefined) => void;
	setOrdenacao: (
		field: "nome" | "ordem" | "total_vendas" | "created_at",
		direcao: "asc" | "desc",
	) => void;
	clearFilters: () => void;

	// Modal
	isModalOpen: Ref<boolean>;
	modalMode: Ref<ModalMode>;
	selectedProduto: Ref<Produto | null>;
	openCreate: () => void;
	openEdit: (produto: Produto) => void;
	openView: (produto: Produto) => void;
	closeModal: () => void;

	// Ações
	handleCreate: (data: ProdutoCreateData) => Promise<boolean>;
	handleUpdate: (id: string, data: ProdutoUpdateData) => Promise<boolean>;
	handleDelete: (id: string) => Promise<boolean>;
	handleToggleAtivo: (id: string, ativo: boolean) => Promise<boolean>;

	// Refresh
	refresh: () => Promise<void>;
	init: () => Promise<void>;
}

export const useProdutos = (): UseProdutosReturn => {
	// Composables internos
	const fetchComposable = useProdutosFetch();
	const actionsComposable = useProdutosActions();
	const filtersComposable = useProdutosFilters();
	const modalComposable = useProdutosModal();

	// ========================================
	// DADOS FILTRADOS
	// ========================================

	const produtos = computed(() => {
		return filtersComposable.applyFilters(fetchComposable.produtos.value);
	});

	const totalProdutos = computed(() => fetchComposable.produtos.value.length);

	// ========================================
	// HANDLERS DE AÇÕES
	// ========================================

	/**
	 * Criar produto e atualizar lista
	 */
	const handleCreate = async (data: ProdutoCreateData): Promise<boolean> => {
		const id = await actionsComposable.create(data);

		if (id) {
			modalComposable.close();
			await fetchComposable.refresh();
			return true;
		}

		return false;
	};

	/**
	 * Atualizar produto e atualizar lista
	 */
	const handleUpdate = async (id: string, data: ProdutoUpdateData): Promise<boolean> => {
		const success = await actionsComposable.update(id, data);

		if (success) {
			modalComposable.close();
			await fetchComposable.refresh();
			return true;
		}

		return false;
	};

	/**
	 * Excluir produto e atualizar lista
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
		produtos,
		produtosRaw: fetchComposable.produtos,
		totalProdutos,

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
		setCategoria: filtersComposable.setCategoria,
		setDestaque: filtersComposable.setDestaque,
		setEmPromocao: filtersComposable.setEmPromocao,
		setOrdenacao: filtersComposable.setOrdenacao,
		clearFilters: filtersComposable.clearFilters,

		// Modal
		isModalOpen: modalComposable.isOpen,
		modalMode: modalComposable.mode,
		selectedProduto: modalComposable.selected,
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
