/**
 * 📌 Middleware: Onboarding
 *
 * Garante que usuários com onboarding pendente sejam redirecionados
 * para /admin/onboarding antes de acessar outras páginas do painel.
 *
 * IMPORTANTE:
 * - Executa no servidor E no cliente
 * - Bloqueia acesso a /admin/* (exceto /admin/onboarding) quando onboarding = false
 * - Permite acesso a /admin/onboarding mesmo com onboarding = false
 * - Redireciona para /admin/dashboard quando onboarding = true e está em /admin/onboarding
 */

export default defineNuxtRouteMiddleware(async (to) => {
	// Só aplicar em rotas /admin/*
	if (!to.path.startsWith("/admin")) {
		return;
	}

	const user = useSupabaseUser();
	const userId = user.value?.id ?? (user.value as { sub?: string } | null)?.sub;

	// Se não há usuário, deixar o middleware de auth lidar
	if (!userId) {
		return;
	}

	const supabase = useSupabaseClient();

	try {
		// Buscar status do onboarding
		const { data: perfil } = await supabase
			.from("perfis")
			.select(
				`
				estabelecimento_id,
				estabelecimentos:estabelecimento_id (
					onboarding
				)
			`,
			)
			.eq("id", userId)
			.single();

		// Se não tem estabelecimento, redirecionar para /admin/onboarding
		if (!perfil?.estabelecimento_id) {
			if (to.path !== "/admin/onboarding") {
				console.warn("[OnboardingMiddleware] ⚠️ Estabelecimento não encontrado");
				return navigateTo("/admin/onboarding");
			}
			return;
		}

		const estabelecimentos = perfil.estabelecimentos as
			| { onboarding: boolean }
			| { onboarding: boolean }[]
			| null;

		// Normalizar para objeto único (caso venha como array)
		const estabelecimento = Array.isArray(estabelecimentos)
			? estabelecimentos[0]
			: estabelecimentos;

		const onboardingConcluido = estabelecimento?.onboarding === true;

		// Se onboarding NÃO foi concluído
		if (!onboardingConcluido) {
			// Bloquear acesso a outras páginas admin (exceto /admin/onboarding)
			if (to.path !== "/admin/onboarding") {
				console.warn("[OnboardingMiddleware] ⚠️ Onboarding pendente, redirecionando...");
				return navigateTo("/admin/onboarding");
			}
			// Permitir acesso a /admin/onboarding
			return;
		}

		// Se onboarding FOI concluído
		if (onboardingConcluido) {
			// Redirecionar de /admin/onboarding para /admin/dashboard
			if (to.path === "/admin/onboarding") {
				console.warn(
					"[OnboardingMiddleware] ✅ Onboarding concluído, redirecionando para dashboard",
				);
				return navigateTo("/admin/dashboard");
			}
			// Permitir acesso a outras páginas admin
			return;
		}
	} catch (error) {
		console.error("[OnboardingMiddleware] ❌ Erro ao verificar onboarding:", error);
		// Em caso de erro, redirecionar para /admin/onboarding por segurança
		if (to.path !== "/admin/onboarding") {
			return navigateTo("/admin/onboarding");
		}
	}
});
