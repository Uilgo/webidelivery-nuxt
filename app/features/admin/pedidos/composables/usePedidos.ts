/**
 * 📌 usePedidos - Composable Orquestrador de Pedidos
 *
 * Unifica todos os composables de pedidos em uma API única:
 * - usePedidosFetch (listagem e polling)
 * - usePedidosActions (ações de status)
 * - usePedidosFilters (filtros)
 * - usePedidosDrawer (drawer de detalhes)
 */

import type {
	PedidoCompleto,
	StatusPedido,
	TipoEntregaPedido,
	FormaPagamentoPedido,
	FiltrosPedidos,
} from "~/features/admin/pedidos/types/pedidos-admin";
import { usePedidosFetch } from "./usePedidosFetch";
import { usePedidosActions } from "./usePedidosActions";
import { usePedidosFilters } from "./usePedidosFilters";
import { usePedidosDrawer } from "./usePedidosDrawer";

export interface UsePedidosReturn {
	// Dados
	pedidos: Ref<PedidoCompleto[]>;
	pedidosFiltrados: ComputedRef<PedidoCompleto[]>;
	pedidosPorStatus: ComputedRef<Record<string, PedidoCompleto[]>>;
	contadores: ComputedRef<Record<StatusPedido, number>>;

	// Estados
	loading: Ref<boolean>;
	error: Ref<string | null>;
	updating: Ref<Record<string, boolean>>;

	// Filtros
	filters: Ref<FiltrosPedidos>;
	setStatus: (value: StatusPedido | null) => void;
	setTipoEntrega: (value: TipoEntregaPedido | null) => void;
	setFormaPagamento: (value: FormaPagamentoPedido | null) => void;
	setDataInicio: (value: Date | null) => void;
	setDataFim: (value: Date | null) => void;
	setSearch: (value: string) => void;
	clearFilters: () => void;

	// Drawer
	isDrawerOpen: Ref<boolean>;
	selectedPedido: Ref<PedidoCompleto | null>;
	openDrawer: (pedido: PedidoCompleto) => void;
	closeDrawer: () => void;

	// Ações
	handleUpdateStatus: (
		pedidoId: string,
		novoStatus: StatusPedido,
		observacao?: string,
	) => Promise<boolean>;
	handleAccept: (pedidoId: string) => Promise<boolean>;
	handleStartPreparation: (pedidoId: string) => Promise<boolean>;
	handleMarkReady: (pedidoId: string) => Promise<boolean>;
	handleStartDelivery: (pedidoId: string) => Promise<boolean>;
	handleComplete: (pedidoId: string) => Promise<boolean>;
	handleCancel: (pedidoId: string, motivo: string) => Promise<boolean>;

	// Polling
	startPolling: (intervalMs?: number) => void;
	stopPolling: () => void;

	// Refresh
	refresh: () => Promise<void>;
	init: () => Promise<void>;
}

export const usePedidos = (): UsePedidosReturn => {
	// Composables internos
	const fetchComposable = usePedidosFetch();
	const actionsComposable = usePedidosActions();
	const filtersComposable = usePedidosFilters();
	const drawerComposable = usePedidosDrawer();

	// ========================================
	// DADOS FILTRADOS
	// ========================================

	/**
	 * Pedidos filtrados (client-side)
	 */
	const pedidosFiltrados = computed(() => {
		return filtersComposable.applyFilters(fetchComposable.pedidos.value);
	});

	/**
	 * Pedidos agrupados por status
	 */
	const pedidosPorStatus = computed(() => {
		return fetchComposable.pedidos.value.reduce(
			(acc, pedido) => {
				if (!acc[pedido.status]) {
					acc[pedido.status] = [];
				}
				const statusArray = acc[pedido.status];
				if (statusArray) {
					statusArray.push(pedido);
				}
				return acc;
			},
			{} as Record<string, PedidoCompleto[]>,
		);
	});

	/**
	 * Contadores por status
	 */
	const contadores = computed(() => {
		const counts: Record<StatusPedido, number> = {
			pendente: 0,
			aceito: 0,
			preparo: 0,
			pronto: 0,
			entrega: 0,
			concluido: 0,
			cancelado: 0,
		};

		fetchComposable.pedidos.value.forEach((p) => {
			counts[p.status]++;
		});

		return counts;
	});

	// ========================================
	// HANDLERS DE AÇÕES
	// ========================================

	/**
	 * Atualizar status e refresh
	 */
	const handleUpdateStatus = async (
		pedidoId: string,
		novoStatus: StatusPedido,
		observacao?: string,
	): Promise<boolean> => {
		const success = await actionsComposable.updateStatus(pedidoId, novoStatus, observacao);

		if (success) {
			await fetchComposable.refresh();
			return true;
		}

		return false;
	};

	/**
	 * Aceitar pedido
	 */
	const handleAccept = async (pedidoId: string): Promise<boolean> => {
		const success = await actionsComposable.accept(pedidoId);

		if (success) {
			await fetchComposable.refresh();
			return true;
		}

		return false;
	};

	/**
	 * Iniciar preparo
	 */
	const handleStartPreparation = async (pedidoId: string): Promise<boolean> => {
		const success = await actionsComposable.startPreparation(pedidoId);

		if (success) {
			await fetchComposable.refresh();
			return true;
		}

		return false;
	};

	/**
	 * Marcar como pronto
	 */
	const handleMarkReady = async (pedidoId: string): Promise<boolean> => {
		const success = await actionsComposable.markReady(pedidoId);

		if (success) {
			await fetchComposable.refresh();
			return true;
		}

		return false;
	};

	/**
	 * Saiu para entrega
	 */
	const handleStartDelivery = async (pedidoId: string): Promise<boolean> => {
		const success = await actionsComposable.startDelivery(pedidoId);

		if (success) {
			await fetchComposable.refresh();
			return true;
		}

		return false;
	};

	/**
	 * Concluir pedido
	 */
	const handleComplete = async (pedidoId: string): Promise<boolean> => {
		const success = await actionsComposable.complete(pedidoId);

		if (success) {
			await fetchComposable.refresh();
			return true;
		}

		return false;
	};

	/**
	 * Cancelar pedido
	 */
	const handleCancel = async (pedidoId: string, motivo: string): Promise<boolean> => {
		const success = await actionsComposable.cancel(pedidoId, motivo);

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
		pedidos: fetchComposable.pedidos,
		pedidosFiltrados,
		pedidosPorStatus,
		contadores,

		// Estados
		loading: fetchComposable.loading,
		error: fetchComposable.error,
		updating: actionsComposable.updating,

		// Filtros
		filters: filtersComposable.filters,
		setStatus: filtersComposable.setStatus,
		setTipoEntrega: filtersComposable.setTipoEntrega,
		setFormaPagamento: filtersComposable.setFormaPagamento,
		setDataInicio: filtersComposable.setDataInicio,
		setDataFim: filtersComposable.setDataFim,
		setSearch: filtersComposable.setSearch,
		clearFilters: filtersComposable.clearFilters,

		// Drawer
		isDrawerOpen: drawerComposable.isOpen,
		selectedPedido: drawerComposable.selected,
		openDrawer: drawerComposable.open,
		closeDrawer: drawerComposable.close,

		// Ações
		handleUpdateStatus,
		handleAccept,
		handleStartPreparation,
		handleMarkReady,
		handleStartDelivery,
		handleComplete,
		handleCancel,

		// Polling
		startPolling: fetchComposable.startPolling,
		stopPolling: fetchComposable.stopPolling,

		// Refresh
		refresh: fetchComposable.refresh,
		init,
	};
};
