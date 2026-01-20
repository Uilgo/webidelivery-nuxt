/**
 * 📊 useDashboardCharts - Dados para Gráficos do Dashboard
 *
 * Responsável por:
 * - Preparar dados para Chart.js
 * - Gerar gráficos de pedidos, faturamento, status, produtos e heatmap
 * - Cache inteligente para performance
 * - Formatação adequada para visualização
 */

import type {
	DashboardCharts,
	ChartPedidosPorHora,
	ChartFaturamentoSemanal,
	ChartStatusDistribuicao,
	ChartProdutosRanking,
	ChartHorariosHeatmap,
} from "~/features/admin/dashboard/types/dashboard";
import type { PedidoCompleto } from "~/features/admin/pedidos/types/pedidos-admin";
import {
	format,
	eachHourOfInterval,
	startOfDay,
	endOfDay,
	eachDayOfInterval,
	startOfWeek,
	endOfWeek,
} from "date-fns";
import { ptBR } from "date-fns/locale";

export interface UseDashboardChartsReturn {
	carregarCharts: (intervalo: {
		inicio: Date | null;
		fim: Date | null;
	}) => Promise<DashboardCharts>;
	limparCache: () => void;
}

export const useDashboardCharts = (): UseDashboardChartsReturn => {
	// Cache para evitar recálculos desnecessários
	const cache = ref<Map<string, { data: DashboardCharts; timestamp: number }>>(new Map());
	const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

	/**
	 * Gera chave de cache baseada no intervalo
	 */
	const gerarChaveCache = (intervalo: { inicio: Date | null; fim: Date | null }): string => {
		const inicio = intervalo.inicio?.toISOString() || "null";
		const fim = intervalo.fim?.toISOString() || "null";
		return `charts-${inicio}-${fim}`;
	};

	/**
	 * Verifica se cache é válido
	 */
	const isCacheValido = (timestamp: number): boolean => {
		return Date.now() - timestamp < CACHE_TTL;
	};

	/**
	 * Busca pedidos do período via Supabase
	 */
	const buscarPedidos = async (intervalo: {
		inicio: Date | null;
		fim: Date | null;
	}): Promise<PedidoCompleto[]> => {
		try {
			const supabase = useSupabaseClient();
			let query = supabase.from("pedidos").select("*");

			if (intervalo.inicio) {
				query = query.gte("created_at", intervalo.inicio.toISOString());
			}
			if (intervalo.fim) {
				query = query.lte("created_at", intervalo.fim.toISOString());
			}

			const { data, error } = await query;

			if (error) throw error;
			return data as unknown as PedidoCompleto[];
		} catch (error) {
			throw new Error(`Erro ao buscar pedidos para gráficos: ${error}`);
		}
	};

	/**
	 * Gera gráfico de pedidos por hora
	 */
	const gerarGraficoPedidosPorHora = (pedidos: PedidoCompleto[]): ChartPedidosPorHora => {
		const hoje = new Date();
		const inicioHoje = startOfDay(hoje);
		const fimHoje = endOfDay(hoje);

		// Gera array de horas do dia
		const horas = eachHourOfInterval({ start: inicioHoje, end: fimHoje });
		const labels = horas.map((hora) => format(hora, "HH:mm"));

		// Agrupa pedidos por hora
		const pedidosPorHora = horas.map((hora) => {
			const horaStr = format(hora, "HH");
			return pedidos.filter((pedido) => {
				const pedidoHora = format(new Date(pedido.created_at), "HH");
				return pedidoHora === horaStr;
			}).length;
		});

		// Calcula faturamento por hora
		const faturamentoPorHora = horas.map((hora) => {
			const horaStr = format(hora, "HH");
			return pedidos
				.filter((pedido) => {
					const pedidoHora = format(new Date(pedido.created_at), "HH");
					return pedidoHora === horaStr && pedido.status === "concluido";
				})
				.reduce((acc, pedido) => acc + pedido.total, 0);
		});

		return {
			labels,
			datasets: {
				pedidos: pedidosPorHora,
				faturamento: faturamentoPorHora,
			},
		};
	};

	/**
	 * Gera gráfico de faturamento semanal
	 */
	const gerarGraficoFaturamentoSemanal = (pedidos: PedidoCompleto[]): ChartFaturamentoSemanal => {
		const hoje = new Date();
		const inicioSemana = startOfWeek(hoje, { weekStartsOn: 1 }); // Segunda-feira
		const fimSemana = endOfWeek(hoje, { weekStartsOn: 1 }); // Domingo

		// Gera dias da semana
		const dias = eachDayOfInterval({ start: inicioSemana, end: fimSemana });
		const labels = dias.map((dia) => format(dia, "EEE", { locale: ptBR }));

		// Calcula faturamento atual
		const faturamentoAtual = dias.map((dia) => {
			const diaStr = format(dia, "yyyy-MM-dd");
			return pedidos
				.filter((pedido) => {
					const pedidoData = format(new Date(pedido.created_at), "yyyy-MM-dd");
					return pedidoData === diaStr && pedido.status === "concluido";
				})
				.reduce((acc, pedido) => acc + pedido.total, 0);
		});

		// TODO: Implementar faturamento da semana anterior para comparação
		const faturamentoAnterior = new Array(7).fill(0);

		return {
			labels,
			datasets: {
				atual: faturamentoAtual,
				anterior: faturamentoAnterior,
			},
		};
	};

	/**
	 * Gera gráfico de distribuição de status
	 */
	const gerarGraficoStatusDistribuicao = (pedidos: PedidoCompleto[]): ChartStatusDistribuicao => {
		const statusCount = pedidos.reduce(
			(acc, pedido) => {
				acc[pedido.status] = (acc[pedido.status] || 0) + 1;
				return acc;
			},
			{} as Record<string, number>,
		);

		const statusLabels: Record<string, string> = {
			pendente: "Pendentes",
			aceito: "Aceitos",
			preparo: "Em Preparo",
			pronto: "Prontos",
			entrega: "Em Entrega",
			concluido: "Concluídos",
			cancelado: "Cancelados",
		};

		const statusCores: Record<string, string> = {
			pendente: "#F59E0B",
			aceito: "#06B6D4",
			preparo: "#8B5CF6",
			pronto: "#10B981",
			entrega: "#3B82F6",
			concluido: "#059669",
			cancelado: "#EF4444",
		};

		const labels = Object.keys(statusCount).map((status) => statusLabels[status] || status);
		const data = Object.values(statusCount);
		const colors = Object.keys(statusCount).map((status) => statusCores[status] || "#6B7280");

		return {
			labels,
			data,
			colors,
		};
	};

	/**
	 * Gera gráfico de ranking de produtos baseado nos pedidos do período
	 */
	const gerarGraficoProdutosRanking = async (
		pedidos: PedidoCompleto[],
	): Promise<ChartProdutosRanking> => {
		try {
			const supabase = useSupabaseClient();

			// Se não há pedidos no período, retorna vazio
			if (pedidos.length === 0) {
				return {
					labels: [],
					data: [],
					produtos: [],
				};
			}

			// Busca os itens dos pedidos do período
			const pedidoIds = pedidos.map((p) => p.id);

			const { data: itens, error } = await supabase
				.from("pedido_itens")
				.select("produto_id, produto_nome, quantidade")
				.in("pedido_id", pedidoIds);

			if (error) throw error;

			if (!itens || itens.length === 0) {
				return {
					labels: [],
					data: [],
					produtos: [],
				};
			}

			// Agrupa por produto e soma quantidades
			const produtosMap = itens.reduce(
				(acc, item) => {
					const key = item.produto_id;
					if (!acc[key]) {
						acc[key] = {
							id: item.produto_id,
							nome: item.produto_nome,
							quantidade: 0,
						};
					}
					// Validação TypeScript: garante que acc[key] existe
					const produto = acc[key];
					if (produto) {
						produto.quantidade += item.quantidade;
					}
					return acc;
				},
				{} as Record<
					string,
					{
						id: string;
						nome: string;
						quantidade: number;
					}
				>,
			);

			// Ordena por quantidade e pega top 5 - tipagem explícita para evitar 'unknown'
			const produtosArray: Array<{ id: string; nome: string; quantidade: number }> =
				Object.values(produtosMap);
			const produtosOrdenados = produtosArray
				.sort((a, b) => b.quantidade - a.quantidade)
				.slice(0, 5);

			const labels = produtosOrdenados.map((p) => p.nome);
			const data = produtosOrdenados.map((p) => p.quantidade);

			return {
				labels,
				data,
				produtos: produtosOrdenados.map((p) => ({
					id: p.id,
					nome: p.nome,
					quantidade_vendida: p.quantidade,
					faturamento: 0, // TODO: Calcular faturamento real
				})),
			};
		} catch (error) {
			throw new Error(`Erro ao gerar ranking de produtos: ${error}`);
		}
	};

	/**
	 * Gera mapa de calor de horários
	 */
	const gerarHeatmapHorarios = (pedidos: PedidoCompleto[]): ChartHorariosHeatmap => {
		const dias = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
		const horas = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, "0")}:00`);

		// Inicializa matriz de dados (7 dias x 24 horas) com type assertion
		const data = Array.from({ length: 7 }, () => Array(24).fill(0)) as number[][];

		// Preenche dados com pedidos
		pedidos.forEach((pedido) => {
			// Validação: garante que created_at existe e é válido
			if (!pedido?.created_at) return;

			const data_pedido = new Date(pedido.created_at);
			// Validação: garante que a data é válida
			if (isNaN(data_pedido.getTime())) return;

			const dia_semana = data_pedido.getDay(); // 0=domingo, 6=sábado
			const hora = data_pedido.getHours();

			// Validação segura: garante índices válidos e acesso seguro ao array
			if (dia_semana >= 0 && dia_semana < 7 && hora >= 0 && hora < 24) {
				const linhaDia = data[dia_semana];
				if (linhaDia && typeof linhaDia[hora] === "number") {
					linhaDia[hora]++;
				}
			}
		});

		return {
			dias,
			horas,
			data,
		};
	};

	/**
	 * Carrega todos os dados dos gráficos
	 */
	const carregarCharts = async (intervalo: {
		inicio: Date | null;
		fim: Date | null;
	}): Promise<DashboardCharts> => {
		const chaveCache = gerarChaveCache(intervalo);
		const cached = cache.value.get(chaveCache);

		// Retorna cache se válido
		if (cached && isCacheValido(cached.timestamp)) {
			return cached.data;
		}

		try {
			// Busca pedidos
			const pedidos = await buscarPedidos(intervalo);

			// Gera gráficos em paralelo
			const [
				pedidosPorHora,
				faturamentoSemanal,
				statusDistribuicao,
				produtosRanking,
				horariosHeatmap,
			] = await Promise.all([
				gerarGraficoPedidosPorHora(pedidos),
				gerarGraficoFaturamentoSemanal(pedidos),
				gerarGraficoStatusDistribuicao(pedidos),
				gerarGraficoProdutosRanking(pedidos), // Agora recebe pedidos como parâmetro
				gerarHeatmapHorarios(pedidos),
			]);

			const charts: DashboardCharts = {
				pedidos_por_hora: pedidosPorHora,
				faturamento_semanal: faturamentoSemanal,
				status_distribuicao: statusDistribuicao,
				produtos_ranking: produtosRanking,
				horarios_heatmap: horariosHeatmap,
			};

			// Salva no cache
			cache.value.set(chaveCache, {
				data: charts,
				timestamp: Date.now(),
			});

			return charts;
		} catch (error) {
			throw new Error(`Erro ao gerar gráficos: ${error}`);
		}
	};

	/**
	 * Limpa cache
	 */
	const limparCache = (): void => {
		cache.value.clear();
	};

	return {
		carregarCharts,
		limparCache,
	};
};
