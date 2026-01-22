/**
 * 📌 Plugin: Configurações Cache (Server-side)
 *
 * Carrega e cacheia os dados de configurações do estabelecimento no servidor.
 * Garante que todas as tabs tenham acesso aos dados sem múltiplas requisições.
 *
 * Dados carregados:
 * - Dados da empresa (nome, slug, descrição, logo, whatsapp)
 * - Horários de funcionamento
 * - Métodos de pagamento
 * - Configurações de frete e entrega
 * - Personalização (tema/cores)
 */

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
		// Buscar dados completos do estabelecimento
		const { data: estabelecimento, error } = await supabase
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
			.eq("id", estabelecimentoStore.estabelecimento.id)
			.single();

		if (error) {
			console.error("[configuracoes-cache] Erro ao buscar configurações:", error);
			return;
		}

		if (!estabelecimento) {
			console.warn("[configuracoes-cache] Estabelecimento não encontrado");
			return;
		}

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
