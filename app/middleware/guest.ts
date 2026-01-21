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

export default defineNuxtRouteMiddleware(async () => {
	const user = useSupabaseUser();

	// Se usuário está logado, redirecionar para dashboard
	if (user.value) {
		const userId = user.value.id ?? (user.value as { sub?: string } | null)?.sub;

		if (!userId) {
			return; // Deixar passar se não conseguir pegar ID
		}

		const supabase = useSupabaseClient();

		try {
			// Buscar cargo do usuário para saber para onde redirecionar
			const { data: perfil } = await supabase
				.from("perfis")
				.select("cargo")
				.eq("id", userId)
				.single();

			if (!perfil) {
				return; // Deixar passar se não encontrar perfil
			}

			// Redirecionar baseado no cargo
			if (perfil.cargo === "super_admin" || perfil.cargo === "gerente_plataforma") {
				console.warn("[Guest] ⚠️ Usuário da plataforma tentou acessar página de guest");
				return navigateTo("/super-admin/dashboard");
			}

			// Admin, gerente, staff, entregador
			console.warn("[Guest] ⚠️ Usuário logado tentou acessar página de guest");
			return navigateTo("/admin/dashboard");
		} catch (error) {
			console.error("[Guest] ❌ Erro ao verificar cargo:", error);
			// Em caso de erro, deixar passar (melhor UX que bloquear)
			return;
		}
	}

	// Usuário não está logado - permitir acesso
});
