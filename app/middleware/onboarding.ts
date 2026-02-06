/**
 * 📌 Middleware: Onboarding
 *
 * Garante que usuários com onboarding pendente sejam redirecionados
 * para /admin/onboarding antes de acessar outras páginas do painel.
 *
 * OTIMIZAÇÃO: Usa Pinia Store (User + Estabelecimento) para cache.
 */

import { useUserStore } from "~/stores/user";
import { useEstabelecimentoStore } from "~/stores/estabelecimento";

export default defineNuxtRouteMiddleware(async (to) => {
	// Só aplicar em rotas /admin/*
	if (!to.path.startsWith("/admin")) {
		return;
	}

	const userStore = useUserStore();
	const estabelecimentoStore = useEstabelecimentoStore();

	try {
		// 1. Garantir que o perfil do usuário esteja carregado
		// (Geralmente carregado pelo admin-only, mas verificamos por segurança)
		if (userStore.shouldRefreshProfile) {
			const user = useSupabaseUser();
			if (user.value) {
				if (!userStore.authUser || userStore.authUser.id !== user.value.id) {
					userStore.setAuthUser(user.value);
				}
				await userStore.fetchProfile();
			}
		}

		// Se não tem perfil carregado (mesmo após tentativa), deixa o admin-only lidar ou redireciona
		if (!userStore.profile) {
			// Não faz nada aqui, admin-only vai barrar se não tiver permissão/perfil
			return;
		}

		const establishmentId = userStore.profile.estabelecimento_id;

		// 2. Se não tem estabelecimento vinculado
		if (!establishmentId) {
			if (to.path !== "/admin/onboarding") {
				console.warn("[OnboardingMiddleware] ⚠️ Estabelecimento não encontrado");
				return navigateTo("/admin/onboarding");
			}
			return;
		}

		// 3. Garantir que os dados do estabelecimento estejam carregados
		// Verifica se precisa carregar (tempo expirado ou ID diferente do atual)
		if (estabelecimentoStore.shouldRefresh || estabelecimentoStore.id !== establishmentId) {
			await estabelecimentoStore.fetchEstabelecimento(establishmentId);
		}

		// Verificar status do onboarding no store
		const onboardingConcluido = estabelecimentoStore.estabelecimento?.onboarding === true;

		// 4. Lógica de Redirecionamento

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
