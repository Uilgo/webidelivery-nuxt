/**
 * 📌 Middleware: Super Admin Only
 *
 * Garante que apenas super_admin e gerente_plataforma
 * possam acessar o painel da plataforma.
 *
 * IMPORTANTE:
 * - Deve ser aplicado em TODAS as rotas /super-admin/*
 * - Bloqueia acesso de admins de estabelecimento
 * - Permite: super_admin, gerente_plataforma
 */

export default defineNuxtRouteMiddleware(async (to) => {
	// Só aplicar em rotas /super-admin/* (exceto login/signup/forgot)
	if (!to.path.startsWith("/super-admin")) {
		return;
	}

	// Permitir acesso às páginas de autenticação
	const publicSuperAdminRoutes = [
		"/super-admin/login",
		"/super-admin/signup",
		"/super-admin/forgot-password",
	];

	if (publicSuperAdminRoutes.includes(to.path)) {
		return;
	}

	const user = useSupabaseUser();
	const userId = user.value?.id ?? (user.value as { sub?: string } | null)?.sub;

	// Se não há usuário, deixar o módulo Supabase lidar
	if (!userId) {
		return;
	}

	const supabase = useSupabaseClient();

	try {
		// Buscar cargo do usuário
		const { data: perfil, error } = await supabase
			.from("perfis")
			.select("cargo")
			.eq("id", userId)
			.single();

		if (error) {
			console.error("[SuperAdminOnly] ❌ Erro ao buscar perfil:", error);
			return navigateTo("/super-admin/login");
		}

		if (!perfil) {
			console.warn("[SuperAdminOnly] ⚠️ Perfil não encontrado");
			return navigateTo("/super-admin/login");
		}

		// Cargos permitidos no painel da plataforma
		const cargosPermitidos = ["super_admin", "gerente_plataforma"];

		// Verificar se o cargo é permitido
		if (!cargosPermitidos.includes(perfil.cargo)) {
			console.warn(
				`[SuperAdminOnly] ⚠️ Acesso negado - cargo "${perfil.cargo}" não tem permissão para acessar painel da plataforma`,
			);

			// Redirecionar para painel apropriado
			if (["admin", "gerente", "staff"].includes(perfil.cargo)) {
				return navigateTo("/admin/dashboard");
			}

			// Outros cargos
			return navigateTo("/login");
		}

		// Cargo permitido - continuar
	} catch (error) {
		console.error("[SuperAdminOnly] ❌ Erro inesperado:", error);
		return navigateTo("/super-admin/login");
	}
});
