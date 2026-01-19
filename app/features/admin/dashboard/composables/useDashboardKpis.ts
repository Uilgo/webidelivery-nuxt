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
	 * Calcula KPIs de produtos via Supabase
	 */
	const calcularKpisProdutos = async (): Promise<KpiProdutos> => {
		try {
			const supabase = useSupabaseClient();

			// Busca total de produtos ativos
			const { count: totalAtivos } = await supabase
				.from("produtos")
				.select("*", { count: "exact", head: true })
				.eq("ativo", true);

			// Busca produtos sem estoque (assumindo campo estoque_atual)
			const { count: semEstoque } = await supabase
				.from("produtos")
				.select("*", { count: "exact", head: true })
				.eq("ativo", true)
				.lte("estoque_atual", 0);

			// Busca produtos mais vendidos (top 5)
			const { data: maisVendidos } = await supabase
				.from("produtos")
				.select("id, nome, total_vendas")
				.eq("ativo", true)
				.order("total_vendas", { ascending: false })
				.limit(5);

			// Formata produtos mais vendidos
			const produtosMaisVendidos: ProdutoRanking[] =
				maisVendidos?.map((p) => ({
					id: p.id,
					nome: p.nome,
					quantidade_vendida: p.total_vendas || 0,
					faturamento: 0, // TODO: Calcular faturamento real
				})) || [];

			return {
				total_ativos: totalAtivos || 0,
				sem_estoque: semEstoque || 0,
				mais_vendidos: produtosMaisVendidos,
				menos_vendidos: [],
			};
		} catch (error) {
			console.error("Erro ao calcular KPIs de produtos:", error);
			return {
				total_ativos: 0,
				sem_estoque: 0,
				mais_vendidos: [],
				menos_vendidos: [],
			};
		}
	};

	/**
	 * Calcula KPIs de clientes via Supabase
	 */
	const calcularKpisClientes = async (intervalo: {
		inicio: Date | null;
		fim: Date | null;
	}): Promise<{ novos: number; recorrencia: number; variacao: number }> => {
		try {
			const supabase = useSupabaseClient();
			const hoje = new Date();
			const ontem = subDays(hoje, 1);

			// Busca novos clientes (primeiro pedido hoje)
			const { data: novosClientes } = await supabase
				.from("clientes")
				.select("id")
				.gte("primeiro_pedido_em", intervalo.inicio?.toISOString() || hoje.toISOString())
				.lte("primeiro_pedido_em", intervalo.fim?.toISOString() || hoje.toISOString());

			// Busca novos clientes ontem para comparação
			const { data: novosClientesOntem } = await supabase
				.from("clientes")
				.select("id")
				.gte("primeiro_pedido_em", ontem.toISOString())
				.lt("primeiro_pedido_em", hoje.toISOString());

			// Busca taxa de recorrência (clientes com mais de 1 pedido)
			const { data: todosClientes } = await supabase.from("clientes").select("id, total_pedidos");

			const totalClientes = todosClientes?.length || 0;
			const clientesRecorrentes = todosClientes?.filter((c) => c.total_pedidos > 1).length || 0;
			const taxaRecorrencia =
				totalClientes > 0 ? Math.round((clientesRecorrentes / totalClientes) * 100) : 0;

			// Calcula variação de novos clientes
			const novosHoje = novosClientes?.length || 0;
			const novosOntem = novosClientesOntem?.length || 0;
			const variacao =
				novosOntem > 0 ? Math.round(((novosHoje - novosOntem) / novosOntem) * 100) : 0;

			return {
				novos: novosHoje,
				recorrencia: taxaRecorrencia,
				variacao,
			};
		} catch (error) {
			console.error("Erro ao calcular KPIs de clientes:", error);
			return {
				novos: 0,
				recorrencia: 0,
				variacao: 0,
			};
		}
	};

	/**
	 * Calcula KPI de Taxa de Conclusão (substitui Conversão)
	 */
	const calcularKpisConclusao = async (
		pedidos: PedidoCompleto[],
	): Promise<{ taxa: number; visitas: number; variacao: number }> => {
		const hoje = new Date();
		const ontem = subDays(hoje, 1);

		// Filtra pedidos de hoje e ontem
		const pedidosHoje = pedidos.filter((p) => isSameDay(new Date(p.created_at), hoje));
		const pedidosOntem = pedidos.filter((p) => isSameDay(new Date(p.created_at), ontem));

		// Calcula taxa de conclusão hoje
		const totalHoje = pedidosHoje.length;
		const concluidosHoje = pedidosHoje.filter((p) => p.status === "concluido").length;
		const taxaHoje = totalHoje > 0 ? Math.round((concluidosHoje / totalHoje) * 100) : 0;

		// Calcula taxa de conclusão ontem
		const totalOntem = pedidosOntem.length;
		const concluidosOntem = pedidosOntem.filter((p) => p.status === "concluido").length;
		const taxaOntem = totalOntem > 0 ? Math.round((concluidosOntem / totalOntem) * 100) : 0;

		// Calcula variação
		const variacao = taxaOntem > 0 ? taxaHoje - taxaOntem : 0;

		return {
			taxa: taxaHoje,
			visitas: totalHoje, // Representa total de pedidos, não visitas
			variacao,
		};
	};

	/**
	 * Calcula KPIs de performance via Supabase
	 */
	const calcularKpisPerformance = async (pedidos: PedidoCompleto[]): Promise<KpiPerformance> => {
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

		// Calcula tempo médio de entrega
		const temposEntregaMinutos = pedidosConcluidos
			.filter((p) => p.pronto_em && p.concluido_em && p.tipo_entrega === "delivery")
			.map((p) => differenceInMinutes(new Date(p.concluido_em!), new Date(p.pronto_em!)));

		const tempoMedioEntrega =
			temposEntregaMinutos.length > 0
				? Math.round(
						temposEntregaMinutos.reduce((acc, t) => acc + t, 0) / temposEntregaMinutos.length,
					)
				: 0;

		// Calcula taxa de cancelamento
		const totalPedidos = pedidos.length;
		const taxaCancelamento =
			totalPedidos > 0 ? Math.round((pedidosCancelados.length / totalPedidos) * 100) : 0;

		// Busca satisfação média via Supabase (avaliações)
		let satisfacaoMedia = 0;
		try {
			const supabase = useSupabaseClient();
			const { data: avaliacoes } = await supabase.from("avaliacoes").select("nota");

			if (avaliacoes && avaliacoes.length > 0) {
				const somaNotas = avaliacoes.reduce((acc, a) => acc + a.nota, 0);
				satisfacaoMedia = Number((somaNotas / avaliacoes.length).toFixed(1));
			}
		} catch (error) {
			console.error("Erro ao buscar satisfação média:", error);
		}

		// Calcula entregas no prazo (assumindo prazo de 45 minutos)
		const PRAZO_ENTREGA_MINUTOS = 45;
		const entregasNoPrazo = pedidosConcluidos.filter((p) => {
			if (!p.created_at || !p.concluido_em || p.tipo_entrega !== "delivery") return false;
			const tempoTotal = differenceInMinutes(new Date(p.concluido_em), new Date(p.created_at));
			return tempoTotal <= PRAZO_ENTREGA_MINUTOS;
		}).length;

		const totalEntregas = pedidosConcluidos.filter((p) => p.tipo_entrega === "delivery").length;
		const percentualNoPrazo =
			totalEntregas > 0 ? Math.round((entregasNoPrazo / totalEntregas) * 100) : 0;

		return {
			tempo_medio_preparo: tempoMedioPreparo,
			tempo_medio_entrega: tempoMedioEntrega,
			total_cancelamentos: pedidosCancelados.length,
			taxa_cancelamento: taxaCancelamento,
			satisfacao_media: satisfacaoMedia,
			entregas_no_prazo: percentualNoPrazo,
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
			const [pedidosKpi, faturamentoKpi, produtosKpi, performanceKpi, clientesKpi] =
				await Promise.all([
					calcularKpisPedidos(pedidos),
					calcularKpisFaturamento(pedidos),
					calcularKpisProdutos(),
					calcularKpisPerformance(pedidos),
					calcularKpisClientes(intervalo),
				]);

			const kpis: DashboardKpis = {
				pedidos_hoje: pedidosKpi,
				faturamento: faturamentoKpi,
				produtos: produtosKpi,
				performance: performanceKpi,
				clientes: clientesKpi,
				conversao: await calcularKpisConclusao(pedidos),
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
