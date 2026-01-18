/**
 * 📌 useCombos (Orquestrador)
 *
 * Composable principal que importa e unifica todos os outros composables.
 * Retorna estado e métodos de forma organizada.
 */

import { useCombosFetch } from "./useCombosFetch";
import { useCombosActions } from "./useCombosActions";
import { useCombosFilters } from "./useCombosFilters";
import { useCombosModal } from "./useCombosModal";

export const useCombos = () => {
	// Importar composables
	const { combos: combosRaw, isLoading, error, fetchCombos, refresh, init } = useCombosFetch();
	const { createCombo, updateCombo, deleteCombo, toggleStatus, reorderCombos } = useCombosActions();
	const { filters, setSearch, setOrdenacao, setAtivo, setDestaque, applyFilters } =
		useCombosFilters();
	const { isModalOpen, modalMode, selectedCombo, openCreate, openEdit, openView, closeModal } =
		useCombosModal();

	// Combos filtrados
	const combos = computed(() => applyFilters(combosRaw.value));

	// Contadores
	const counts = computed(() => ({
		total: combosRaw.value.length,
		ativos: combosRaw.value.filter((c) => c.ativo).length,
		inativos: combosRaw.value.filter((c) => !c.ativo).length,
		destaque: combosRaw.value.filter((c) => c.destaque).length,
	}));

	return {
		// Estado
		combos,
		allCombos: combosRaw,
		isLoading,
		error,
		counts,

		// Fetch
		fetchCombos,
		refresh,
		init,

		// Actions
		createCombo,
		updateCombo,
		deleteCombo,
		toggleStatus,
		reorderCombos,

		// Filtros
		filters,
		setSearch,
		setOrdenacao,
		setAtivo,
		setDestaque,

		// Modal
		isModalOpen,
		modalMode,
		selectedCombo,
		openCreate,
		openEdit,
		openView,
		closeModal,
	};
};
