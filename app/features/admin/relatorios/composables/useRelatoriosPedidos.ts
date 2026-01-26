/**
 * 📦 useRelatoriosPedidos
 *
 * Composable para gerenciar dados do relatório de pedidos:
 * - Busca dados de pedidos do Supabase
 * - Calcula KPIs (total, concluídos, cancelados, etc.)
 * - Prepara dados para gráficos
 * - Gerencia estado de loading e erros
 */

import type { RelatorioPedidos, PedidoDetalhado } from "../types/pedidos";
import type { FiltrosPeriodo, KpiBase, DadosGrafico } from "../types/relatorios";
import { calcularMedia } from "../utils/calculos";
import { agruparPorData, agruparPorHora } from "../utils/agregadores";
import { useRelatoriosFiltros } from "./useRelatoriosFiltros";

export const useRelatoriosPedidos = () => {
	const supabase = useSupabaseClient();
	const estabelecimentoStore = useEstabelecimentoStore();

	// Estado
	const dados = useState<RelatorioPedidos | null>("relatorios.pedidos.dados", () => null);
	const loading = useState<boolean>("relatorios.pedidos.loading", () => false);
	const error = useState<string | null>("relatorios.pedidos.error", () => null);

	/**
	 * Buscar dados de pedidos do período
	 */
	const fetchDados = async (filtros: FiltrosPeriodo, forceRefresh = false): Promise<void> => {
		// Se já tem dados e não é refresh forçado, não buscar novamente
		if (dados.value && !forceRefresh) {
			return;
		}

		try {
			loading.value = true;
			error.value = null;

			const estabelecimentoId = estabelecimentoStore.estabelecimento?.id;
			if (!estabelecimentoId) {
				throw new Error("Estabelecimento não encontrado");
			}

			// Buscar pedidos do período via RLS
			const { data: pedidos, error: pedidosError } = await supabase
				.from("pedidos")
				.select(
					`
          id,
          numero,
          codigo_rastreamento,
          created_at,
          status,
          tipo_entrega,
          total,
          subtotal,
          desconto,
          taxa_entrega,
          forma_pagamento,
          cliente_nome,
          cliente_telefone,
          aceito_em,
          preparo_em,
          pronto_em,
          entrega_em,
          concluido_em
        `,
				)
				.eq("estabelecimento_id", estabelecimentoId)
				.gte("created_at", filtros.data_inicio)
				.lte("created_at", filtros.data_fim)
				.order("created_at", { ascending: false });

			if (pedidosError) throw pedidosError;

			// Buscar dados do período anterior para comparação
			const diasDiferenca = Math.ceil(
				(new Date(filtros.data_fim).getTime() - new Date(filtros.data_inicio).getTime()) /
					(1000 * 60 * 60 * 24),
			);
			const dataInicioAnterior = new Date(
				new Date(filtros.data_inicio).getTime() - diasDiferenca * 24 * 60 * 60 * 1000,
			).toISOString();

			const { data: pedidosAnteriores } = await supabase
				.from("pedidos")
				.select("id, status")
				.eq("estabelecimento_id", estabelecimentoId)
				.gte("created_at", dataInicioAnterior)
				.lt("created_at", filtros.data_inicio);

			// Processar dados
			dados.value = processarDados(pedidos || [], pedidosAnteriores || []);
		} catch (err) {
			console.error("Erro ao buscar dados de pedidos:", err);
			error.value = err instanceof Error ? err.message : "Erro desconhecido";
			dados.value = null;
		} finally {
			loading.value = false;
		}
	};

	/**
	 * Calcular variação percentual
	 */
	const calcularVariacao = (atual: number, anterior: number): number => {
		if (anterior === 0) return atual > 0 ? 100 : 0;
		return ((atual - anterior) / anterior) * 100;
	};

	/**
	 * Formatar tempo em minutos
	 */
	const formatarTempo = (minutos: number): string => {
		if (minutos < 60) return `${Math.round(minutos)}min`;
		const horas = Math.floor(minutos / 60);
		const mins = Math.round(minutos % 60);
		return `${horas}h ${mins}min`;
	};

	/**
	 * Processar dados brutos em formato de relatório
	 */
	const processarDados = (
		pedidos: Array<Record<string, unknown>>,
		pedidosAnteriores: Array<Record<string, unknown>>,
	): RelatorioPedidos => {
		// Calcular totais
		const totalPedidos = pedidos.length;
		const totalPedidosAnteriores = pedidosAnteriores.length;

		const pedidosConcluidos = pedidos.filter((p) => p.status === "concluido").length;
		const pedidosConcluidosAnteriores = pedidosAnteriores.filter(
			(p) => p.status === "concluido",
		).length;

		const pedidosCancelados = pedidos.filter((p) => p.status === "cancelado").length;
		const pedidosCanceladosAnteriores = pedidosAnteriores.filter(
			(p) => p.status === "cancelado",
		).length;

		const taxaCancelamento = totalPedidos > 0 ? (pedidosCancelados / totalPedidos) * 100 : 0;
		const taxaCancelamentoAnterior =
			totalPedidosAnteriores > 0 ? (pedidosCanceladosAnteriores / totalPedidosAnteriores) * 100 : 0;

		// Calcular tempos médios (baseado nos timestamps)
		const pedidosComTempoPreparo = pedidos.filter((p) => p.aceito_em && p.pronto_em);
		const temposMedioPreparo = pedidosComTempoPreparo.map((p) => {
			const inicio = new Date(p.aceito_em as string).getTime();
			const fim = new Date(p.pronto_em as string).getTime();
			return (fim - inicio) / (1000 * 60); // Converter para minutos
		});
		const tempoMedioPreparo = calcularMedia(temposMedioPreparo);

		const pedidosComTempoEntrega = pedidos.filter(
			(p) => p.pronto_em && p.concluido_em && p.tipo_entrega === "delivery",
		);
		const temposMedioEntrega = pedidosComTempoEntrega.map((p) => {
			const inicio = new Date(p.pronto_em as string).getTime();
			const fim = new Date(p.concluido_em as string).getTime();
			return (fim - inicio) / (1000 * 60); // Converter para minutos
		});
		const tempoMedioEntrega = calcularMedia(temposMedioEntrega);

		// Montar KPIs
		const kpis = {
			total_pedidos: {
				titulo: "Total de Pedidos",
				valor: totalPedidos,
				variacao: calcularVariacao(totalPedidos, totalPedidosAnteriores),
				variacao_tipo: totalPedidos >= totalPedidosAnteriores ? "aumento" : "reducao",
				icone: "lucide:shopping-bag",
				cor: "blue",
				formato: "numero",
			} as KpiBase,

			pedidos_concluidos: {
				titulo: "Pedidos Concluídos",
				valor: pedidosConcluidos,
				variacao: calcularVariacao(pedidosConcluidos, pedidosConcluidosAnteriores),
				variacao_tipo: pedidosConcluidos >= pedidosConcluidosAnteriores ? "aumento" : "reducao",
				icone: "lucide:check-circle",
				cor: "green",
				formato: "numero",
			} as KpiBase,

			pedidos_cancelados: {
				titulo: "Pedidos Cancelados",
				valor: pedidosCancelados,
				variacao: calcularVariacao(pedidosCancelados, pedidosCanceladosAnteriores),
				variacao_tipo: pedidosCancelados <= pedidosCanceladosAnteriores ? "aumento" : "reducao",
				icone: "lucide:x-circle",
				cor: "red",
				formato: "numero",
			} as KpiBase,

			taxa_cancelamento: {
				titulo: "Taxa de Cancelamento",
				valor: `${taxaCancelamento.toFixed(1)}%`,
				variacao: calcularVariacao(taxaCancelamento, taxaCancelamentoAnterior),
				variacao_tipo: taxaCancelamento <= taxaCancelamentoAnterior ? "aumento" : "reducao",
				icone: "lucide:percent",
				cor: "orange",
				formato: "percentual",
			} as KpiBase,

			tempo_medio_preparo: {
				titulo: "Tempo Médio de Preparo",
				valor: formatarTempo(tempoMedioPreparo),
				icone: "lucide:clock",
				cor: "purple",
				formato: "tempo",
			} as KpiBase,

			tempo_medio_entrega: {
				titulo: "Tempo Médio de Entrega",
				valor: formatarTempo(tempoMedioEntrega),
				icone: "lucide:truck",
				cor: "indigo",
				formato: "tempo",
			} as KpiBase,
		};

		// Preparar gráficos
		const graficos = {
			pedidos_por_dia: prepararGraficoPorDia(pedidos),
			pedidos_por_status: prepararGraficoPorStatus(pedidos),
			pedidos_por_hora: prepararGraficoPorHora(pedidos),
			pedidos_por_tipo_entrega: prepararGraficoPorTipoEntrega(pedidos),
		};

		// Preparar tabela
		const tabela = prepararTabelaDetalhada(pedidos);

		// Calcular receita total e ticket médio
		const receitaTotal = pedidos.reduce((acc, p) => acc + ((p.total as number) || 0), 0);
		const ticketMedio = totalPedidos > 0 ? receitaTotal / totalPedidos : 0;

		// Agrupar pedidos por status
		const pedidosPorStatus: Record<string, number> = {};
		pedidos.forEach((p) => {
			const status = p.status as string;
			pedidosPorStatus[status] = (pedidosPorStatus[status] || 0) + 1;
		});

		// Agrupar pedidos por tipo de entrega
		const pedidosPorTipoEntrega: Record<string, number> = {};
		pedidos.forEach((p) => {
			const tipo = p.tipo_entrega as string;
			pedidosPorTipoEntrega[tipo] = (pedidosPorTipoEntrega[tipo] || 0) + 1;
		});

		return {
			kpis,
			graficos,
			tabela,
			resumo: {
				total_pedidos: totalPedidos,
				pedidos_por_status: pedidosPorStatus,
				pedidos_por_tipo_entrega: pedidosPorTipoEntrega,
				pedidos_por_forma_pagamento: {},
				receita_total: receitaTotal,
				ticket_medio: ticketMedio,
				tempo_medio_preparo: tempoMedioPreparo,
				tempo_medio_entrega: tempoMedioEntrega,
				taxa_cancelamento: taxaCancelamento,
			},
		};
	};

	/**
	 * Preparar gráfico de pedidos por dia
	 */
	const prepararGraficoPorDia = (pedidos: Array<Record<string, unknown>>): DadosGrafico => {
		const agrupados = agruparPorData(pedidos, "created_at");

		return {
			labels: Object.keys(agrupados),
			datasets: [
				{
					label: "Pedidos",
					data: Object.values(agrupados).map((grupo) => grupo.length),
					borderColor: "#3b82f6",
					backgroundColor: "#3b82f633",
					fill: true,
				},
			],
		};
	};

	/**
	 * Preparar gráfico de pedidos por status
	 */
	const prepararGraficoPorStatus = (pedidos: Array<Record<string, unknown>>): DadosGrafico => {
		const statusCount: Record<string, number> = {};

		pedidos.forEach((pedido) => {
			const status = pedido.status as string;
			statusCount[status] = (statusCount[status] || 0) + 1;
		});

		const statusLabels: Record<string, string> = {
			pendente: "Pendente",
			aceito: "Aceito",
			preparo: "Em Preparo",
			pronto: "Pronto",
			entrega: "Em Entrega",
			concluido: "Concluído",
			cancelado: "Cancelado",
		};

		return {
			labels: Object.keys(statusCount).map((s) => statusLabels[s] || s),
			datasets: [
				{
					label: "Pedidos por Status",
					data: Object.values(statusCount),
					backgroundColor: [
						"#fbbf24", // pendente - yellow
						"#60a5fa", // aceito - blue
						"#a78bfa", // preparo - purple
						"#34d399", // pronto - green
						"#fb923c", // entrega - orange
						"#10b981", // concluido - green
						"#ef4444", // cancelado - red
					],
				},
			],
		};
	};

	/**
	 * Preparar gráfico de pedidos por hora
	 */
	const prepararGraficoPorHora = (pedidos: Array<Record<string, unknown>>): DadosGrafico => {
		const agrupados = agruparPorHora(pedidos, "created_at");

		return {
			labels: Object.keys(agrupados).map((h) => `${h}h`),
			datasets: [
				{
					label: "Pedidos por Hora",
					data: Object.values(agrupados).map((grupo) => grupo.length),
					backgroundColor: "#3b82f6",
				},
			],
		};
	};

	/**
	 * Preparar gráfico de pedidos por tipo de entrega
	 */
	const prepararGraficoPorTipoEntrega = (pedidos: Array<Record<string, unknown>>): DadosGrafico => {
		const tipoCount: Record<string, number> = {};

		pedidos.forEach((pedido) => {
			const tipo = pedido.tipo_entrega as string;
			tipoCount[tipo] = (tipoCount[tipo] || 0) + 1;
		});

		const tipoLabels: Record<string, string> = {
			delivery: "Delivery",
			retirada: "Retirada",
		};

		return {
			labels: Object.keys(tipoCount).map((t) => tipoLabels[t] || t),
			datasets: [
				{
					label: "Pedidos por Tipo",
					data: Object.values(tipoCount),
					backgroundColor: ["#3b82f6", "#10b981"],
				},
			],
		};
	};

	/**
	 * Preparar tabela detalhada
	 */
	const prepararTabelaDetalhada = (
		pedidos: Array<Record<string, unknown>>,
	): readonly PedidoDetalhado[] => {
		return pedidos.map((pedido) => {
			// Calcular tempo de preparo (aceito_em → pronto_em)
			let tempoPreparo = 0;
			if (pedido.aceito_em && pedido.pronto_em) {
				const inicio = new Date(pedido.aceito_em as string).getTime();
				const fim = new Date(pedido.pronto_em as string).getTime();
				tempoPreparo = (fim - inicio) / (1000 * 60); // Minutos
			}

			// Calcular tempo de entrega (pronto_em → concluido_em, apenas delivery)
			let tempoEntrega: number | undefined;
			if (pedido.tipo_entrega === "delivery" && pedido.pronto_em && pedido.concluido_em) {
				const inicio = new Date(pedido.pronto_em as string).getTime();
				const fim = new Date(pedido.concluido_em as string).getTime();
				tempoEntrega = (fim - inicio) / (1000 * 60); // Minutos
			}

			return {
				id: pedido.id as string,
				numero: pedido.numero as number,
				codigo_rastreamento: pedido.codigo_rastreamento as string,
				created_at: pedido.created_at as string,
				cliente_nome: pedido.cliente_nome as string,
				cliente_telefone: pedido.cliente_telefone as string,
				status: pedido.status as string,
				tipo_entrega: pedido.tipo_entrega as string,
				forma_pagamento: (pedido.forma_pagamento as string) || "pix",
				subtotal: pedido.subtotal as number,
				taxa_entrega: (pedido.taxa_entrega as number) || 0,
				desconto: (pedido.desconto as number) || 0,
				total: pedido.total as number,
				tempo_preparo: tempoPreparo,
				tempo_entrega: tempoEntrega,
			};
		});
	};

	/**
	 * Refresh dos dados (força nova busca)
	 */
	const refresh = async (): Promise<void> => {
		const filtros = useRelatoriosFiltros();
		await fetchDados(filtros.periodo.value, true);
	};

	return {
		dados: readonly(dados),
		loading: readonly(loading),
		error: readonly(error),
		fetchDados,
		refresh,
	};
};
