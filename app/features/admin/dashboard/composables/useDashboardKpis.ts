/**
 * 📊 useDashboardKpis - Cálculo de KPIs do Dashboard
 *
 * Responsável por:
 * - Calcular indicadores de performance
 * - Buscar dados de pedidos e produtos
 * - Calcular variações e comparações
 * - Cache inteligente para performance
 */

import type {
	DashboardKpis,
	KpiPedidos,
	KpiFaturamento,
	KpiProdutos,
	KpiPerformance,
	ProdutoRanking,
} from "~/features/admin/dashboard/types/dashboard";
import type { PedidoCompleto } from "~/features/admin/pedidos/types/pedidos-admin";
import { isSameDay, subDays, differenceInMinutes } from "date-fns";

export interface UseDashboardKpisReturn {
	carregarKpis: (intervalo: { inicio: Date | null; fim: Date | null }) => Promise<DashboardKpis>;
	limparCache: () => void;
}

export const useDashboardKpis = (): UseDashboardKpisReturn => {
	// Cache para evitar recálculos desnecessários
	const cache = ref<Map<string, { data: DashboardKpis; timestamp: number }>>(new Map());
	const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

	/**
	 * Gera chave de cache baseada no intervalo
	 */
	const gerarChaveCache = (intervalo: { inicio: Date | null; fim: Date | null }): string => {
		const inicio = intervalo.inicio?.toISOString() || "null";
		const fim = intervalo.fim?.toISOString() || "null";
		return `${inicio}-${fim}`;
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

			// Aplica filtros de data se especificados
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
			console.error("Erro ao buscar pedidos:", error);
			return [];
		}
	};

	/**
	 * Calcula KPIs de pedidos
	 */
	const calcularKpisPedidos = (pedidos: PedidoCompleto[]): KpiPedidos => {
		const hoje = new Date();
		const ontem = subDays(hoje, 1);

		// Filtra pedidos de hoje e ontem
		const pedidosHoje = pedidos.filter((p) => isSameDay(new Date(p.created_at), hoje));
		const pedidosOntem = pedidos.filter((p) => isSameDay(new Date(p.created_at), ontem));

		// Calcula variação percentual
		const calcularVariacao = (atual: number, anterior: number): number => {
			if (anterior === 0) return atual > 0 ? 100 : 0;
			return Math.round(((atual - anterior) / anterior) * 100);
		};

		return {
			total: pedidosHoje.length,
			pendentes: pedidosHoje.filter((p) => p.status === "pendente").length,
			em_andamento: pedidosHoje.filter((p) =>
				["aceito", "preparo", "pronto", "entrega"].includes(p.status),
			).length,
			concluidos: pedidosHoje.filter((p) => p.status === "concluido").length,
			cancelados: pedidosHoje.filter((p) => p.status === "cancelado").length,
			variacao_ontem: calcularVariacao(pedidosHoje.length, pedidosOntem.length),
		};
	};

	/**
	 * Calcula KPIs de faturamento
	 */
	const calcularKpisFaturamento = (pedidos: PedidoCompleto[]): KpiFaturamento => {
		const hoje = new Date();
		const inicioSemana = subDays(hoje, 6); // Últimos 7 dias
		const semanaPassada = subDays(inicioSemana, 7);

		// Filtra pedidos concluídos por período
		const pedidosConcluidos = pedidos.filter((p) => p.status === "concluido");

		const faturamentoHoje = pedidosConcluidos
			.filter((p) => isSameDay(new Date(p.created_at), hoje))
			.reduce((acc, p) => acc + p.total, 0);

		const faturamentoSemana = pedidosConcluidos
			.filter((p) => new Date(p.created_at) >= inicioSemana)
			.reduce((acc, p) => acc + p.total, 0);

		const faturamentoSemanaPassada = pedidosConcluidos
			.filter((p) => {
				const data = new Date(p.created_at);
				return data >= semanaPassada && data < inicioSemana;
			})
			.reduce((acc, p) => acc + p.total, 0);

		// Calcula ticket médio
		const pedidosComValor = pedidosConcluidos.filter((p) => p.total > 0);
		const ticketMedio =
			pedidosComValor.length > 0
				? pedidosComValor.reduce((acc, p) => acc + p.total, 0) / pedidosComValor.length
				: 0;

		// Calcula variação semanal
		const variacaoSemana =
			faturamentoSemanaPassada > 0
				? Math.round(
						((faturamentoSemana - faturamentoSemanaPassada) / faturamentoSemanaPassada) * 100,
					)
				: faturamentoSemana > 0
					? 100
					: 0;

		return {
			hoje: faturamentoHoje,
			semana: faturamentoSemana,
			mes: 0, // TODO: Implementar cálculo mensal
			ticket_medio: ticketMedio,
			variacao_semana: variacaoSemana,
		};
	};

	/**
	 * Calcula KPIs de produtos
	 */
	const calcularKpisProdutos = async (): Promise<KpiProdutos> => {
		// Mock temporário para substituir API, permitindo funcionamento sem backend
		const produtosMaisVendidos: ProdutoRanking[] = [
			{
				id: "1",
				nome: "X-Bacon Duplo Artesanal",
				quantidade_vendida: 145,
				faturamento: 4350.0,
			},
			{
				id: "2",
				nome: "Combo Família Feliz",
				quantidade_vendida: 98,
				faturamento: 2940.0,
			},
			{
				id: "3",
				nome: "Refrigerante 2L",
				quantidade_vendida: 87,
				faturamento: 870.0,
			},
			{
				id: "4",
				nome: "Batata Frita Suprema",
				quantidade_vendida: 65,
				faturamento: 1300.0,
			},
			{
				id: "5",
				nome: "Milkshake Ovomaltine",
				quantidade_vendida: 42,
				faturamento: 630.0,
			},
		];

		return {
			total_ativos: 150, // Mock
			sem_estoque: 3, // Mock
			mais_vendidos: produtosMaisVendidos,
			menos_vendidos: [],
		};
	};

	/**
	 * Calcula KPIs de performance
	 */
	const calcularKpisPerformance = (pedidos: PedidoCompleto[]): KpiPerformance => {
		const pedidosConcluidos = pedidos.filter((p) => p.status === "concluido");
		const pedidosCancelados = pedidos.filter((p) => p.status === "cancelado");

		// Calcula tempo médio de preparo
		const temposPreparoMinutos = pedidosConcluidos
			.filter((p) => p.aceito_em && p.pronto_em)
			.map((p) => differenceInMinutes(new Date(p.pronto_em!), new Date(p.aceito_em!)));

		const tempoMedioPreparo =
			temposPreparoMinutos.length > 0
				? Math.round(
						temposPreparoMinutos.reduce((acc, t) => acc + t, 0) / temposPreparoMinutos.length,
					)
				: 0;

		// Calcula taxa de cancelamento
		const totalPedidos = pedidos.length;
		const taxaCancelamento =
			totalPedidos > 0 ? Math.round((pedidosCancelados.length / totalPedidos) * 100) : 0;

		return {
			tempo_medio_preparo: tempoMedioPreparo,
			tempo_medio_entrega: 38, // TODO: Calcular real
			total_cancelamentos: pedidosCancelados.length,
			taxa_cancelamento: taxaCancelamento,
			satisfacao_media: 4.9, // TODO: Implementar sistema de avaliação
			entregas_no_prazo: 95, // TODO: Implementar controle de prazo
		};
	};

	/**
	 * Carrega e calcula todos os KPIs
	 */
	const carregarKpis = async (intervalo: {
		inicio: Date | null;
		fim: Date | null;
	}): Promise<DashboardKpis> => {
		const chaveCache = gerarChaveCache(intervalo);
		const cached = cache.value.get(chaveCache);

		// Retorna cache se válido
		if (cached && isCacheValido(cached.timestamp)) {
			return cached.data;
		}

		try {
			// Busca dados necessários
			const pedidos = await buscarPedidos(intervalo);

			// Calcula KPIs
			const [pedidosKpi, faturamentoKpi, produtosKpi, performanceKpi] = await Promise.all([
				calcularKpisPedidos(pedidos),
				calcularKpisFaturamento(pedidos),
				calcularKpisProdutos(),
				calcularKpisPerformance(pedidos),
			]);

			const kpis: DashboardKpis = {
				pedidos_hoje: pedidosKpi,
				faturamento: faturamentoKpi,
				produtos: produtosKpi,
				performance: performanceKpi,
				clientes: {
					novos: 8,
					recorrencia: 85,
					variacao: 25,
				},
				conversao: {
					taxa: 3.2,
					visitas: 1200,
					variacao: -0.5,
				},
			};

			// Salva no cache
			cache.value.set(chaveCache, {
				data: kpis,
				timestamp: Date.now(),
			});

			return kpis;
		} catch (error) {
			console.error("Erro ao calcular KPIs:", error);
			throw error;
		}
	};

	/**
	 * Limpa cache
	 */
	const limparCache = (): void => {
		cache.value.clear();
	};

	return {
		carregarKpis,
		limparCache,
	};
};
