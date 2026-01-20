/**
 * 📌 Plugin de Cache da Dashboard (Server-side)
 *
 * Busca os dados da dashboard NO SERVIDOR e popula o useState.
 * Quando o cliente hidrata, os dados já estão disponíveis = carregamento instantâneo.
 *
 * IMPORTANTE: Os dados são protegidos por RLS, então só carrega se o usuário estiver autenticado.
 */

import type { DashboardKpis, DashboardCharts } from "~/features/admin/dashboard/types/dashboard";
import { startOfDay } from "date-fns";

export default defineNuxtPlugin(async () => {
	// Só executar no server-side
	if (!import.meta.server) return;

	const user = useSupabaseUser();
	const userId = user.value?.id ?? (user.value as { sub?: string } | null)?.sub;

	// Se não há usuário logado, não carregar dados da dashboard
	if (!userId) return;

	const supabase = useSupabaseClient();

	// Inicializar os estados globais
	const kpis = useState<DashboardKpis | null>("admin-dashboard-kpis", () => null);
	const charts = useState<DashboardCharts | null>("admin-dashboard-charts", () => null);
	useState<boolean>("admin-dashboard-loading", () => false);
	const dashboardCacheLoaded = useState<boolean>("admin-dashboard-cache-loaded", () => false);

	try {
		// Definir intervalo padrão (hoje)
		const hoje = new Date();
		const dataInicio = startOfDay(hoje).toISOString().split("T")[0];
		const dataFim = hoje.toISOString().split("T")[0];

		// Buscar TODOS os pedidos de hoje (para KPIs e Charts)
		const { data: pedidosHoje, error: pedidosError } = await supabase
			.from("pedidos")
			.select("*")
			.gte("created_at", `${dataInicio}T00:00:00-03:00`)
			.lte("created_at", `${dataFim}T23:59:59.999-03:00`);

		if (pedidosError) throw pedidosError;

		// Buscar pedidos recentes (últimos 10) para realtime
		const { data: _pedidosRecentes, error: recentesError } = await supabase
			.from("pedidos")
			.select("*")
			.order("created_at", { ascending: false })
			.limit(10);

		if (recentesError) throw recentesError;

		// Buscar clientes novos de hoje
		const { data: clientesNovos, error: clientesError } = await supabase
			.from("clientes")
			.select("id")
			.gte("primeiro_pedido_em", `${dataInicio}T00:00:00-03:00`)
			.lte("primeiro_pedido_em", `${dataFim}T23:59:59.999-03:00`);

		if (clientesError) throw clientesError;

		// Buscar produtos mais vendidos com faturamento
		const { data: produtosMaisVendidos, error: produtosError } = await supabase.rpc(
			"fn_buscar_produtos_mais_vendidos",
			{
				p_limit: 10,
			},
		);

		if (produtosError) throw produtosError;

		// Calcular KPIs básicos
		const pedidos = pedidosHoje || [];
		const totalPedidos = pedidos.length;
		const pedidosConcluidos = pedidos.filter((p) => p.status === "concluido");
		const faturamentoHoje = pedidosConcluidos.reduce((acc, p) => acc + p.total, 0);
		const ticketMedio =
			pedidosConcluidos.length > 0 ? faturamentoHoje / pedidosConcluidos.length : 0;
		const taxaConclusao =
			totalPedidos > 0 ? Math.round((pedidosConcluidos.length / totalPedidos) * 100) : 0;

		// Calcular performance - Tempo médio de preparo (aceito_em -> pronto_em)
		const temposPreparoMinutos = pedidosConcluidos
			.filter((p) => p.aceito_em && p.pronto_em)
			.map((p) => {
				const aceito = new Date(p.aceito_em!);
				const pronto = new Date(p.pronto_em!);
				return Math.round((pronto.getTime() - aceito.getTime()) / (1000 * 60));
			});

		const tempoMedioPreparo =
			temposPreparoMinutos.length > 0
				? Math.round(
						temposPreparoMinutos.reduce((acc, t) => acc + t, 0) / temposPreparoMinutos.length,
					)
				: 0;

		// Tempo médio de entrega (pronto_em -> concluido_em, apenas delivery)
		const temposEntregaMinutos = pedidosConcluidos
			.filter((p) => p.pronto_em && p.concluido_em && p.tipo_entrega === "delivery")
			.map((p) => {
				const pronto = new Date(p.pronto_em!);
				const concluido = new Date(p.concluido_em!);
				return Math.round((concluido.getTime() - pronto.getTime()) / (1000 * 60));
			});

		const tempoMedioEntrega =
			temposEntregaMinutos.length > 0
				? Math.round(
						temposEntregaMinutos.reduce((acc, t) => acc + t, 0) / temposEntregaMinutos.length,
					)
				: 0;

		// Buscar satisfação média
		const { data: avaliacoes } = await supabase.from("avaliacoes").select("nota");
		const satisfacaoMedia =
			avaliacoes && avaliacoes.length > 0
				? Number((avaliacoes.reduce((acc, a) => acc + a.nota, 0) / avaliacoes.length).toFixed(1))
				: 0;

		// Entregas no prazo (< 45 min do pronto_em até concluido_em)
		const PRAZO_ENTREGA_MINUTOS = 45;
		const entregasNoPrazo = pedidosConcluidos.filter((p) => {
			if (!p.pronto_em || !p.concluido_em || p.tipo_entrega !== "delivery") return false;
			const pronto = new Date(p.pronto_em);
			const concluido = new Date(p.concluido_em);
			const tempoEntrega = Math.round((concluido.getTime() - pronto.getTime()) / (1000 * 60));
			return tempoEntrega <= PRAZO_ENTREGA_MINUTOS;
		}).length;

		const totalEntregas = pedidosConcluidos.filter((p) => p.tipo_entrega === "delivery").length;
		const percentualNoPrazo =
			totalEntregas > 0 ? Math.round((entregasNoPrazo / totalEntregas) * 100) : 0;

		// Montar KPIs
		kpis.value = {
			pedidos_hoje: {
				total: totalPedidos,
				pendentes: pedidos.filter((p) => p.status === "pendente").length,
				em_andamento: pedidos.filter((p) =>
					["aceito", "preparo", "pronto", "entrega"].includes(p.status),
				).length,
				concluidos: pedidosConcluidos.length,
				cancelados: pedidos.filter((p) => p.status === "cancelado").length,
				variacao_ontem: 0,
			},
			faturamento: {
				hoje: faturamentoHoje,
				semana: faturamentoHoje,
				mes: faturamentoHoje,
				ticket_medio: ticketMedio,
				variacao_semana: 0,
			},
			clientes: {
				novos: clientesNovos?.length || 0,
				recorrencia: 0,
				variacao: 0,
			},
			conversao: {
				taxa: taxaConclusao,
				visitas: totalPedidos,
				variacao: 0,
			},
			produtos: {
				total_ativos: produtosMaisVendidos?.length || 0,
				mais_vendidos: (produtosMaisVendidos || []).map(
					(p: { id: string; nome: string; total_vendas: number; faturamento_total: number }) => ({
						id: p.id,
						nome: p.nome,
						quantidade_vendida: p.total_vendas || 0,
						faturamento: p.faturamento_total || 0,
					}),
				),
				menos_vendidos: [],
			},
			performance: {
				tempo_medio_preparo: tempoMedioPreparo,
				tempo_medio_entrega: tempoMedioEntrega,
				total_cancelamentos: pedidos.filter((p) => p.status === "cancelado").length,
				taxa_cancelamento:
					totalPedidos > 0
						? Math.round(
								(pedidos.filter((p) => p.status === "cancelado").length / totalPedidos) * 100,
							)
						: 0,
				satisfacao_media: satisfacaoMedia,
				entregas_no_prazo: percentualNoPrazo,
			},
		};

		// Montar Charts (dados básicos para hoje)
		charts.value = {
			pedidos_por_hora: {
				labels: [],
				datasets: { pedidos: [], faturamento: [] },
			},
			faturamento_semanal: {
				labels: [],
				datasets: { atual: [], anterior: [] },
			},
			status_distribuicao: {
				labels: [],
				data: [],
				colors: [],
			},
			produtos_ranking: {
				labels: (produtosMaisVendidos || []).map((p: { nome: string }) => p.nome),
				data: (produtosMaisVendidos || []).map(
					(p: { total_vendas: number }) => p.total_vendas || 0,
				),
				produtos: (produtosMaisVendidos || []).map(
					(p: { id: string; nome: string; total_vendas: number; faturamento_total: number }) => ({
						id: p.id,
						nome: p.nome,
						quantidade_vendida: p.total_vendas || 0,
						faturamento: p.faturamento_total || 0,
					}),
				),
			},
			horarios_heatmap: {
				dias: [],
				horas: [],
				data: [],
			},
		};

		// Marcar cache como carregado
		dashboardCacheLoaded.value = true;
	} catch (error) {
		console.error("[DashboardCache] Erro ao carregar dados:", error);
	}
});
