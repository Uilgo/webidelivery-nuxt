/**
 * 📌 useGruposAdicionais - Composable Orquestrador de Grupos de Adicionais
 *
 * Unifica todos os composables de grupos de adicionais em uma API única:
 * - useGruposAdicionaisFetch (listagem)
 * - useGruposAdicionaisActions (CRUD)
 * - useGruposAdicionaisFilters (filtros)
 * - useGruposAdicionaisModal (modal)
 */

import type {
	GrupoAdicional,
	GrupoAdicionalComputado,
	GrupoAdicionalCreateData,
	GrupoAdicionalUpdateData,
} from "../../../types/adicional";
import { useGruposAdicionaisFetch } from "./useGruposAdicionaisFetch";
import { useGruposAdicionaisActions } from "./useGruposAdicionaisActions";
import { useGruposAdicionaisFilters } from "./useGruposAdicionaisFilters";
import { useGruposAdicionaisModal, type ModalMode } from "./useGruposAdicionaisModal";

export interface UseGruposAdicionaisReturn {
	// Dados
	gruposAdicionais: ComputedRef<GrupoAdicionalComputado[]>;
	gruposAdicionaisRaw: Ref<GrupoAdicionalComputado[]>;
	totalGruposAdicionais: ComputedRef<number>;

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
		obrigatorio?: boolean;
		ordenacao?: "nome" | "ordem" | "created_at";
		direcao?: "asc" | "desc";
	}>;
	setSearch: (value: string) => void;
	setAtivo: (value: boolean | undefined) => void;
	setObrigatorio: (value: boolean | undefined) => void;
	setOrdenacao: (field: "nome" | "ordem" | "created_at", direcao: "asc" | "desc") => void;
	clearFilters: () => void;

	// Modal
	isModalOpen: Ref<boolean>;
	modalMode: Ref<ModalMode>;
	selectedGrupoAdicional: Ref<GrupoAdicional | null>;
	openCreate: () => void;
	openEdit: (grupo: GrupoAdicional) => void;
	openView: (grupo: GrupoAdicional) => void;
	closeModal: () => void;

	// Ações
	handleCreate: (data: GrupoAdicionalCreateData) => Promise<boolean>;
	handleUpdate: (id: string, data: GrupoAdicionalUpdateData) => Promise<boolean>;
	handleDelete: (id: string) => Promise<boolean>;
	handleToggleAtivo: (id: string, ativo: boolean) => Promise<boolean>;

	// Refresh
	refresh: () => Promise<void>;
	init: () => Promise<void>;
}

export const useGruposAdicionais = (): UseGruposAdicionaisReturn => {
	// Composables internos
	const fetchComposable = useGruposAdicionaisFetch();
	const actionsComposable = useGruposAdicionaisActions();
	const filtersComposable = useGruposAdicionaisFilters();
	const modalComposable = useGruposAdicionaisModal();

	// ========================================
	// DADOS FILTRADOS
	// ========================================

	const gruposAdicionais = computed(() => {
		return filtersComposable.applyFilters(fetchComposable.gruposAdicionais.value);
	});

	const totalGruposAdicionais = computed(() => fetchComposable.gruposAdicionais.value.length);

	// ========================================
	// HANDLERS DE AÇÕES
	// ========================================

	/**
	 * Criar grupo e atualizar lista
	 */
	const handleCreate = async (data: GrupoAdicionalCreateData): Promise<boolean> => {
		const id = await actionsComposable.create(data);

		if (id) {
			modalComposable.close();
			await fetchComposable.refresh();
			return true;
		}

		return false;
	};

	/**
	 * Atualizar grupo e atualizar lista
	 */
	const handleUpdate = async (id: string, data: GrupoAdicionalUpdateData): Promise<boolean> => {
		const success = await actionsComposable.update(id, data);

		if (success) {
			modalComposable.close();
			await fetchComposable.refresh();
			return true;
		}

		return false;
	};

	/**
	 * Excluir grupo e atualizar lista
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
		await fetchComposable.fetch();
	};

	// ========================================
	// RETORNO
	// ========================================

	return {
		// Dados
		gruposAdicionais,
		gruposAdicionaisRaw: fetchComposable.gruposAdicionais,
		totalGruposAdicionais,

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
		setObrigatorio: filtersComposable.setObrigatorio,
		setOrdenacao: filtersComposable.setOrdenacao,
		clearFilters: filtersComposable.clearFilters,

		// Modal
		isModalOpen: modalComposable.isOpen,
		modalMode: modalComposable.mode,
		selectedGrupoAdicional: modalComposable.selected,
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
