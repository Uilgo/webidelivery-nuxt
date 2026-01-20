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
			// Para pegar todos os pedidos de hoje, usa o final do dia (23:59:59) em vez da hora atual
			if (intervalo.inicio) {
				const dataInicio = intervalo.inicio.toISOString().split("T")[0];
				query = query.gte("created_at", `${dataInicio}T00:00:00-03:00`);
			}
			if (intervalo.fim) {
				const dataFim = intervalo.fim.toISOString().split("T")[0];
				query = query.lte("created_at", `${dataFim}T23:59:59.999-03:00`);
			}

			const { data, error } = await query;

			if (error) throw error;
			return data as unknown as PedidoCompleto[];
		} catch (error) {
			console.error("[KPIs] Erro ao buscar pedidos:", error);
			throw new Error(`Erro ao buscar pedidos: ${error}`);
		}
	};

	/**
	 * Calcula KPIs de pedidos baseados no período selecionado
	 * Respeita o filtro de período e calcula variação vs período anterior equivalente
	 */
	const calcularKpisPedidos = (
		pedidos: PedidoCompleto[],
		intervalo: { inicio: Date | null; fim: Date | null },
	): KpiPedidos => {
		const hoje = new Date();

		// === CÁLCULO DO PERÍODO SELECIONADO ===
		let pedidosPeriodo: PedidoCompleto[];
		let pedidosPeriodoAnterior: PedidoCompleto[];

		if (intervalo.inicio && intervalo.fim) {
			// Calcula duração do período em milissegundos
			const duracaoPeriodo = intervalo.fim.getTime() - intervalo.inicio.getTime();

			// Filtra pedidos do período selecionado
			pedidosPeriodo = pedidos.filter((p) => {
				const dataPedido = new Date(p.created_at);
				return dataPedido >= intervalo.inicio! && dataPedido <= intervalo.fim!;
			});

			// Calcula período anterior equivalente
			const fimAnterior = new Date(intervalo.inicio.getTime() - 1); // 1ms antes do início
			const inicioAnterior = new Date(fimAnterior.getTime() - duracaoPeriodo);

			pedidosPeriodoAnterior = pedidos.filter((p) => {
				const dataPedido = new Date(p.created_at);
				return dataPedido >= inicioAnterior && dataPedido <= fimAnterior;
			});
		} else {
			// Default: hoje vs ontem
			pedidosPeriodo = pedidos.filter((p) => isSameDay(new Date(p.created_at), hoje));
			const ontem = subDays(hoje, 1);
			pedidosPeriodoAnterior = pedidos.filter((p) => isSameDay(new Date(p.created_at), ontem));
		}

		// Calcula variação vs período anterior
		const totalPeriodo = pedidosPeriodo.length;
		const totalAnterior = pedidosPeriodoAnterior.length;

		let variacao = 0;
		if (totalPeriodo === 0 && totalAnterior === 0) {
			variacao = 0;
		} else if (totalAnterior === 0) {
			variacao = totalPeriodo > 0 ? 100 : 0;
		} else {
			variacao = Math.round(((totalPeriodo - totalAnterior) / totalAnterior) * 100);
		}

		return {
			total: pedidosPeriodo.length,
			pendentes: pedidosPeriodo.filter((p) => p.status === "pendente").length,
			em_andamento: pedidosPeriodo.filter((p) =>
				["aceito", "preparo", "pronto", "entrega"].includes(p.status),
			).length,
			concluidos: pedidosPeriodo.filter((p) => p.status === "concluido").length,
			cancelados: pedidosPeriodo.filter((p) => p.status === "cancelado").length,
			variacao_ontem: variacao,
		};
	};

	/**
	 * Calcula KPIs de faturamento baseados no período selecionado
	 * Respeita o filtro de período e calcula variação vs período anterior equivalente
	 */
	const calcularKpisFaturamento = (
		pedidos: PedidoCompleto[],
		intervalo: { inicio: Date | null; fim: Date | null },
	): KpiFaturamento => {
		const hoje = new Date();
		const inicioSemana = subDays(hoje, 6); // Últimos 7 dias
		const semanaPassada = subDays(inicioSemana, 7);

		// Filtra todos os pedidos concluídos
		const todosPedidosConcluidos = pedidos.filter((p) => p.status === "concluido");

		// === CÁLCULO DO PERÍODO SELECIONADO ===
		let pedidosPeriodo: PedidoCompleto[];
		let pedidosPeriodoAnterior: PedidoCompleto[];

		if (intervalo.inicio && intervalo.fim) {
			// Calcula duração do período em milissegundos
			const duracaoPeriodo = intervalo.fim.getTime() - intervalo.inicio.getTime();

			// Filtra pedidos do período selecionado
			pedidosPeriodo = todosPedidosConcluidos.filter((p) => {
				const dataPedido = new Date(p.created_at);
				return dataPedido >= intervalo.inicio! && dataPedido <= intervalo.fim!;
			});

			// Calcula período anterior equivalente
			const fimAnterior = new Date(intervalo.inicio.getTime() - 1); // 1ms antes do início
			const inicioAnterior = new Date(fimAnterior.getTime() - duracaoPeriodo);

			pedidosPeriodoAnterior = todosPedidosConcluidos.filter((p) => {
				const dataPedido = new Date(p.created_at);
				return dataPedido >= inicioAnterior && dataPedido <= fimAnterior;
			});
		} else {
			// Default: hoje
			pedidosPeriodo = todosPedidosConcluidos.filter((p) =>
				isSameDay(new Date(p.created_at), hoje),
			);
			const ontem = subDays(hoje, 1);
			pedidosPeriodoAnterior = todosPedidosConcluidos.filter((p) =>
				isSameDay(new Date(p.created_at), ontem),
			);
		}

		// Calcula faturamento do período e período anterior
		const faturamentoPeriodo = pedidosPeriodo.reduce((acc, p) => acc + p.total, 0);
		const faturamentoPeriodoAnterior = pedidosPeriodoAnterior.reduce((acc, p) => acc + p.total, 0);

		// Calcula ticket médio do período selecionado
		const pedidosComValor = pedidosPeriodo.filter((p) => p.total > 0);
		const ticketMedio =
			pedidosComValor.length > 0
				? pedidosComValor.reduce((acc, p) => acc + p.total, 0) / pedidosComValor.length
				: 0;

		// Calcula variação vs período anterior
		const variacao =
			faturamentoPeriodo === 0 && faturamentoPeriodoAnterior === 0
				? 0
				: faturamentoPeriodoAnterior === 0
					? faturamentoPeriodo > 0
						? 100
						: 0
					: Math.round(
							((faturamentoPeriodo - faturamentoPeriodoAnterior) / faturamentoPeriodoAnterior) *
								100,
						);

		// === CÁLCULOS LEGADOS (mantidos para compatibilidade) ===
		const faturamentoHoje = todosPedidosConcluidos
			.filter((p) => isSameDay(new Date(p.created_at), hoje))
			.reduce((acc, p) => acc + p.total, 0);

		const faturamentoSemana = todosPedidosConcluidos
			.filter((p) => new Date(p.created_at) >= inicioSemana)
			.reduce((acc, p) => acc + p.total, 0);

		const faturamentoSemanaPassada = todosPedidosConcluidos
			.filter((p) => {
				const data = new Date(p.created_at);
				return data >= semanaPassada && data < inicioSemana;
			})
			.reduce((acc, p) => acc + p.total, 0);

		const variacaoSemana =
			faturamentoSemana === 0 && faturamentoSemanaPassada === 0
				? 0
				: faturamentoSemanaPassada === 0
					? faturamentoSemana > 0
						? 100
						: 0
					: Math.round(
							((faturamentoSemana - faturamentoSemanaPassada) / faturamentoSemanaPassada) * 100,
						);

		return {
			// Novos campos que respeitam o período
			periodo: faturamentoPeriodo,
			periodo_anterior: faturamentoPeriodoAnterior,
			ticket_medio: ticketMedio,
			variacao,
			// Campos legados
			hoje: faturamentoHoje,
			semana: faturamentoSemana,
			mes: 0,
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

			// Busca produtos mais vendidos com faturamento via RPC
			const { data: maisVendidos, error } = await supabase.rpc("fn_buscar_produtos_mais_vendidos", {
				p_limit: 10,
			});

			if (error) throw error;

			// Formata produtos mais vendidos
			const produtosMaisVendidos: ProdutoRanking[] =
				maisVendidos?.map(
					(p: { id: string; nome: string; total_vendas: number; faturamento_total: number }) => ({
						id: p.id,
						nome: p.nome,
						quantidade_vendida: p.total_vendas || 0,
						faturamento: p.faturamento_total || 0,
					}),
				) || [];

			return {
				total_ativos: totalAtivos || 0,
				mais_vendidos: produtosMaisVendidos,
				menos_vendidos: [],
			};
		} catch {
			return {
				total_ativos: 0,
				mais_vendidos: [],
				menos_vendidos: [],
			};
		}
	};

	/**
	 * Calcula KPIs de clientes via Supabase
	 * Respeita o filtro de período e calcula variação vs período anterior equivalente
	 */
	const calcularKpisClientes = async (intervalo: {
		inicio: Date | null;
		fim: Date | null;
	}): Promise<{ novos: number; recorrencia: number; variacao: number }> => {
		try {
			const supabase = useSupabaseClient();
			const hoje = new Date();
			hoje.setHours(23, 59, 59, 999); // Final do dia para garantir que pegue todos

			// Calcula período anterior equivalente
			let dataInicio: Date;
			let dataFim: Date;
			let dataInicioAnterior: Date;
			let dataFimAnterior: Date;

			if (intervalo.inicio && intervalo.fim) {
				dataInicio = intervalo.inicio;
				dataFim = intervalo.fim;

				// Calcula duração do período
				const duracaoPeriodo = dataFim.getTime() - dataInicio.getTime();

				// Período anterior equivalente
				dataFimAnterior = new Date(dataInicio.getTime() - 1);
				dataInicioAnterior = new Date(dataFimAnterior.getTime() - duracaoPeriodo);
			} else {
				// Default: hoje vs ontem
				const inicioHoje = new Date();
				inicioHoje.setHours(0, 0, 0, 0);
				dataInicio = inicioHoje;
				dataFim = hoje;

				const ontem = subDays(inicioHoje, 1);
				dataInicioAnterior = ontem;
				dataFimAnterior = new Date(ontem);
				dataFimAnterior.setHours(23, 59, 59, 999);
			}

			// Busca novos clientes no período selecionado
			const { data: novosClientes } = await supabase
				.from("clientes")
				.select("id")
				.gte("primeiro_pedido_em", dataInicio.toISOString())
				.lte("primeiro_pedido_em", dataFim.toISOString());

			// Busca novos clientes no período anterior para comparação
			const { data: novosClientesAnterior } = await supabase
				.from("clientes")
				.select("id")
				.gte("primeiro_pedido_em", dataInicioAnterior.toISOString())
				.lte("primeiro_pedido_em", dataFimAnterior.toISOString());

			// Calcula variação
			const novosPeriodo = novosClientes?.length || 0;
			const novosAnterior = novosClientesAnterior?.length || 0;

			let variacao = 0;
			if (novosPeriodo === 0 && novosAnterior === 0) {
				variacao = 0;
			} else if (novosAnterior === 0) {
				variacao = novosPeriodo > 0 ? 100 : 0;
			} else {
				variacao = Math.round(((novosPeriodo - novosAnterior) / novosAnterior) * 100);
			}

			// Busca taxa de recorrência (clientes com mais de 1 pedido)
			// Conta pedidos por cliente diretamente da tabela de pedidos (mais preciso)
			const { data: pedidosPorCliente } = await supabase
				.from("pedidos")
				.select("cliente_id")
				.not("cliente_id", "is", null);

			// Agrupa pedidos por cliente_id e conta
			const contagemPorCliente: Record<string, number> = {};
			pedidosPorCliente?.forEach((p) => {
				if (p.cliente_id) {
					contagemPorCliente[p.cliente_id] = (contagemPorCliente[p.cliente_id] || 0) + 1;
				}
			});

			const clientesUnicos = Object.keys(contagemPorCliente).length;
			const clientesRecorrentes = Object.values(contagemPorCliente).filter(
				(count) => count > 1,
			).length;
			const taxaRecorrencia =
				clientesUnicos > 0 ? Math.round((clientesRecorrentes / clientesUnicos) * 100) : 0;

			return {
				novos: novosPeriodo,
				recorrencia: taxaRecorrencia,
				variacao,
			};
		} catch {
			return {
				novos: 0,
				recorrencia: 0,
				variacao: 0,
			};
		}
	};

	/**
	 * Calcula KPI de Taxa de Conclusão (substitui Conversão)
	 * Respeita o filtro de período e calcula variação vs período anterior equivalente
	 */
	const calcularKpisConclusao = async (
		pedidos: PedidoCompleto[],
		intervalo: { inicio: Date | null; fim: Date | null },
	): Promise<{ taxa: number; visitas: number; variacao: number }> => {
		const hoje = new Date();

		// === CÁLCULO DO PERÍODO SELECIONADO ===
		let pedidosPeriodo: PedidoCompleto[];
		let pedidosPeriodoAnterior: PedidoCompleto[];

		const inter = {
			inicio: intervalo.inicio,
			fim: intervalo.fim,
		};

		if (inter.inicio && inter.fim) {
			const duracaoPeriodo = inter.fim.getTime() - inter.inicio.getTime();

			pedidosPeriodo = pedidos.filter((p) => {
				const dataPedido = new Date(p.created_at);
				return dataPedido >= inter.inicio! && dataPedido <= inter.fim!;
			});

			const fimAnterior = new Date(inter.inicio.getTime() - 1);
			const inicioAnterior = new Date(fimAnterior.getTime() - duracaoPeriodo);

			pedidosPeriodoAnterior = pedidos.filter((p) => {
				const dataPedido = new Date(p.created_at);
				return dataPedido >= inicioAnterior && dataPedido <= fimAnterior;
			});
		} else {
			pedidosPeriodo = pedidos.filter((p) => isSameDay(new Date(p.created_at), hoje));
			const ontem = subDays(hoje, 1);
			pedidosPeriodoAnterior = pedidos.filter((p) => isSameDay(new Date(p.created_at), ontem));
		}

		// Calcula taxas
		const totalPeriodo = pedidosPeriodo.length;
		const concluidosPeriodo = pedidosPeriodo.filter((p) => p.status === "concluido").length;
		const taxaPeriodo = totalPeriodo > 0 ? Math.round((concluidosPeriodo / totalPeriodo) * 100) : 0;

		const totalAnterior = pedidosPeriodoAnterior.length;
		const concluidosAnterior = pedidosPeriodoAnterior.filter(
			(p) => p.status === "concluido",
		).length;
		const taxaAnterior =
			totalAnterior > 0 ? Math.round((concluidosAnterior / totalAnterior) * 100) : 0;

		// Diferença em pontos percentuais
		const variacao = taxaPeriodo - taxaAnterior;

		return {
			taxa: taxaPeriodo,
			visitas: totalPeriodo, // "Visitas" aqui representa o total de pedidos iniciados
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
		} catch {
			// Retorna 0 em caso de erro
		}

		// Calcula entregas no prazo (do pronto_em até concluido_em, prazo de 45 minutos)
		const PRAZO_ENTREGA_MINUTOS = 45;
		const entregasNoPrazo = pedidosConcluidos.filter((p) => {
			if (!p.pronto_em || !p.concluido_em || p.tipo_entrega !== "delivery") return false;
			const tempoEntrega = differenceInMinutes(new Date(p.concluido_em), new Date(p.pronto_em));
			return tempoEntrega <= PRAZO_ENTREGA_MINUTOS;
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

		// Retorna cache se válido (TTL de 5 minutos)
		if (cached && isCacheValido(cached.timestamp)) {
			return cached.data;
		}

		try {
			// Busca dados necessários
			const pedidos = await buscarPedidos(intervalo);

			// Calcula KPIs em paralelo
			const [pedidosKpi, faturamentoKpi, produtosKpi, performanceKpi, clientesKpi] =
				await Promise.all([
					calcularKpisPedidos(pedidos, intervalo),
					calcularKpisFaturamento(pedidos, intervalo),
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
				conversao: await calcularKpisConclusao(pedidos, intervalo),
			};

			// Salva no cache (TTL de 5 minutos)
			cache.value.set(chaveCache, {
				data: kpis,
				timestamp: Date.now(),
			});

			return kpis;
		} catch (error) {
			console.error("[KPIs] Erro ao calcular KPIs:", error);
			throw new Error(`Erro ao calcular KPIs: ${error}`);
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
