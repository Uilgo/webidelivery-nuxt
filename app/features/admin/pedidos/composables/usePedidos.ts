/**
 * 📌 usePedidos
 *
 * Composable para buscar e gerenciar pedidos no painel admin.
 * Leitura com RLS (chamadas diretas).
 */

import type { PedidoCompleto, FiltrosPedidos } from "~/features/admin/pedidos/types/pedidos-admin";

export const usePedidos = () => {
	const supabase = useSupabaseClient();

	/**
	 * Estado dos pedidos com cache persistente (useState)
	 * IMPORTANTE: useState mantém o estado durante toda a sessão do app
	 */
	const pedidos = useState<PedidoCompleto[]>("admin-pedidos", () => []);
	const loading = useState<boolean>("admin-pedidos-loading", () => false);
	const erro = useState<string | null>("admin-pedidos-erro", () => null);
	const cacheLoaded = useState<boolean>("admin-pedidos-cache-loaded", () => false);

	/**
	 * Filtros aplicados com cache
	 */
	const filtros = useState<FiltrosPedidos>("admin-pedidos-filtros", () => ({
		status: null,
		data_inicio: null,
		data_fim: null,
		tipo_entrega: null,
		forma_pagamento: null,
		busca: "",
	}));

	/**
	 * Buscar pedidos com RLS
	 * RLS garante que só vê pedidos do seu estabelecimento
	 *
	 * IMPORTANTE: Busca TODOS os pedidos e filtra no client-side
	 * para manter o cache completo e evitar perda de dados ao trocar tabs
	 */
	const buscarPedidos = async () => {
		loading.value = true;
		erro.value = null;

		try {
			const query = supabase
				.from("pedidos")
				.select(
					`
          *,
          itens:pedido_itens(
            *,
            adicionais:pedido_itens_adicionais(*)
          )
        `,
				)
				.order("created_at", { ascending: false });

			// NÃO aplicar filtros aqui - buscar TODOS os pedidos
			// Os filtros são aplicados no client-side via computed pedidosFiltrados

			const { data, error } = await query;

			if (error) {
				throw error;
			}

			pedidos.value = (data || []) as PedidoCompleto[];
		} catch (err) {
			erro.value = "Erro ao buscar pedidos";
			console.error(err);
		} finally {
			loading.value = false;
		}
	};

	/**
	 * Pedidos agrupados por status
	 */
	const pedidosPorStatus = computed(() => {
		return pedidos.value.reduce(
			(acc, pedido) => {
				if (!acc[pedido.status]) {
					acc[pedido.status] = [];
				}
				// Garantir que o array existe antes de fazer push
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
	 * Pedidos filtrados (client-side)
	 * Aplica filtros sobre os dados já carregados
	 */
	const pedidosFiltrados = computed(() => {
		let resultado = pedidos.value;

		// Filtrar por status se houver (null = todos)
		if (filtros.value.status) {
			resultado = resultado.filter((p) => p.status === filtros.value.status);
		}

		// Filtrar por tipo de entrega se houver
		if (filtros.value.tipo_entrega) {
			resultado = resultado.filter((p) => p.tipo_entrega === filtros.value.tipo_entrega);
		}

		// Filtrar por forma de pagamento se houver
		if (filtros.value.forma_pagamento) {
			resultado = resultado.filter((p) => p.forma_pagamento === filtros.value.forma_pagamento);
		}

		// Filtrar por data de início se houver
		if (filtros.value.data_inicio) {
			const dataInicio = new Date(filtros.value.data_inicio);
			dataInicio.setHours(0, 0, 0, 0);
			resultado = resultado.filter((p) => {
				const dataPedido = new Date(p.created_at);
				dataPedido.setHours(0, 0, 0, 0);
				return dataPedido >= dataInicio;
			});
		}

		// Filtrar por data fim se houver
		if (filtros.value.data_fim) {
			const dataFim = new Date(filtros.value.data_fim);
			dataFim.setHours(23, 59, 59, 999);
			resultado = resultado.filter((p) => {
				const dataPedido = new Date(p.created_at);
				return dataPedido <= dataFim;
			});
		}

		// Filtrar por busca se houver
		if (filtros.value.busca) {
			const termo = filtros.value.busca.toLowerCase();
			resultado = resultado.filter(
				(p) =>
					p.numero.toString().includes(termo) ||
					p.cliente_nome.toLowerCase().includes(termo) ||
					p.cliente_telefone.includes(termo),
			);
		}

		return resultado;
	});

	/**
	 * Contadores por status
	 */
	const contadores = computed(() => {
		const counts = {
			pendente: 0,
			aceito: 0,
			preparo: 0,
			pronto: 0,
			entrega: 0,
			concluido: 0,
			cancelado: 0,
		};

		pedidos.value.forEach((p) => {
			counts[p.status]++;
		});

		return counts;
	});

	/**
	 * Aplicar preset de data
	 */
	const aplicarPresetData = (preset: "hoje" | "ontem" | "ultimos_7_dias" | "custom") => {
		const hoje = new Date();
		hoje.setHours(0, 0, 0, 0);

		switch (preset) {
			case "hoje": {
				filtros.value.data_inicio = hoje;
				filtros.value.data_fim = hoje;
				break;
			}

			case "ontem": {
				const ontem = new Date(hoje);
				ontem.setDate(ontem.getDate() - 1);
				filtros.value.data_inicio = ontem;
				filtros.value.data_fim = ontem;
				break;
			}

			case "ultimos_7_dias": {
				const seteDiasAtras = new Date(hoje);
				seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);
				filtros.value.data_inicio = seteDiasAtras;
				filtros.value.data_fim = hoje;
				break;
			}

			case "custom": {
				// Não faz nada, usuário define manualmente
				break;
			}
		}
	};

	/**
	 * Limpar filtros
	 */
	const limparFiltros = () => {
		filtros.value = {
			status: null,
			data_inicio: null,
			data_fim: null,
			tipo_entrega: null,
			forma_pagamento: null,
			busca: "",
		};
	};

	return {
		pedidos,
		loading,
		erro,
		filtros,
		cacheLoaded,
		buscarPedidos,
		pedidosPorStatus,
		pedidosFiltrados,
		contadores,
		aplicarPresetData,
		limparFiltros,
	};
};
