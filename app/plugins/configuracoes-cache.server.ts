/**
 * 📌 Plugin: Configurações Cache (Server-side)
 *
 * Carrega e cacheia os dados de configurações do estabelecimento no servidor.
 * Garante que todas as tabs tenham acesso aos dados sem múltiplas requisições.
 *
 * ⚡ OTIMIZAÇÃO: Cache com TTL de 10 minutos (configurações mudam raramente)
 *
 * Dados carregados:
 * - Dados da empresa (nome, slug, descrição, logo, whatsapp)
 * - Horários de funcionamento
 * - Métodos de pagamento
 * - Configurações de frete e entrega
 * - Personalização (tema/cores)
 */

import { createCacheWithTTL } from "~/lib/utils/cache";

export default defineNuxtPlugin(async () => {
	// Só executa em rotas de configurações
	const route = useRoute();
	if (!route.path.includes("/admin/configuracoes")) {
		return;
	}

	const supabase = useSupabaseClient();
	const userStore = useUserStore();
	const estabelecimentoStore = useEstabelecimentoStore();

	// Verificar autenticação
	if (!userStore.authUser?.id) {
		console.warn("[configuracoes-cache] Usuário não autenticado");
		return;
	}

	// Verificar se já tem estabelecimento na store
	if (!estabelecimentoStore.estabelecimento) {
		console.warn("[configuracoes-cache] Estabelecimento não encontrado na store");
		return;
	}

	try {
		const estabelecimentoId = estabelecimentoStore.estabelecimento.id;

		// Tipo para os dados do estabelecimento
		interface EstabelecimentoConfig {
			id: string;
			nome: string;
			slug: string;
			descricao: string | null;
			logo_url: string | null;
			logo_url_dark: string | null;
			whatsapp: string | null;
			config_geral: Record<string, unknown> | null;
			config_pagamento: Record<string, unknown> | null;
			config_tema: Record<string, unknown> | null;
			onboarding: boolean;
		}

		// ⚡ Cache para configurações (TTL: 10 minutos - mudam raramente)
		const configCache = createCacheWithTTL<EstabelecimentoConfig>(
			`config-${estabelecimentoId}`,
			10 * 60 * 1000, // 10 minutos
		);

		// Buscar dados completos do estabelecimento com cache
		const estabelecimento: EstabelecimentoConfig = await configCache.get(async () => {
			const { data, error } = await supabase
				.from("estabelecimentos")
				.select(
					`
				id,
				nome,
				slug,
				descricao,
				logo_url,
				logo_url_dark,
				whatsapp,
				config_geral,
				config_pagamento,
				config_tema,
				onboarding
			`,
				)
				.eq("id", estabelecimentoId)
				.single();

			if (error) {
				console.error("[configuracoes-cache] Erro ao buscar configurações:", error);
				throw error;
			}

			if (!data) {
				console.warn("[configuracoes-cache] Estabelecimento não encontrado");
				throw new Error("Estabelecimento não encontrado");
			}

			return data as EstabelecimentoConfig;
		});

		// Atualizar store com dados completos
		estabelecimentoStore.$patch((state) => {
			if (state.estabelecimento) {
				state.estabelecimento = {
					...state.estabelecimento,
					...estabelecimento,
				};
			}
		});
	} catch (err) {
		console.error("[configuracoes-cache] Erro inesperado:", err);
	}
});
