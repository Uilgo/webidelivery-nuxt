/**
 * 📌 Middleware: Guest Only
 *
 * Garante que apenas usuários NÃO autenticados possam acessar
 * páginas de login, signup, etc.
 *
 * IMPORTANTE:
 * - Redireciona usuários logados para o dashboard apropriado
 * - Deve ser aplicado em: /login, /signup, /forgot-password, etc.
 */

import { useUserStore } from "~/stores/user";

export default defineNuxtRouteMiddleware(async () => {
	const user = useSupabaseUser();

	// Se usuário NÃO está logado, permitir acesso
	if (!user.value) {
		return;
	}

	// Usuário está logado - usar store para verificar cargo
	const userStore = useUserStore();

	// Sincronizar usuário do Supabase com o Store se necessário
	if (!userStore.authUser || userStore.authUser.id !== user.value.id) {
		userStore.setAuthUser(user.value);
	}

	try {
		// Carregar perfil se necessário
		if (userStore.shouldRefreshProfile) {
			await userStore.fetchProfile();
		}

		const perfil = userStore.profile;

		if (!perfil) {
			// Se não conseguiu carregar perfil, deixar passar (evitar loop)
			return;
		}

		// Redirecionar baseado no cargo
		if (perfil.cargo === "super_admin" || perfil.cargo === "gerente_plataforma") {
			return navigateTo("/super-admin/dashboard", { replace: true });
		}

		// Admin, gerente, staff, entregador
		return navigateTo("/admin/dashboard", { replace: true });
	} catch (error) {
		console.error("[Guest] ❌ Erro ao verificar cargo:", error);
		// Em caso de erro, deixar passar (melhor UX que bloquear)
		return;
	}
});
