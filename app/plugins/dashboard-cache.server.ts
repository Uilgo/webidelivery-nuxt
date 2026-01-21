/**
 * 📌 Plugin de Cache da Dashboard (Server-side)
 *
 * Busca os dados da dashboard NO SERVIDOR e popula o useState.
 * Quando o cliente hidrata, os dados já estão disponíveis = carregamento instantâneo.
 *
 * IMPORTANTE:
 * - Os dados são protegidos por RLS, então só carrega se o usuário estiver autenticado
 * - Plugin configurado com enforce: "pre" para executar ANTES da renderização
 * - Usa setup() assíncrono para garantir que dados sejam carregados antes do SSR
 */

import type {
	DashboardKpis,
	DashboardCharts,
	DashboardRealtime,
} from "~/features/admin/dashboard/types/dashboard";
import type { StatusPedido } from "~/features/public/pedido/types/pedido";
import { startOfDay } from "date-fns";

/**
 * Tipos para dados vindos do Supabase
 */
interface PedidoSupabase {
	id: string;
	numero: number;
	cliente_nome: string | null;
	status: StatusPedido;
	total: number;
	created_at: string;
	aceito_em: string | null;
	pronto_em: string | null;
	concluido_em: string | null;
	tipo_entrega: string;
}

interface AvaliacaoSupabase {
	nota: number;
}

interface ProdutoMaisVendido {
	id: string;
	nome: string;
	total_vendas: number;
	faturamento_total: number;
}

