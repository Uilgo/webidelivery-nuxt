/**
 * 📌 Plugin de Cache de Relatórios (Server-side)
 *
 * Busca os dados de relatórios NO SERVIDOR e popula o useState.
 * Quando o cliente hidrata, os dados já estão disponíveis = carregamento instantâneo.
 *
 * ⚡ OTIMIZAÇÃO: Carrega dados de TODAS as abas no servidor para evitar skeletons
 *
 * IMPORTANTE: Os dados são protegidos por RLS, então só carrega se o usuário estiver autenticado.
 */

import type { FiltrosPeriodo } from "~/features/admin/relatorios/types/relatorios";

export default defineNuxtPlugin(async () => {
	// Só executar no server-side
	if (!import.meta.server) return;

	// Só carregar dados de relatórios na rota de relatórios
	const route = useRoute();
	if (!route.path.includes("/admin/relatorios")) return;

	const user = useSupabaseUser();
	const userId = user.value?.id ?? (user.value as { sub?: string } | null)?.sub;

	// Se não há usuário logado, não carregar dados de relatórios
	if (!userId) return;

	const supabase = useSupabaseClient();
	const estabelecimentoStore = useEstabelecimentoStore();

	try {
		// Buscar estabelecimento_id e onboarding do usuário
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

		if (!perfil?.estabelecimento_id) {
			console.warn("[relatorios-cache] Estabelecimento não encontrado");
			return;
		}

		const estabelecimentos = (
			Array.isArray(perfil.estabelecimentos) ? perfil.estabelecimentos[0] : perfil.estabelecimentos
		) as {
			id: string;
			onboarding: boolean;
		} | null;

		if (!estabelecimentos || estabelecimentos.onboarding === false) {
			console.warn("[relatorios-cache] Onboarding não concluído");
			return;
		}

		// Garantir que o estabelecimento está na store
		if (!estabelecimentoStore.estabelecimento) {
			estabelecimentoStore.$patch({
				estabelecimento: {
					id: estabelecimentos.id,
					onboarding: estabelecimentos.onboarding,
				} as unknown as typeof estabelecimentoStore.estabelecimento,
			});
		}

		// ========================================
		// DEFINIR PERÍODO PADRÃO (ESTE MÊS)
		// ========================================

		const hoje = new Date();
		const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
		primeiroDiaMes.setHours(0, 0, 0, 0);
		const fimHoje = new Date(hoje);
		fimHoje.setHours(23, 59, 59, 999);

		const filtros: FiltrosPeriodo = {
			preset: "este_mes",
			data_inicio: primeiroDiaMes.toISOString(),
			data_fim: fimHoje.toISOString(),
		};

		// ========================================
		// CARREGAR DADOS DE TODAS AS ABAS
		// ========================================

		// Importar todos os composables
		const { useRelatoriosPedidos } =
			await import("../features/admin/relatorios/composables/useRelatoriosPedidos");
		const { useRelatoriosVendas } =
			await import("../features/admin/relatorios/composables/useRelatoriosVendas");
		const { useRelatoriosProdutos } =
			await import("../features/admin/relatorios/composables/useRelatoriosProdutos");
		const { useRelatoriosMarketing } =
			await import("../features/admin/relatorios/composables/useRelatoriosMarketing");
		const { useRelatoriosFinanceiro } =
			await import("../features/admin/relatorios/composables/useRelatoriosFinanceiro");

		// Carregar dados de todas as abas em paralelo
		const resultados = await Promise.allSettled([
			useRelatoriosPedidos().fetchDados(filtros),
			useRelatoriosVendas().fetchDados(filtros),
			useRelatoriosProdutos().fetchDados(filtros),
			useRelatoriosMarketing().fetchDados(filtros),
			useRelatoriosFinanceiro().fetchDados(filtros),
		]);

		// Log de resultados para debug
		resultados.forEach((resultado, index) => {
			const nomes = ["Pedidos", "Vendas", "Produtos", "Marketing", "Financeiro"];
			if (resultado.status === "rejected") {
				console.warn(`[relatorios-cache] ${nomes[index]} falhou:`, resultado.reason);
			}
		});
	} catch (error) {
		console.error("[relatorios-cache] Erro ao carregar dados:", error);
	}
});
