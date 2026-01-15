/**
 * 📌 useAdicionais - Composable Orquestrador de Adicionais
 *
 * Unifica todos os composables de adicionais em uma API única:
 * - useAdicionaisFetch (listagem)
 * - useAdicionaisActions (CRUD)
 * - useAdicionaisFilters (filtros)
 * - useAdicionaisModal (modal)
 */

import type {
	Adicional,
	AdicionalComputado,
	AdicionalCreateData,
	AdicionalUpdateData,
} from "../../../types/adicional";
import { useAdicionaisFetch } from "./useAdicionaisFetch";
import { useAdicionaisActions } from "./useAdicionaisActions";
import { useAdicionaisFilters } from "./useAdicionaisFilters";
import { useAdicionaisModal, type ModalMode } from "./useAdicionaisModal";

export interface UseAdicionaisReturn {
	// Dados
	adicionais: ComputedRef<AdicionalComputado[]>;
	adicionaisRaw: Ref<AdicionalComputado[]>;
	totalAdicionais: ComputedRef<number>;

	// Estados
	loading: Ref<boolean>;
	error: Ref<string | null>;
	creating: Ref<boolean>;
	updating: Ref<boolean>;
	deleting: Ref<boolean>;

	// Filtros
	filters: Ref<{
		busca?: string;
		ativo?: boolean;
		ordenacao?: "nome" | "preco" | "ordem";
		direcao?: "asc" | "desc";
	}>;
	setSearch: (value: string) => void;
	setAtivo: (value: boolean | undefined) => void;
	setOrdenacao: (field: "nome" | "preco" | "ordem", direcao: "asc" | "desc") => void;
	clearFilters: () => void;

	// Modal
	isModalOpen: Ref<boolean>;
	modalMode: Ref<ModalMode>;
	selectedAdicional: Ref<Adicional | null>;
	grupoId: Ref<string | null>;
	openCreate: (grupoId: string) => void;
	openEdit: (adicional: Adicional) => void;
	openView: (adicional: Adicional) => void;
	closeModal: () => void;

	// Ações
	handleCreate: (data: AdicionalCreateData) => Promise<boolean>;
	handleUpdate: (id: string, data: AdicionalUpdateData) => Promise<boolean>;
	handleDelete: (id: string) => Promise<boolean>;
	handleToggleAtivo: (id: string, ativo: boolean) => Promise<boolean>;

	// Refresh
	refresh: (grupoId: string) => Promise<void>;
	init: (grupoId: string) => Promise<void>;
}

export const useAdicionais = (): UseAdicionaisReturn => {
	// Composables internos
	const fetchComposable = useAdicionaisFetch();
	const actionsComposable = useAdicionaisActions();
	const filtersComposable = useAdicionaisFilters();
	const modalComposable = useAdicionaisModal();

	// ========================================
	// DADOS FILTRADOS
	// ========================================

	const adicionais = computed(() => {
		return filtersComposable.applyFilters(fetchComposable.adicionais.value);
	});

	const totalAdicionais = computed(() => fetchComposable.adicionais.value.length);

	// ========================================
	// HANDLERS DE AÇÕES
	// ========================================

	/**
	 * Criar adicional e atualizar lista
	 */
	const handleCreate = async (data: AdicionalCreateData): Promise<boolean> => {
		const id = await actionsComposable.create(data);

		if (id) {
			modalComposable.close();
			await fetchComposable.refresh(data.grupo_id);
			return true;
		}

		return false;
	};

	/**
	 * Atualizar adicional e atualizar lista
	 */
	const handleUpdate = async (id: string, data: AdicionalUpdateData): Promise<boolean> => {
		const success = await actionsComposable.update(id, data);

		if (success && modalComposable.grupoId.value) {
			modalComposable.close();
			await fetchComposable.refresh(modalComposable.grupoId.value);
			return true;
		}

		return false;
	};

	/**
	 * Excluir adicional e atualizar lista
	 */
	const handleDelete = async (id: string): Promise<boolean> => {
		const success = await actionsComposable.remove(id);

		if (success && modalComposable.grupoId.value) {
			modalComposable.close();
			await fetchComposable.refresh(modalComposable.grupoId.value);
			return true;
		}

		return false;
	};

	/**
	 * Toggle ativo/inativo
	 */
	const handleToggleAtivo = async (id: string, ativo: boolean): Promise<boolean> => {
		const success = await actionsComposable.toggleAtivo(id, ativo);

		if (success && modalComposable.grupoId.value) {
			await fetchComposable.refresh(modalComposable.grupoId.value);
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
	const init = async (grupoId: string): Promise<void> => {
		await fetchComposable.fetch(grupoId);
	};

	// ========================================
	// RETORNO
	// ========================================

	return {
		// Dados
		adicionais,
		adicionaisRaw: fetchComposable.adicionais,
		totalAdicionais,

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
		selectedAdicional: modalComposable.selected,
		grupoId: modalComposable.grupoId,
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
