/**
 * 📌 Middleware: Admin Only
 *
 * Garante que apenas usuários com cargos administrativos
 * possam acessar o painel admin.
 *
 * OTIMIZAÇÃO: Usa Pinia Store para cache e evita requisições
 * duplicadas ao banco de dados em cada navegação.
 */

import { useUserStore } from "~/stores/user";

export default defineNuxtRouteMiddleware(async (to) => {
	// Só aplicar em rotas /admin/*
	if (!to.path.startsWith("/admin")) {
		return;
	}

	const user = useSupabaseUser();
	const userStore = useUserStore();

	// Se não há usuário autenticado no Supabase
	if (!user.value) {
		return navigateTo("/login");
	}

	// Sincronizar usuário do Supabase com o Store se necessário
	if (!userStore.authUser || userStore.authUser.id !== user.value.id) {
		userStore.setAuthUser(user.value);
	}

	try {
		// Verificar se precisa carregar/atualizar o perfil
		if (userStore.shouldRefreshProfile) {
			await userStore.fetchProfile();
		}

		const perfil = userStore.profile;

		if (!perfil) {
			console.warn("[AdminOnly] ⚠️ Perfil não encontrado ou erro ao carregar");
			// Se falhou ao carregar perfil mesmo com usuário logado
			if (userStore.profileError) {
				console.error("[AdminOnly] Erro no perfil:", userStore.profileError);
			}
			return navigateTo("/login");
		}

		// Cargos permitidos no painel admin
		const cargosPermitidos = ["admin", "gerente", "staff"];

		// Verificar se o cargo é permitido
		if (!cargosPermitidos.includes(perfil.cargo)) {
			console.warn(
				`[AdminOnly] ⚠️ Acesso negado - cargo "${perfil.cargo}" não tem permissão para acessar painel admin`,
			);

			// Redirecionar super admin/gerente plataforma para painel correto
			if (perfil.cargo === "super_admin" || perfil.cargo === "gerente_plataforma") {
				return navigateTo("/super-admin/dashboard");
			}

			// Redirecionar entregador para página específica (futura)
			if (perfil.cargo === "entregador") {
				// TODO: Criar página /entregador/entregas
				return navigateTo("/login"); // Fallback
			}

			// Outros cargos não permitidos
			return navigateTo("/login");
		}

		// Cargo permitido - continuar
	} catch (error) {
		console.error("[AdminOnly] ❌ Erro inesperado:", error);
		return navigateTo("/login");
	}
});