export default defineNuxtPlugin({
	name: "dashboard-cache",
	enforce: "pre", // Executar antes de outros plugins
	parallel: false, // Forçar execução sequencial
	async setup() {
		// Só executar no server-side
		if (!import.meta.server) return;

		// Só carregar dados de dashboard na rota de dashboard
		const route = useRoute();
		if (!route.path.includes("/admin/dashboard")) return;

		const user = useSupabaseUser();
		const userId = user.value?.id ?? (user.value as { sub?: string } | null)?.sub;

		// Se não há usuário logado, não carregar dados da dashboard
		if (!userId) return;

		const supabase = useSupabaseClient();

		// Inicializar os estados globais ANTES de qualquer coisa
		const kpis = useState<DashboardKpis | null>("admin-dashboard-kpis", () => null);
		const charts = useState<DashboardCharts | null>("admin-dashboard-charts", () => null);
		const realtime = useState<DashboardRealtime | null>("admin-dashboard-realtime", () => null);
		useState<boolean>("admin-dashboard-loading", () => false);
		const dashboardCacheLoaded = useState<boolean>("admin-dashboard-cache-loaded", () => false);

		try {
			// Buscar estabelecimento_id e status do onboarding do usuário
			const { data: perfil } = await supabase
				.from("perfis")
				.select(
					`
					estabelecimento_id,
					estabelecimentos:estabelecimento_id (
						id,
						onboarding
					)
				`,
				)
				.eq("id", userId)
				.single();

			// Se não tem estabelecimento ou onboarding não foi concluído, não carregar dados
			if (!perfil?.estabelecimento_id) {
				console.warn("[DashboardCache] ⚠️ Estabelecimento não encontrado");
				dashboardCacheLoaded.value = true;
				return;
			}

			const estabelecimentos = perfil.estabelecimentos as {
				id: string;
				onboarding: boolean;
			} | null;

			if (!estabelecimentos || estabelecimentos.onboarding === false) {
				console.warn("[DashboardCache] ⚠️ Onboarding não concluído, não carregando dados");
				dashboardCacheLoaded.value = true;
				return;
			}

			const estabelecimentoId = perfil.estabelecimento_id;

			// Definir intervalo padrão (hoje)
			const hoje = new Date();
			const dataInicio = startOfDay(hoje).toISOString().split("T")[0];
			const dataFim = hoje.toISOString().split("T")[0];

			// Buscar TODOS os pedidos de hoje (para KPIs e Charts) - FILTRADO POR ESTABELECIMENTO
			const { data: pedidosHoje, error: pedidosError } = await supabase
				.from("pedidos")
				.select("*")
				.eq("estabelecimento_id", estabelecimentoId)
				.gte("created_at", `${dataInicio}T00:00:00-03:00`)
				.lte("created_at", `${dataFim}T23:59:59.999-03:00`);

			if (pedidosError) throw pedidosError;

			// Buscar pedidos recentes (últimos 10) para realtime - FILTRADO POR ESTABELECIMENTO
			const { data: pedidosRecentes, error: recentesError } = await supabase
				.from("pedidos")
				.select("*")
				.eq("estabelecimento_id", estabelecimentoId)
				.order("created_at", { ascending: false })
				.limit(10);

			if (recentesError) throw recentesError;

			// Buscar clientes novos de hoje - FILTRADO POR ESTABELECIMENTO
			const { data: clientesNovos, error: clientesError } = await supabase
				.from("clientes")
				.select("id")
				.eq("estabelecimento_id", estabelecimentoId)
				.gte("primeiro_pedido_em", `${dataInicio}T00:00:00-03:00`)
				.lte("primeiro_pedido_em", `${dataFim}T23:59:59.999-03:00`);

			if (clientesError) throw clientesError;

			// Tipar clientes
			const clientesTyped = (clientesNovos || []) as { id: string }[];

			// Buscar produtos mais vendidos com faturamento - FILTRADO POR ESTABELECIMENTO
			const { data: produtosMaisVendidos, error: produtosError } = await supabase.rpc(
				"fn_buscar_produtos_mais_vendidos",
				{
					p_estabelecimento_id: estabelecimentoId,
					p_limit: 10,
				},
			);

			if (produtosError) throw produtosError;

			// Calcular KPIs básicos
			const pedidos = (pedidosHoje || []) as PedidoSupabase[];
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

			// Buscar satisfação média - FILTRADO POR ESTABELECIMENTO
			const { data: avaliacoes } = await supabase
				.from("avaliacoes")
				.select("nota")
				.eq("estabelecimento_id", estabelecimentoId);
			const avaliacoesTyped = (avaliacoes || []) as AvaliacaoSupabase[];
			const satisfacaoMedia =
				avaliacoesTyped.length > 0
					? Number(
							(
								avaliacoesTyped.reduce((acc, a) => acc + a.nota, 0) / avaliacoesTyped.length
							).toFixed(1),
						)
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

			// Tipar produtos mais vendidos
			const produtosTyped = (produtosMaisVendidos || []) as ProdutoMaisVendido[];

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
					// Novos campos obrigatórios
					periodo: faturamentoHoje,
					periodo_anterior: 0,
					ticket_medio: ticketMedio,
					variacao: 0,
					// Campos legados
					hoje: faturamentoHoje,
					semana: faturamentoHoje,
					mes: faturamentoHoje,
					variacao_semana: 0,
				},
				clientes: {
					novos: clientesTyped.length,
					recorrencia: 0,
					variacao: 0,
				},
				conversao: {
					taxa: taxaConclusao,
					visitas: totalPedidos,
					variacao: 0,
				},
				produtos: {
					total_ativos: produtosTyped.length,
					mais_vendidos: produtosTyped.map((p) => ({
						id: p.id,
						nome: p.nome,
						quantidade_vendida: p.total_vendas || 0,
						faturamento: p.faturamento_total || 0,
					})),
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

			// Montar Charts com dados reais de hoje
			// Gráfico de Pedidos por Hora (00:00 - 23:00)
			const pedidosPorHora = Array(24).fill(0);
			const faturamentoPorHora = Array(24).fill(0);

			pedidos.forEach((p) => {
				const hora = new Date(p.created_at).getHours();
				pedidosPorHora[hora]++;
				if (p.status === "concluido") {
					faturamentoPorHora[hora] += p.total;
				}
			});

			// Gráfico de Status (distribuição)
			const statusCount: Record<string, number> = {};
			pedidos.forEach((p) => {
				statusCount[p.status] = (statusCount[p.status] || 0) + 1;
			});

			const statusLabels = Object.keys(statusCount);
			const statusData = Object.values(statusCount);
			const statusColors = statusLabels.map((status) => {
				const colorMap: Record<string, string> = {
					pendente: "#f59e0b",
					aceito: "#3b82f6",
					preparo: "#8b5cf6",
					pronto: "#10b981",
					entrega: "#06b6d4",
					concluido: "#22c55e",
					cancelado: "#ef4444",
				};
				return colorMap[status] || "#6b7280";
			});

			charts.value = {
				pedidos_por_hora: {
					labels: Array.from({ length: 24 }, (_, i) => `${i}h`),
					datasets: {
						pedidos: pedidosPorHora,
						faturamento: faturamentoPorHora,
					},
				},
				faturamento_semanal: {
					labels: [],
					datasets: { atual: [], anterior: [] },
				},
				status_distribuicao: {
					labels: statusLabels,
					data: statusData,
					colors: statusColors,
				},
				produtos_ranking: {
					labels: produtosTyped.map((p) => p.nome),
					data: produtosTyped.map((p) => p.total_vendas || 0),
					produtos: produtosTyped.map((p) => ({
						id: p.id,
						nome: p.nome,
						quantidade_vendida: p.total_vendas || 0,
						faturamento: p.faturamento_total || 0,
					})),
				},
				horarios_heatmap: {
					dias: [],
					horas: [],
					data: [],
				},
			};

			// Montar Realtime (Feed de Pedidos e Eficiência Operacional)
			const pedidosRecentesTyped = (pedidosRecentes || []) as PedidoSupabase[];
			realtime.value = {
				pedidos_recentes: pedidosRecentesTyped.map((p) => ({
					id: p.id,
					numero: p.numero,
					cliente_nome: p.cliente_nome || "Cliente",
					status: p.status,
					valor_total: p.total,
					created_at: p.created_at,
				})),
				notificacoes: [],
				alertas: [],
			};

			// Marcar cache como carregado
			dashboardCacheLoaded.value = true;
		} catch (error) {
			console.error("[DashboardCache] ❌ Erro ao carregar dados:", error);
			// Mesmo com erro, marcar como "tentou carregar" para não bloquear a UI
			dashboardCacheLoaded.value = true;
		}
	},
});
