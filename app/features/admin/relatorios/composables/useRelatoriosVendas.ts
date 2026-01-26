/**
 * 💰 useRelatoriosVendas
 *
 * Composable para gerenciar dados do relatório de vendas:
 * - Busca dados de vendas do Supabase
 * - Calcula KPIs (receita, ticket médio, crescimento)
 * - Prepara dados para gráficos
 * - Gerencia estado de loading e erros
 */

import type { RelatorioVendas, VendaDetalhada } from "../types/vendas";
import type { FiltrosPeriodo, KpiBase, DadosGrafico } from "../types/relatorios";
import { agruparPorData } from "../utils/agregadores";
import { useRelatoriosFiltros } from "./useRelatoriosFiltros";

export const useRelatoriosVendas = () => {
	const supabase = useSupabaseClient();
	const estabelecimentoStore = useEstabelecimentoStore();

	// Estado
	const dados = useState<RelatorioVendas | null>("relatorios.vendas.dados", () => null);
	const loading = useState<boolean>("relatorios.vendas.loading", () => false);
	const error = useState<string | null>("relatorios.vendas.error", () => null);

	/**
	 * Calcular variação percentual
	 */
	const calcularVariacao = (atual: number, anterior: number): number => {
		if (anterior === 0) return atual > 0 ? 100 : 0;
		return ((atual - anterior) / anterior) * 100;
	};

	/**
	 * Buscar dados de vendas do período
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

			// Buscar pedidos concluídos do período
			const { data: pedidos, error: pedidosError } = await supabase
				.from("pedidos")
				.select(
					`
          id,
          numero,
          codigo_rastreamento,
          created_at,
          total,
          subtotal,
          desconto,
          taxa_entrega,
          status,
          tipo_entrega,
          forma_pagamento,
          cliente_nome,
          cliente_telefone
        `,
				)
				.eq("estabelecimento_id", estabelecimentoId)
				.eq("status", "concluido")
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
				.select("id, total, subtotal, desconto, taxa_entrega")
				.eq("estabelecimento_id", estabelecimentoId)
				.eq("status", "concluido")
				.gte("created_at", dataInicioAnterior)
				.lt("created_at", filtros.data_inicio);

			// Processar dados
			dados.value = processarDados(pedidos || [], pedidosAnteriores || []);
		} catch (err) {
			console.error("Erro ao buscar dados de vendas:", err);
			error.value = err instanceof Error ? err.message : "Erro desconhecido";
			dados.value = null;
		} finally {
			loading.value = false;
		}
	};

	/**
	 * Processar dados brutos em formato de relatório
	 */
	const processarDados = (
		pedidos: Array<Record<string, unknown>>,
		pedidosAnteriores: Array<Record<string, unknown>>,
	): RelatorioVendas => {
		// Calcular receitas
		const receitaTotal = pedidos.reduce((acc, p) => acc + ((p.total as number) || 0), 0);
		const descontos = pedidos.reduce((acc, p) => acc + ((p.desconto as number) || 0), 0);
		const receitaLiquida = receitaTotal - descontos;

		const receitaTotalAnterior = pedidosAnteriores.reduce(
			(acc, p) => acc + ((p.total as number) || 0),
			0,
		);
		const receitaLiquidaAnterior =
			receitaTotalAnterior -
			pedidosAnteriores.reduce((acc, p) => acc + ((p.desconto as number) || 0), 0);

		// Calcular ticket médio
		const totalTransacoes = pedidos.length;
		const ticketMedio = totalTransacoes > 0 ? receitaTotal / totalTransacoes : 0;

		const totalTransacoesAnteriores = pedidosAnteriores.length;
		const ticketMedioAnterior =
			totalTransacoesAnteriores > 0 ? receitaTotalAnterior / totalTransacoesAnteriores : 0;

		// Calcular crescimento mensal (simplificado)
		const crescimentoMensal = calcularVariacao(receitaTotal, receitaTotalAnterior);

		// Montar KPIs
		const kpis = {
			receita_bruta: {
				titulo: "Receita Bruta",
				valor: receitaTotal,
				variacao: calcularVariacao(receitaTotal, receitaTotalAnterior),
				variacao_tipo: receitaTotal >= receitaTotalAnterior ? "aumento" : "reducao",
				icone: "lucide:dollar-sign",
				cor: "#10b981",
				formato: "moeda",
			} as KpiBase,

			receita_total: {
				titulo: "Receita Total",
				valor: receitaTotal,
				variacao: calcularVariacao(receitaTotal, receitaTotalAnterior),
				variacao_tipo: receitaTotal >= receitaTotalAnterior ? "aumento" : "reducao",
				icone: "lucide:dollar-sign",
				cor: "#10b981",
				formato: "moeda",
			} as KpiBase,

			receita_liquida: {
				titulo: "Receita Líquida",
				valor: receitaLiquida,
				variacao: calcularVariacao(receitaLiquida, receitaLiquidaAnterior),
				variacao_tipo: receitaLiquida >= receitaLiquidaAnterior ? "aumento" : "reducao",
				icone: "lucide:trending-up",
				cor: "#3b82f6",
				formato: "moeda",
			} as KpiBase,

			ticket_medio: {
				titulo: "Ticket Médio",
				valor: ticketMedio,
				variacao: calcularVariacao(ticketMedio, ticketMedioAnterior),
				variacao_tipo: ticketMedio >= ticketMedioAnterior ? "aumento" : "reducao",
				icone: "lucide:shopping-cart",
				cor: "#f59e0b",
				formato: "moeda",
			} as KpiBase,

			total_transacoes: {
				titulo: "Total de Transações",
				valor: totalTransacoes,
				variacao: calcularVariacao(totalTransacoes, totalTransacoesAnteriores),
				variacao_tipo: totalTransacoes >= totalTransacoesAnteriores ? "aumento" : "reducao",
				icone: "lucide:credit-card",
				cor: "#8b5cf6",
				formato: "numero",
			} as KpiBase,

			crescimento_mensal: {
				titulo: "Crescimento",
				valor: `${crescimentoMensal.toFixed(1)}%`,
				variacao: crescimentoMensal,
				variacao_tipo: crescimentoMensal >= 0 ? "aumento" : "reducao",
				icone: "lucide:bar-chart",
				cor: "#ec4899",
				formato: "percentual",
			} as KpiBase,
		};

		// Preparar gráficos
		const graficos = {
			faturamento_diario: prepararGraficoFaturamentoDiario(pedidos),
			faturamento_por_categoria: prepararGraficoFaturamentoPorCategoria(pedidos),
			faturamento_por_forma_pagamento: prepararGraficoComparativoMensal(pedidos, pedidosAnteriores),
			comparativo_mensal: prepararGraficoComparativoMensal(pedidos, pedidosAnteriores),
		};

		// Preparar comparativo
		const comparativo = {
			periodo_atual: receitaTotal,
			periodo_anterior: receitaTotalAnterior,
			variacao: receitaTotal - receitaTotalAnterior,
			variacao_percentual: calcularVariacao(receitaTotal, receitaTotalAnterior),
			variacao_tipo:
				receitaTotal >= receitaTotalAnterior ? ("aumento" as const) : ("reducao" as const),
		};

		// Preparar tabela
		const tabela = prepararTabelaDetalhada(pedidos);

		return {
			kpis,
			graficos,
			comparativo,
			tabela,
			resumo: {
				receita_bruta: receitaTotal,
				receita_liquida: receitaLiquida,
				total_descontos: descontos,
				total_taxas_entrega: pedidos.reduce((acc, p) => acc + ((p.taxa_entrega as number) || 0), 0),
				ticket_medio: ticketMedio,
				total_transacoes: totalTransacoes,
				vendas_por_forma_pagamento: {},
				vendas_por_categoria: {},
			},
		};
	};

	/**
	 * Preparar gráfico de faturamento diário
	 */
	const prepararGraficoFaturamentoDiario = (
		pedidos: Array<Record<string, unknown>>,
	): DadosGrafico => {
		const agrupados = agruparPorData(pedidos, "created_at");

		const faturamentoPorDia: Record<string, number> = {};
		Object.entries(agrupados).forEach(([data, pedidosDia]) => {
			faturamentoPorDia[data] = pedidosDia.reduce((acc, p) => acc + ((p.total as number) || 0), 0);
		});

		return {
			labels: Object.keys(faturamentoPorDia),
			datasets: [
				{
					label: "Faturamento",
					data: Object.values(faturamentoPorDia),
					borderColor: "#10b981",
					backgroundColor: "#10b98133",
					fill: true,
				},
			],
		};
	};

	/**
	 * Preparar gráfico de faturamento por categoria
	 * NOTA: Simplificado pois não temos join com itens_pedido na query
	 */
	const prepararGraficoFaturamentoPorCategoria = (
		_pedidos: Array<Record<string, unknown>>,
	): DadosGrafico => {
		// Por enquanto, retornar gráfico vazio
		// TODO: Implementar query separada para buscar itens com categorias
		return {
			labels: ["Sem dados"],
			datasets: [
				{
					label: "Faturamento por Categoria",
					data: [0],
					backgroundColor: ["#94a3b8"],
				},
			],
		};
	};

	/**
	 * Preparar gráfico comparativo mensal
	 */
	const prepararGraficoComparativoMensal = (
		pedidos: Array<Record<string, unknown>>,
		pedidosAnteriores: Array<Record<string, unknown>>,
	): DadosGrafico => {
		const receitaAtual = pedidos.reduce((acc, p) => acc + ((p.total as number) || 0), 0);
		const receitaAnterior = pedidosAnteriores.reduce(
			(acc, p) => acc + ((p.total as number) || 0),
			0,
		);

		return {
			labels: ["Período Anterior", "Período Atual"],
			datasets: [
				{
					label: "Receita",
					data: [receitaAnterior, receitaAtual],
					backgroundColor: ["#94a3b8", "#10b981"],
				},
			],
		};
	};

	/**
	 * Preparar tabela detalhada
	 */
	const prepararTabelaDetalhada = (
		pedidos: Array<Record<string, unknown>>,
	): readonly VendaDetalhada[] => {
		return pedidos.map((pedido) => ({
			id: pedido.id as string,
			numero: pedido.numero as number,
			data: pedido.created_at as string,
			cliente_nome: pedido.cliente_nome as string,
			subtotal: pedido.subtotal as number,
			desconto: (pedido.desconto as number) || 0,
			taxa_entrega: (pedido.taxa_entrega as number) || 0,
			total: pedido.total as number,
			forma_pagamento: (pedido.forma_pagamento as string) || "pix",
			tipo_entrega: (pedido.tipo_entrega as string) || "delivery",
			status: "concluido",
			itens_count: 0, // TODO: Buscar contagem de itens separadamente se necessário
		}));
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
