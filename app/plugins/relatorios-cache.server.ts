/**
 * 📌 Plugin de Cache de Relatórios (Server-side)
 *
 * Busca os dados de relatórios NO SERVIDOR e popula o useState.
 * Quando o cliente hidrata, os dados já estão disponíveis = carregamento instantâneo.
 *
 * INTELIGENTE: Carrega apenas os dados da aba ativa (detectada via URL query ou cookie)
 *
 * IMPORTANTE: Os dados são protegidos por RLS, então só carrega se o usuário estiver autenticado.
 */

import type { AbaRelatorio, FiltrosPeriodo } from "~/features/admin/relatorios/types/relatorios";

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

	// Inicializar os estados globais
	const abaAtiva = useState<AbaRelatorio>("relatorios.abaAtiva", () => "pedidos");

	// Estado global de cache
	const relatoriosCacheLoaded = useState<boolean>("relatorios-cache-loaded", () => false);

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
			console.warn("[RelatoriosCache] ⚠️ Estabelecimento não encontrado");
			relatoriosCacheLoaded.value = true;
			return;
		}

		const estabelecimentos = (
			Array.isArray(perfil.estabelecimentos) ? perfil.estabelecimentos[0] : perfil.estabelecimentos
		) as {
			id: string;
			onboarding: boolean;
		} | null;

		if (!estabelecimentos || estabelecimentos.onboarding === false) {
			console.warn("[RelatoriosCache] ⚠️ Onboarding não concluído");
			relatoriosCacheLoaded.value = true;
			return;
		}

		// ========================================
		// DETECTAR ABA ATIVA
		// ========================================

		// 1. Tentar pegar da URL query
		let abaParaCarregar: AbaRelatorio = "pedidos";

		if (route.query.tab && typeof route.query.tab === "string") {
			const tabFromUrl = route.query.tab as AbaRelatorio;
			const abasValidas: AbaRelatorio[] = [
				"pedidos",
				"vendas",
				"produtos",
				"marketing",
				"financeiro",
			];

			if (abasValidas.includes(tabFromUrl)) {
				abaParaCarregar = tabFromUrl;
			}
		} else {
			// 2. Se não tem na URL, tentar pegar do cookie
			const cookies = useRequestHeaders(["cookie"]);
			const cookieHeader = cookies.cookie || "";

			// Parse manual do cookie (simples)
			const match = cookieHeader.match(/relatorios-last-tab=([^;]+)/);
			if (match && match[1]) {
				const tabFromCookie = decodeURIComponent(match[1]) as AbaRelatorio;
				const abasValidas: AbaRelatorio[] = [
					"pedidos",
					"vendas",
					"produtos",
					"marketing",
					"financeiro",
				];

				if (abasValidas.includes(tabFromCookie)) {
					abaParaCarregar = tabFromCookie;
				}
			}
		}

		// Atualizar estado da aba ativa
		abaAtiva.value = abaParaCarregar;

		// ========================================
		// DEFINIR PERÍODO PADRÃO (ÚLTIMOS 7 DIAS)
		// ========================================

		const hoje = new Date();
		const seteDiasAtras = new Date(hoje);
		seteDiasAtras.setDate(hoje.getDate() - 7);

		const filtros: FiltrosPeriodo = {
			preset: "ultimos_7_dias",
			data_inicio: seteDiasAtras.toISOString().split("T")[0] || "",
			data_fim: hoje.toISOString().split("T")[0] || "",
		};

		// ========================================
		// CARREGAR DADOS DA ABA ATIVA
		// ========================================

		switch (abaParaCarregar) {
			case "pedidos": {
				const { fetchDados } =
					await import("../features/admin/relatorios/composables/useRelatoriosPedidos").then((m) =>
						m.useRelatoriosPedidos(),
					);
				await fetchDados(filtros, true);
				break;
			}

			case "vendas": {
				const { fetchDados } =
					await import("../features/admin/relatorios/composables/useRelatoriosVendas").then((m) =>
						m.useRelatoriosVendas(),
					);
				await fetchDados(filtros, true);
				break;
			}

			case "produtos": {
				const { fetchDados } =
					await import("../features/admin/relatorios/composables/useRelatoriosProdutos").then((m) =>
						m.useRelatoriosProdutos(),
					);
				await fetchDados(filtros, true);
				break;
			}

			case "marketing": {
				const { fetchDados } =
					await import("../features/admin/relatorios/composables/useRelatoriosMarketing").then(
						(m) => m.useRelatoriosMarketing(),
					);
				await fetchDados(filtros, true);
				break;
			}

			case "financeiro": {
				const { fetchDados } =
					await import("../features/admin/relatorios/composables/useRelatoriosFinanceiro").then(
						(m) => m.useRelatoriosFinanceiro(),
					);
				await fetchDados(filtros, true);
				break;
			}
		}

		// Marcar cache como carregado
		relatoriosCacheLoaded.value = true;
	} catch (error) {
		console.error("[RelatoriosCache] ❌ Erro ao carregar dados:", error);
		// Mesmo com erro, marcar como "tentou carregar" para não bloquear a UI
		relatoriosCacheLoaded.value = true;
	}
});
