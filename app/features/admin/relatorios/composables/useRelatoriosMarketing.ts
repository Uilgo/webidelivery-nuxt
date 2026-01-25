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

	const supabase = useSupabaseClient();
	const estabelecimentoStore = useEstabelecimentoStore();

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

			// Buscar pedidos com cupons
			const { data: pedidosComCupons, error: pedidosError } = await supabase
				.from("pedidos")
				.select(
					`
          id,
          numero,
          created_at,
          subtotal,
          desconto,
          total,
          cupom_id,
          cupons (
            id,
            codigo,
            tipo,
            valor
          )
        `,
				)
				.eq("estabelecimento_id", estabelecimentoId)
				.not("cupom_id", "is", null)
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
	 */
	const calcularDesempenhoCupons = (pedidos: unknown[]): RelatorioMarketing["cupons"] => {
		// Agrupar por cupom
		const cuponsMap = new Map<
			string,
			{
				id: string;
				codigo: string;
				tipo: string;
				usos: number;
				desconto_total: number;
				receita_gerada: number;
				created_at: string;
			}
		>();

		pedidos.forEach((pedido) => {
			const pedidoData = pedido as Record<string, unknown>;
			const cupons = pedidoData.cupons as Record<string, unknown> | null;

			if (cupons) {
				const cupomId = cupons.id as string;
				const cupomCodigo = cupons.codigo as string;
				const cupomTipo = cupons.tipo as string;
				const desconto = pedidoData.desconto as number;
				const total = pedidoData.total as number;
				const createdAt = pedidoData.created_at as string;

				if (cuponsMap.has(cupomId)) {
					const existing = cuponsMap.get(cupomId)!;
					existing.usos += 1;
					existing.desconto_total += desconto;
					existing.receita_gerada += total;
				} else {
					cuponsMap.set(cupomId, {
						id: cupomId,
						codigo: cupomCodigo,
						tipo: cupomTipo,
						usos: 1,
						desconto_total: desconto,
						receita_gerada: total,
						created_at: createdAt,
					});
				}
			}
		});

		const cuponsArray = Array.from(cuponsMap.values()).map((cupom) => ({
			...cupom,
			taxa_conversao: cupom.usos > 0 ? (cupom.receita_gerada / cupom.usos) * 100 : 0,
			economia_media: cupom.usos > 0 ? cupom.desconto_total / cupom.usos : 0,
		}));

		// Mais usados
		const maisUsados = [...cuponsArray].sort((a, b) => b.usos - a.usos).slice(0, 10);

		return {
			desempenho: cuponsArray,
			mais_usados: maisUsados,
		};
	};

	/**
	 * Prepara dados para gráficos
	 */
	const prepararGraficos = (pedidos: unknown[]): RelatorioMarketing["graficos"] => {
		// Cupons por tipo
		const tiposMap = new Map<string, number>();

		pedidos.forEach((pedido) => {
			const pedidoData = pedido as Record<string, unknown>;
			const cupons = pedidoData.cupons as Record<string, unknown> | null;

			if (cupons) {
				const tipo = cupons.tipo as string;
				tiposMap.set(tipo, (tiposMap.get(tipo) || 0) + 1);
			}
		});

		const cupons_por_tipo = {
			labels: Array.from(tiposMap.keys()),
			datasets: [
				{
					label: "Quantidade",
					data: Array.from(tiposMap.values()),
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
					label: "Cupons Utilizados",
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

		// Cupom mais usado
		const cuponsMap = new Map<string, { codigo: string; usos: number }>();

		pedidos.forEach((pedido) => {
			const pedidoData = pedido as Record<string, unknown>;
			const cupons = pedidoData.cupons as Record<string, unknown> | null;

			if (cupons) {
				const cupomId = cupons.id as string;
				const cupomCodigo = cupons.codigo as string;

				if (cuponsMap.has(cupomId)) {
					const existing = cuponsMap.get(cupomId)!;
					existing.usos += 1;
				} else {
					cuponsMap.set(cupomId, { codigo: cupomCodigo, usos: 1 });
				}
			}
		});

		let cupomMaisUsado: { codigo: string; usos: number } | null = null;
		cuponsMap.forEach((cupom) => {
			if (!cupomMaisUsado || cupom.usos > cupomMaisUsado.usos) {
				cupomMaisUsado = cupom;
			}
		});

		return {
			total_cupons_ativos: cuponsMap.size,
			total_cupons_usados: totalCuponsUsados,
			desconto_total_concedido: descontoTotalConcedido,
			receita_com_cupons: receitaComCupons,
			economia_media_cliente: economiaMediaCliente,
			taxa_conversao_geral: taxaConversaoGeral,
			cupom_mais_usado: cupomMaisUsado,
			total_banners_ativos: 0, // Placeholder
		};
	};

	/**
	 * Refresh dos dados
	 */
	const refresh = async (): Promise<void> => {
		const filtros = useRelatoriosFiltros();
		await fetchDados(filtros.periodo.value);
	};

	return {
		dados: readonly(dados),
		loading: readonly(loading),
		error: readonly(error),
		fetchDados,
		refresh,
	};
};
