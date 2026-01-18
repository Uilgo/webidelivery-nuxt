/**
 * 📌 usePedidosFilters - Filtros e Ordenação de Pedidos
 *
 * Responsável por:
 * - Aplicar filtros locais nos dados
 * - Busca por texto (número, cliente, telefone)
 * - Filtros por status, tipo de entrega, forma de pagamento, data
 */

import type {
	PedidoCompleto,
	FiltrosPedidos,
	StatusPedido,
	TipoEntregaPedido,
	FormaPagamentoPedido,
} from "~/features/admin/pedidos/types/pedidos-admin";

export interface UsePedidosFiltersReturn {
	filters: Ref<FiltrosPedidos>;
	setStatus: (value: StatusPedido | null) => void;
	setTipoEntrega: (value: TipoEntregaPedido | null) => void;
	setFormaPagamento: (value: FormaPagamentoPedido | null) => void;
	setDataInicio: (value: Date | null) => void;
	setDataFim: (value: Date | null) => void;
	setSearch: (value: string) => void;
	clearFilters: () => void;
	applyFilters: (pedidos: PedidoCompleto[]) => PedidoCompleto[];
}

export const usePedidosFilters = (): UsePedidosFiltersReturn => {
	// Estado dos filtros com cache
	const filters = useState<FiltrosPedidos>("admin-pedidos-filtros", () => ({
		status: null,
		data_inicio: null,
		data_fim: null,
		tipo_entrega: null,
		forma_pagamento: null,
		busca: "",
	}));

	/**
	 * Define filtro de status
	 */
	const setStatus = (value: StatusPedido | null): void => {
		filters.value.status = value;
	};

	/**
	 * Define filtro de tipo de entrega
	 */
	const setTipoEntrega = (value: TipoEntregaPedido | null): void => {
		filters.value.tipo_entrega = value;
	};

	/**
	 * Define filtro de forma de pagamento
	 */
	const setFormaPagamento = (value: FormaPagamentoPedido | null): void => {
		filters.value.forma_pagamento = value;
	};

	/**
	 * Define data de início
	 */
	const setDataInicio = (value: Date | null): void => {
		filters.value.data_inicio = value;
	};

	/**
	 * Define data fim
	 */
	const setDataFim = (value: Date | null): void => {
		filters.value.data_fim = value;
	};

	/**
	 * Define valor da busca
	 */
	const setSearch = (value: string): void => {
		filters.value.busca = value;
	};

	/**
	 * Limpa todos os filtros
	 */
	const clearFilters = (): void => {
		filters.value = {
			status: null,
			data_inicio: null,
			data_fim: null,
			tipo_entrega: null,
			forma_pagamento: null,
			busca: "",
		};
	};

	/**
	 * Aplica filtros em uma lista de pedidos
	 */
	const applyFilters = (pedidos: PedidoCompleto[]): PedidoCompleto[] => {
		let resultado = [...pedidos];

		// Filtrar por status se houver (null = todos)
		if (filters.value.status) {
			resultado = resultado.filter((p) => p.status === filters.value.status);
		}

		// Filtrar por tipo de entrega se houver
		if (filters.value.tipo_entrega) {
			resultado = resultado.filter((p) => p.tipo_entrega === filters.value.tipo_entrega);
		}

		// Filtrar por forma de pagamento se houver
		if (filters.value.forma_pagamento) {
			resultado = resultado.filter((p) => p.forma_pagamento === filters.value.forma_pagamento);
		}

		// Filtrar por data de início se houver
		if (filters.value.data_inicio) {
			const dataInicio = new Date(filters.value.data_inicio);
			dataInicio.setHours(0, 0, 0, 0);
			resultado = resultado.filter((p) => {
				const dataPedido = new Date(p.created_at);
				dataPedido.setHours(0, 0, 0, 0);
				return dataPedido >= dataInicio;
			});
		}

		// Filtrar por data fim se houver
		if (filters.value.data_fim) {
			const dataFim = new Date(filters.value.data_fim);
			dataFim.setHours(23, 59, 59, 999);
			resultado = resultado.filter((p) => {
				const dataPedido = new Date(p.created_at);
				return dataPedido <= dataFim;
			});
		}

		// Filtrar por busca se houver
		if (filters.value.busca) {
			const termo = filters.value.busca.toLowerCase();
			resultado = resultado.filter(
				(p) =>
					p.numero.toString().includes(termo) ||
					p.cliente_nome.toLowerCase().includes(termo) ||
					p.cliente_telefone.includes(termo),
			);
		}

		return resultado;
	};

	return {
		filters,
		setStatus,
		setTipoEntrega,
		setFormaPagamento,
		setDataInicio,
		setDataFim,
		setSearch,
		clearFilters,
		applyFilters,
	};
};
