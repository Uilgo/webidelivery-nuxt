/**
 * 📌 Middleware: Admin Only
 *
 * Garante que apenas usuários com cargos administrativos
 * possam acessar o painel admin.
 *
 * IMPORTANTE:
 * - Deve ser aplicado em TODAS as rotas /admin/*
 * - Verifica cargo do usuário no banco de dados
 * - Bloqueia acesso de entregadores ao painel
 * - Permite: admin, gerente, staff
 */

export default defineNuxtRouteMiddleware(async (to) => {
	// Só aplicar em rotas /admin/*
	if (!to.path.startsWith("/admin")) {
		return;
	}

	const user = useSupabaseUser();
	const userId = user.value?.id ?? (user.value as { sub?: string } | null)?.sub;

	// Se não há usuário, deixar o middleware global lidar
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
			console.error("[AdminOnly] ❌ Erro ao buscar perfil:", error);
			return navigateTo("/login");
		}

		if (!perfil) {
			console.warn("[AdminOnly] ⚠️ Perfil não encontrado");
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
				return navigateTo("/login");
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
