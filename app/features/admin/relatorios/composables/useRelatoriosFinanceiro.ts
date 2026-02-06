/**
 * 💰 useRelatoriosFinanceiro
 *
 * Composable para gerenciar dados do relatório financeiro.
 * Busca e processa informações sobre:
 * - Receita bruta e líquida
 * - Descontos e taxas
 * - Métodos de pagamento
 * - Fluxo de caixa
 */

import type { RelatorioFinanceiro } from "../types/financeiro";
import type { FiltrosPeriodo } from "../types/relatorios";
import { formatCurrency } from "~/lib/formatters/currency";
import { useRelatoriosFiltros } from "./useRelatoriosFiltros";

export const useRelatoriosFinanceiro = () => {
	// Estado reativo
	const dados = useState<RelatorioFinanceiro | null>("relatorios.financeiro.dados", () => null);
	const loading = useState<boolean>("relatorios.financeiro.loading", () => false);
	const error = useState<string | null>("relatorios.financeiro.error", () => null);
	const watchAtivo = useState<boolean>("relatorios.financeiro.watchAtivo", () => false);

	const supabase = useSupabaseClient();
	const estabelecimentoStore = useEstabelecimentoStore();
	const { periodo } = useRelatoriosFiltros();

	/**
	 * Busca dados do relatório financeiro
	 */
	const fetchDados = async (filtros: FiltrosPeriodo): Promise<void> => {
		loading.value = true;
		error.value = null;

		try {
			const estabelecimentoId = estabelecimentoStore.estabelecimento?.id;
			if (!estabelecimentoId) {
				throw new Error("Estabelecimento não encontrado");
			}

			// Buscar pedidos concluídos com dados financeiros
			const { data: pedidos, error: pedidosError } = await supabase
				.from("pedidos")
				.select(
					`
          id,
          numero,
          created_at,
          subtotal,
          desconto,
          taxa_entrega,
          total,
          forma_pagamento,
          status
        `,
				)
				.eq("estabelecimento_id", estabelecimentoId)
				.eq("status", "concluido")
				.gte("created_at", filtros.data_inicio)
				.lte("created_at", filtros.data_fim)
				.order("created_at", { ascending: false });

			if (pedidosError) throw pedidosError;

			// Se não houver pedidos, retornar estrutura vazia
			if (!pedidos || pedidos.length === 0) {
				dados.value = {
					kpis: calcularKpis([]),
					metodos_pagamento: calcularMetodosPagamento([]),
					graficos: prepararGraficos([]),
					tabela: [],
					resumo: calcularResumo([]),
				};
				return;
			}

			// Processar dados
			const kpis = calcularKpis(pedidos);
			const metodosPagamento = calcularMetodosPagamento(pedidos);
			const graficos = prepararGraficos(pedidos);
			const tabela = prepararTabela(pedidos);
			const resumo = calcularResumo(pedidos);

			dados.value = {
				kpis,
				metodos_pagamento: metodosPagamento,
				graficos,
				tabela,
				resumo,
			};
		} catch (err) {
			console.error("Erro ao buscar dados financeiros:", err);
			error.value = err instanceof Error ? err.message : "Erro desconhecido";

			// Garantir que dados seja null em caso de erro
			dados.value = null;
		} finally {
			loading.value = false;
		}
	};

	/**
	 * Calcula KPIs do relatório
	 */
	const calcularKpis = (pedidos: unknown[]): RelatorioFinanceiro["kpis"] => {
		const receitaBruta = pedidos.reduce(
			(acc, pedido) => (acc as number) + ((pedido as Record<string, unknown>).subtotal as number),
			0 as number,
		) as number;

		const descontos = pedidos.reduce(
			(acc, pedido) => (acc as number) + ((pedido as Record<string, unknown>).desconto as number),
			0 as number,
		) as number;

		const taxasEntrega = pedidos.reduce(
			(acc, pedido) =>
				(acc as number) + (((pedido as Record<string, unknown>).taxa_entrega as number) || 0),
			0 as number,
		) as number;

		const receitaLiquida = pedidos.reduce(
			(acc, pedido) => (acc as number) + ((pedido as Record<string, unknown>).total as number),
			0 as number,
		) as number;

		// Lucro estimado (receita líquida - taxas estimadas de 5%)
		const taxasEstimadas = receitaLiquida * 0.05;
		const lucro = receitaLiquida - taxasEstimadas;

		return {
			receita_bruta: {
				titulo: "Receita Bruta",
				valor: formatCurrency(receitaBruta),
				icone: "lucide:dollar-sign",
				cor: "blue",
				formato: "moeda",
				descricao: "Receita total antes de descontos",
			},
			receita_liquida: {
				titulo: "Receita Líquida",
				valor: formatCurrency(receitaLiquida),
				icone: "lucide:trending-up",
				cor: "green",
				formato: "moeda",
				descricao: "Receita após descontos",
			},
			descontos: {
				titulo: "Descontos Concedidos",
				valor: formatCurrency(descontos),
				icone: "lucide:percent",
				cor: "red",
				formato: "moeda",
				descricao: "Total em descontos aplicados",
			},
			taxas_entrega: {
				titulo: "Taxas de Entrega",
				valor: formatCurrency(taxasEntrega),
				icone: "lucide:truck",
				cor: "blue",
				formato: "moeda",
				descricao: "Total arrecadado em entregas",
			},
			lucro_estimado: {
				titulo: "Lucro Estimado",
				valor: formatCurrency(lucro),
				icone: "lucide:piggy-bank",
				cor: "purple",
				formato: "moeda",
				descricao: "Receita líquida menos taxas estimadas",
			},
		};
	};

	/**
	 * Calcula valores por método de pagamento
	 */
	const calcularMetodosPagamento = (
		pedidos: unknown[],
	): RelatorioFinanceiro["metodos_pagamento"] => {
		const metodos = {
			dinheiro: { total_transacoes: 0, valor_total: 0 },
			pix: { total_transacoes: 0, valor_total: 0 },
			credito: { total_transacoes: 0, valor_total: 0 },
			debito: { total_transacoes: 0, valor_total: 0 },
		};

		pedidos.forEach((pedido) => {
			const pedidoData = pedido as Record<string, unknown>;
			const metodo = (pedidoData.forma_pagamento as string)?.toLowerCase() || "";
			const total = pedidoData.total as number;

			if (metodo.includes("dinheiro")) {
				metodos.dinheiro.total_transacoes += 1;
				metodos.dinheiro.valor_total += total;
			} else if (metodo.includes("pix")) {
				metodos.pix.total_transacoes += 1;
				metodos.pix.valor_total += total;
			} else if (metodo.includes("crédito") || metodo.includes("credito")) {
				metodos.credito.total_transacoes += 1;
				metodos.credito.valor_total += total;
			} else if (metodo.includes("débito") || metodo.includes("debito")) {
				metodos.debito.total_transacoes += 1;
				metodos.debito.valor_total += total;
			}
		});

		const totalGeral = Object.values(metodos).reduce((acc, m) => acc + m.valor_total, 0);

		return {
			dinheiro: {
				total_transacoes: metodos.dinheiro.total_transacoes,
				valor_total: metodos.dinheiro.valor_total,
				percentual_total: totalGeral > 0 ? (metodos.dinheiro.valor_total / totalGeral) * 100 : 0,
				ticket_medio:
					metodos.dinheiro.total_transacoes > 0
						? metodos.dinheiro.valor_total / metodos.dinheiro.total_transacoes
						: 0,
			},
			pix: {
				total_transacoes: metodos.pix.total_transacoes,
				valor_total: metodos.pix.valor_total,
				percentual_total: totalGeral > 0 ? (metodos.pix.valor_total / totalGeral) * 100 : 0,
				ticket_medio:
					metodos.pix.total_transacoes > 0
						? metodos.pix.valor_total / metodos.pix.total_transacoes
						: 0,
			},
			credito: {
				total_transacoes: metodos.credito.total_transacoes,
				valor_total: metodos.credito.valor_total,
				percentual_total: totalGeral > 0 ? (metodos.credito.valor_total / totalGeral) * 100 : 0,
				ticket_medio:
					metodos.credito.total_transacoes > 0
						? metodos.credito.valor_total / metodos.credito.total_transacoes
						: 0,
			},
			debito: {
				total_transacoes: metodos.debito.total_transacoes,
				valor_total: metodos.debito.valor_total,
				percentual_total: totalGeral > 0 ? (metodos.debito.valor_total / totalGeral) * 100 : 0,
				ticket_medio:
					metodos.debito.total_transacoes > 0
						? metodos.debito.valor_total / metodos.debito.total_transacoes
						: 0,
			},
		};
	};

	/**
	 * Prepara dados para gráficos
	 */
	const prepararGraficos = (pedidos: unknown[]): RelatorioFinanceiro["graficos"] => {
		// Fluxo de caixa (receita por dia)
		const receitaPorDia = new Map<string, number>();

		pedidos.forEach((pedido) => {
			const pedidoData = pedido as Record<string, unknown>;
			const createdAt = pedidoData.created_at as string;
			const data = new Date(createdAt).toISOString().split("T")[0] || "";
			const total = pedidoData.total as number;

			receitaPorDia.set(data, (receitaPorDia.get(data) || 0) + total);
		});

		const datasOrdenadas = Array.from(receitaPorDia.keys()).sort();

		const fluxo_caixa = {
			labels: datasOrdenadas,
			datasets: [
				{
					label: "Receita Diária (R$)",
					data: datasOrdenadas.map((data) => receitaPorDia.get(data) || 0),
					borderColor: "#10b981",
					backgroundColor: "#10b98120",
					fill: true,
					tension: 0.4,
				},
			],
		};

		// Receita por método de pagamento
		const metodos = calcularMetodosPagamento(pedidos);

		const receita_por_metodo = {
			labels: ["Dinheiro", "PIX", "Crédito", "Débito"],
			datasets: [
				{
					label: "Receita (R$)",
					data: [
						metodos.dinheiro.valor_total,
						metodos.pix.valor_total,
						metodos.credito.valor_total,
						metodos.debito.valor_total,
					],
					backgroundColor: ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6"],
				},
			],
		};

		// Evolução do lucro (simplificado)
		const lucroPorDia = new Map<string, number>();

		pedidos.forEach((pedido) => {
			const pedidoData = pedido as Record<string, unknown>;
			const createdAt = pedidoData.created_at as string;
			const data = new Date(createdAt).toISOString().split("T")[0] || "";
			const total = pedidoData.total as number;
			const lucroEstimado = total * 0.95; // 95% do total (descontando 5% de taxas)

			lucroPorDia.set(data, (lucroPorDia.get(data) || 0) + lucroEstimado);
		});

		const evolucao_lucro = {
			labels: datasOrdenadas,
			datasets: [
				{
					label: "Lucro Estimado (R$)",
					data: datasOrdenadas.map((data) => lucroPorDia.get(data) || 0),
					borderColor: "#8b5cf6",
					backgroundColor: "#8b5cf620",
					fill: true,
					tension: 0.4,
				},
			],
		};

		return {
			fluxo_caixa,
			receita_por_metodo,
			evolucao_lucro,
			comparativo_receitas: fluxo_caixa, // Placeholder - mesmo que fluxo de caixa
		};
	};

	/**
	 * Prepara dados para tabela
	 */
	const prepararTabela = (pedidos: unknown[]): RelatorioFinanceiro["tabela"] => {
		return pedidos.map((pedido) => {
			const pedidoData = pedido as Record<string, unknown>;
			const numeroOriginal = pedidoData.numero as string | number;

			// Converter número para string e remover # se existir
			const numeroLimpo =
				typeof numeroOriginal === "string"
					? numeroOriginal.replace("#", "").trim()
					: String(numeroOriginal);

			return {
				id: pedidoData.id as string,
				numero: Number(numeroLimpo),
				data: pedidoData.created_at as string,
				tipo: "entrada" as const,
				descricao: `Pedido #${numeroLimpo}`,
				forma_pagamento: pedidoData.forma_pagamento as string,
				valor_bruto: pedidoData.subtotal as number,
				desconto: pedidoData.desconto as number,
				taxa_entrega: (pedidoData.taxa_entrega as number) || 0,
				valor_liquido: pedidoData.total as number,
				status: "concluido",
			};
		});
	};

	/**
	 * Calcula resumo geral
	 */
	const calcularResumo = (pedidos: unknown[]): RelatorioFinanceiro["resumo"] => {
		const totalTransacoes = pedidos.length;

		const receitaBruta = pedidos.reduce(
			(acc, pedido) => (acc as number) + ((pedido as Record<string, unknown>).subtotal as number),
			0 as number,
		) as number;

		const receitaLiquida = pedidos.reduce(
			(acc, pedido) => (acc as number) + ((pedido as Record<string, unknown>).total as number),
			0 as number,
		) as number;

		const descontoTotal = pedidos.reduce(
			(acc, pedido) => (acc as number) + ((pedido as Record<string, unknown>).desconto as number),
			0 as number,
		) as number;

		const taxasEntregaTotal = pedidos.reduce(
			(acc, pedido) =>
				(acc as number) + (((pedido as Record<string, unknown>).taxa_entrega as number) || 0),
			0 as number,
		) as number;

		const ticketMedio = totalTransacoes > 0 ? receitaLiquida / totalTransacoes : 0;

		const lucroEstimado = receitaLiquida * 0.95; // 95% da receita líquida
		const margemLucro = receitaBruta > 0 ? (lucroEstimado / receitaBruta) * 100 : 0;

		// Distribuição de pagamentos
		const distribuicaoPagamentos: Record<string, number> = {};

		pedidos.forEach((pedido) => {
			const pedidoData = pedido as Record<string, unknown>;
			const metodo = pedidoData.forma_pagamento as string;

			distribuicaoPagamentos[metodo] = (distribuicaoPagamentos[metodo] || 0) + 1;
		});

		return {
			receita_bruta: receitaBruta,
			receita_liquida: receitaLiquida,
			total_descontos: descontoTotal,
			total_taxas_entrega: taxasEntregaTotal,
			lucro_estimado: lucroEstimado,
			margem_lucro: margemLucro,
			total_transacoes: totalTransacoes,
			ticket_medio: ticketMedio,
			distribuicao_pagamentos: distribuicaoPagamentos,
		};
	};

	/**
	 * Refresh dos dados (força nova busca)
	 */
	const refresh = async (): Promise<void> => {
		const filtros = useRelatoriosFiltros();
		await fetchDados(filtros.periodo.value);
	};

	/**
	 * Inicializa o watch do período (apenas uma vez)
	 */
	const inicializarWatch = () => {
		if (watchAtivo.value) return;
		watchAtivo.value = true;

		watch(
			periodo,
			async (novoPeriodo: FiltrosPeriodo) => {
				await fetchDados(novoPeriodo);
			},
			{ deep: true },
		);
	};

	// Inicializar watch automaticamente
	inicializarWatch();

	return {
		dados: readonly(dados),
		loading: readonly(loading),
		error: readonly(error),
		fetchDados,
		refresh,
	};
};
