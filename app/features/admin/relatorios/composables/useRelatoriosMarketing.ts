/**
 * 🎯 useRelatoriosMarketing
 *
 * Composable para gerenciar dados do relatório de marketing.
 * Busca e processa informações sobre:
 * - Cupons utilizados
 * - Descontos aplicados
 * - Taxa de conversão
 * - Performance de campanhas
 */

import type { RelatorioMarketing } from "../types/marketing";
import type { FiltrosPeriodo } from "../types/relatorios";
import { formatCurrency } from "~/lib/formatters/currency";
import { formatNumber } from "~/lib/formatters/number";
import { useRelatoriosFiltros } from "./useRelatoriosFiltros";

export const useRelatoriosMarketing = () => {
	// Estado reativo
	const dados = useState<RelatorioMarketing | null>("relatorios.marketing.dados", () => null);
	const loading = useState<boolean>("relatorios.marketing.loading", () => false);
	const error = useState<string | null>("relatorios.marketing.error", () => null);
	const watchAtivo = useState<boolean>("relatorios.marketing.watchAtivo", () => false);

	const supabase = useSupabaseClient();
	const estabelecimentoStore = useEstabelecimentoStore();
	const { periodo } = useRelatoriosFiltros();

	/**
	 * Busca dados do relatório de marketing
	 */
	const fetchDados = async (filtros: FiltrosPeriodo): Promise<void> => {
		loading.value = true;
		error.value = null;

		try {
			const estabelecimentoId = estabelecimentoStore.estabelecimento?.id;
			if (!estabelecimentoId) {
				throw new Error("Estabelecimento não encontrado");
			}

			// Buscar pedidos com cupons aplicados (desconto > 0)
			const { data: pedidosComCupons, error: pedidosError } = await supabase
				.from("pedidos")
				.select("id, numero, created_at, subtotal, desconto, total")
				.eq("estabelecimento_id", estabelecimentoId)
				.gt("desconto", 0)
				.gte("created_at", filtros.data_inicio)
				.lte("created_at", filtros.data_fim);

			if (pedidosError) throw pedidosError;

			// Buscar total de pedidos para calcular taxa de conversão
			const { count: totalPedidos, error: countError } = await supabase
				.from("pedidos")
				.select("*", { count: "exact", head: true })
				.eq("estabelecimento_id", estabelecimentoId)
				.gte("created_at", filtros.data_inicio)
				.lte("created_at", filtros.data_fim);

			if (countError) throw countError;

			// Processar dados
			const kpis = calcularKpis(pedidosComCupons || [], totalPedidos || 0);
			const cupons = calcularDesempenhoCupons(pedidosComCupons || []);
			const banners = calcularBanners(); // Por enquanto vazio
			const graficos = prepararGraficos(pedidosComCupons || []);
			const resumo = calcularResumo(pedidosComCupons || [], totalPedidos || 0);

			dados.value = {
				kpis,
				cupons,
				banners,
				graficos,
				resumo,
			};
		} catch (err) {
			console.error("Erro ao buscar dados de marketing:", err);
			error.value = err instanceof Error ? err.message : "Erro desconhecido";
		} finally {
			loading.value = false;
		}
	};

	/**
	 * Calcula KPIs do relatório
	 */
	const calcularKpis = (pedidos: unknown[], totalPedidos: number): RelatorioMarketing["kpis"] => {
		const cuponsUsados = pedidos.length;

		const descontoTotal = pedidos.reduce(
			(acc, pedido) => (acc as number) + ((pedido as Record<string, unknown>).desconto as number),
			0 as number,
		) as number;

		const taxaConversao = totalPedidos > 0 ? (cuponsUsados / totalPedidos) * 100 : 0;

		const economiaMedia = cuponsUsados > 0 ? descontoTotal / cuponsUsados : 0;

		return {
			cupons_usados: {
				titulo: "Cupons Utilizados",
				valor: formatNumber(cuponsUsados as number),
				icone: "lucide:ticket",
				cor: "blue",
				formato: "numero",
				descricao: "Total de cupons aplicados",
			},
			desconto_total: {
				titulo: "Desconto Total",
				valor: formatCurrency(descontoTotal as number),
				icone: "lucide:percent",
				cor: "red",
				formato: "moeda",
				descricao: "Valor total em descontos",
			},
			taxa_conversao: {
				titulo: "Taxa de Conversão",
				valor: `${taxaConversao.toFixed(1)}%`,
				icone: "lucide:trending-up",
				cor: "green",
				formato: "percentual",
				descricao: "Pedidos com cupom vs total",
			},
			economia_cliente: {
				titulo: "Economia Média",
				valor: formatCurrency(economiaMedia),
				icone: "lucide:piggy-bank",
				cor: "purple",
				formato: "moeda",
				descricao: "Economia média por pedido",
			},
		};
	};

	/**
	 * Calcula desempenho dos cupons
	 * Nota: Por enquanto agrupa apenas por desconto, pois não há relação direta com tabela de cupons
	 */
	const calcularDesempenhoCupons = (pedidos: unknown[]): RelatorioMarketing["cupons"] => {
		// Agrupar pedidos com desconto
		const cuponsArray = pedidos.map((pedido) => {
			const pedidoData = pedido as Record<string, unknown>;
			return {
				id: pedidoData.id as string,
				codigo: `DESCONTO-${(pedidoData.numero as string).replace("#", "")}`,
				tipo: "desconto",
				usos: 1,
				desconto_total: pedidoData.desconto as number,
				receita_gerada: pedidoData.total as number,
				created_at: pedidoData.created_at as string,
				taxa_conversao: 100, // 100% pois já foi aplicado
				economia_media: pedidoData.desconto as number,
			};
		});

		// Mais usados (por valor de desconto)
		const maisUsados = [...cuponsArray]
			.sort((a, b) => b.desconto_total - a.desconto_total)
			.slice(0, 10);

		return {
			desempenho: cuponsArray,
			mais_usados: maisUsados,
		};
	};

	/**
	 * Prepara dados para gráficos
	 */
	const prepararGraficos = (pedidos: unknown[]): RelatorioMarketing["graficos"] => {
		// Descontos por faixa de valor
		const faixas = {
			"Até R$ 5": 0,
			"R$ 5 - R$ 10": 0,
			"R$ 10 - R$ 20": 0,
			"Acima de R$ 20": 0,
		};

		pedidos.forEach((pedido) => {
			const pedidoData = pedido as Record<string, unknown>;
			const desconto = pedidoData.desconto as number;

			if (desconto <= 5) {
				faixas["Até R$ 5"] += 1;
			} else if (desconto <= 10) {
				faixas["R$ 5 - R$ 10"] += 1;
			} else if (desconto <= 20) {
				faixas["R$ 10 - R$ 20"] += 1;
			} else {
				faixas["Acima de R$ 20"] += 1;
			}
		});

		const cupons_por_tipo = {
			labels: Object.keys(faixas),
			datasets: [
				{
					label: "Quantidade",
					data: Object.values(faixas),
					backgroundColor: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"],
				},
			],
		};

		// Uso ao longo do tempo
		const usosPorDia = new Map<string, number>();

		pedidos.forEach((pedido) => {
			const pedidoData = pedido as Record<string, unknown>;
			const createdAt = pedidoData.created_at as string;
			const data = new Date(createdAt).toISOString().split("T")[0] || "";

			usosPorDia.set(data, (usosPorDia.get(data) || 0) + 1);
		});

		const datasOrdenadas = Array.from(usosPorDia.keys()).sort();

		const uso_ao_longo_tempo = {
			labels: datasOrdenadas,
			datasets: [
				{
					label: "Descontos Aplicados",
					data: datasOrdenadas.map((data) => usosPorDia.get(data) || 0),
					borderColor: "#3b82f6",
					backgroundColor: "#3b82f620",
					fill: true,
					tension: 0.4,
				},
			],
		};

		// Economia gerada ao longo do tempo
		const economiaPorDia = new Map<string, number>();

		pedidos.forEach((pedido) => {
			const pedidoData = pedido as Record<string, unknown>;
			const createdAt = pedidoData.created_at as string;
			const data = new Date(createdAt).toISOString().split("T")[0] || "";
			const desconto = pedidoData.desconto as number;

			economiaPorDia.set(data, (economiaPorDia.get(data) || 0) + desconto);
		});

		const economia_gerada = {
			labels: datasOrdenadas,
			datasets: [
				{
					label: "Economia Gerada (R$)",
					data: datasOrdenadas.map((data) => economiaPorDia.get(data) || 0),
					borderColor: "#10b981",
					backgroundColor: "#10b98120",
					fill: true,
					tension: 0.4,
				},
			],
		};

		return {
			cupons_por_tipo,
			uso_ao_longo_tempo,
			economia_gerada,
		};
	};

	/**
	 * Calcula dados de banners (placeholder por enquanto)
	 */
	const calcularBanners = (): RelatorioMarketing["banners"] => {
		// Por enquanto retorna vazio - será implementado quando houver dados de banners
		return {
			desempenho: [],
			mais_visualizados: [],
		};
	};

	/**
	 * Calcula resumo geral
	 */
	const calcularResumo = (
		pedidos: unknown[],
		totalPedidos: number,
	): RelatorioMarketing["resumo"] => {
		const totalCuponsUsados = pedidos.length;

		const descontoTotalConcedido = pedidos.reduce(
			(acc, pedido) => (acc as number) + ((pedido as Record<string, unknown>).desconto as number),
			0 as number,
		) as number;

		const receitaComCupons = pedidos.reduce(
			(acc, pedido) => (acc as number) + ((pedido as Record<string, unknown>).total as number),
			0 as number,
		) as number;

		const economiaMediaCliente =
			totalCuponsUsados > 0 ? descontoTotalConcedido / totalCuponsUsados : 0;

		const taxaConversaoGeral = totalPedidos > 0 ? (totalCuponsUsados / totalPedidos) * 100 : 0;

		// Desconto mais alto
		let descontoMaisAlto: { codigo: string; usos: number } | null = null;
		let maiorDesconto = 0;

		pedidos.forEach((pedido) => {
			const pedidoData = pedido as Record<string, unknown>;
			const desconto = pedidoData.desconto as number;

			if (desconto > maiorDesconto) {
				maiorDesconto = desconto;
				descontoMaisAlto = {
					codigo: `DESCONTO-${(pedidoData.numero as string).replace("#", "")}`,
					usos: 1,
				};
			}
		});

		return {
			total_cupons_ativos: totalCuponsUsados, // Pedidos com desconto
			total_cupons_usados: totalCuponsUsados,
			desconto_total_concedido: descontoTotalConcedido,
			receita_com_cupons: receitaComCupons,
			economia_media_cliente: economiaMediaCliente,
			taxa_conversao_geral: taxaConversaoGeral,
			cupom_mais_usado: descontoMaisAlto,
			total_banners_ativos: 0, // Placeholder
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
