/**
 * 📌 Plugin: Logs Cache (Server-side)
 *
 * Carrega e cacheia os dados de logs do estabelecimento no servidor.
 * Garante que a tab de Logs tenha acesso aos dados sem múltiplas requisições.
 *
 * ⚡ OTIMIZAÇÃO: Cache com TTL de 5 minutos (logs mudam com frequência moderada)
 *
 * Dados carregados:
 * - Logs dos últimos 30 dias (padrão)
 * - Estatísticas gerais de logs
 */

import { createCacheWithTTL } from "~/lib/utils/cache";
import type { LogEstabelecimento, LogEstabelecimentoStats } from "#shared/types/logs";

export default defineNuxtPlugin(async () => {
	// Só executa em rotas de configurações/logs
	const route = useRoute();
	if (!route.path.includes("/admin/configuracoes")) {
		return;
	}

	const supabase = useSupabaseClient();
	const userStore = useUserStore();
	const estabelecimentoStore = useEstabelecimentoStore();

	// Verificar autenticação
	if (!userStore.authUser?.id) {
		return;
	}

	// Verificar se já tem estabelecimento na store
	if (!estabelecimentoStore.estabelecimento) {
		return;
	}

	try {
		const estabelecimentoId = estabelecimentoStore.estabelecimento.id;

		// ⚡ Cache para logs (TTL: 5 minutos)
		const logsCache = createCacheWithTTL<LogEstabelecimento[]>(
			`logs-${estabelecimentoId}`,
			5 * 60 * 1000, // 5 minutos
		);

		// ⚡ Cache para estatísticas (TTL: 5 minutos)
		const statsCache = createCacheWithTTL<LogEstabelecimentoStats>(
			`logs-stats-${estabelecimentoId}`,
			5 * 60 * 1000, // 5 minutos
		);

		// Buscar logs dos últimos 30 dias com cache
		const logs = await logsCache.get(async () => {
			const dataInicio = new Date();
			dataInicio.setDate(dataInicio.getDate() - 30);

			const { data, error } = await supabase
				.from("logs_estabelecimento")
				.select("*")
				.eq("estabelecimento_id", estabelecimentoId)
				.gte("created_at", dataInicio.toISOString())
				.order("created_at", { ascending: false });

			if (error) {
				console.error("[logs-cache] Erro ao buscar logs:", error);
				return [];
			}

			return (data || []) as LogEstabelecimento[];
		});

		// Buscar estatísticas com cache
		const stats = await statsCache.get(async () => {
			const { data, error } = await supabase
				.from("logs_estabelecimento")
				.select("*")
				.eq("estabelecimento_id", estabelecimentoId);

			if (error) {
				console.error("[logs-cache] Erro ao buscar estatísticas:", error);
				return {
					total: 0,
					por_tabela: {},
					por_acao: {},
					por_usuario: {},
					logs_proximos_exclusao: 0,
					periodo_mais_antigo: null,
					periodo_mais_recente: null,
				};
			}

			const logsData = (data || []) as LogEstabelecimento[];

			// Calcular estatísticas
			const porTabela: Record<string, number> = {};
			const porAcao: Record<string, number> = {};
			const porUsuario: Record<string, number> = {};

			logsData.forEach((log) => {
				porTabela[log.tabela] = (porTabela[log.tabela] || 0) + 1;
				porAcao[log.acao] = (porAcao[log.acao] || 0) + 1;
				if (log.usuario_nome) {
					porUsuario[log.usuario_nome] = (porUsuario[log.usuario_nome] || 0) + 1;
				}
			});

			// Calcular logs próximos da exclusão (< 30 dias)
			const logsProximosExclusao = logsData.filter((log) => {
				const dataLog = new Date(log.created_at);
				const dataExclusao = new Date(dataLog);
				dataExclusao.setMonth(dataExclusao.getMonth() + 12);

				const hoje = new Date();
				const diffTime = dataExclusao.getTime() - hoje.getTime();
				const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

				return diffDays > 0 && diffDays <= 30;
			}).length;

			const datas = logsData.map((l) => new Date(l.created_at));
			const periodoMaisAntigo =
				datas.length > 0 ? new Date(Math.min(...datas.map((d) => d.getTime()))) : null;
			const periodoMaisRecente =
				datas.length > 0 ? new Date(Math.max(...datas.map((d) => d.getTime()))) : null;

			return {
				total: logsData.length,
				por_tabela: porTabela,
				por_acao: porAcao,
				por_usuario: porUsuario,
				logs_proximos_exclusao: logsProximosExclusao,
				periodo_mais_antigo: periodoMaisAntigo?.toISOString() || null,
				periodo_mais_recente: periodoMaisRecente?.toISOString() || null,
			};
		});

		// Disponibilizar dados via useState para SSR
		useState("logs-estabelecimento", () => logs);
		useState("logs-stats", () => stats);
	} catch (err) {
		console.error("[logs-cache] Erro inesperado:", err);
	}
});
