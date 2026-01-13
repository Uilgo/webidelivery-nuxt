/**
 * 📌 Plugin de Inicialização do Store de Usuário
 *
 * Plugin client-side que sincroniza o Supabase Auth com o store de usuário.
 * Monitora mudanças de autenticação e carrega/limpa o perfil automaticamente.
 */

export default defineNuxtPlugin(async () => {
	const supabase = useSupabaseClient();
	const user = useSupabaseUser();
	const userStore = useUserStore();

	// ========================================
	// INICIALIZAÇÃO
	// ========================================

	// Configurar usuário inicial se já estiver logado
	if (user.value) {
		userStore.setAuthUser(user.value);
		await userStore.initializeProfile();
	}

	// ========================================
	// MONITORAMENTO DE MUDANÇAS
	// ========================================

	// Observar mudanças no usuário do Supabase
	watch(
		user,
		async (newUser, oldUser) => {
			// Usuário fez login
			if (newUser && !oldUser) {
				userStore.setAuthUser(newUser);
				await userStore.initializeProfile();
			}
			// Usuário fez logout
			else if (!newUser && oldUser) {
				userStore.clearUser();
			}
			// Usuário mudou (troca de conta)
			else if (newUser && oldUser && newUser.id !== oldUser.id) {
				userStore.setAuthUser(newUser);
				await userStore.refreshProfile();
			}
		},
		{ immediate: false },
	);

	// ========================================
	// LISTENER DE EVENTOS DE AUTH
	// ========================================

	// Escutar eventos de autenticação do Supabase
	supabase.auth.onAuthStateChange(async (event, session) => {
		switch (event) {
			case "SIGNED_IN":
				if (session?.user) {
					userStore.setAuthUser(session.user);
					await userStore.initializeProfile();
				}
				break;

			case "SIGNED_OUT":
				userStore.clearUser();
				break;

			case "TOKEN_REFRESHED":
				// Token foi renovado, mas usuário continua o mesmo
				if (session?.user && userStore.authUser?.id === session.user.id) {
					userStore.setAuthUser(session.user);
					// Não precisa recarregar perfil, só atualizar auth user
				}
				break;

			case "USER_UPDATED":
				// Dados do auth.users foram atualizados
				if (session?.user) {
					userStore.setAuthUser(session.user);
					// Pode ser necessário recarregar perfil se email mudou
					if (userStore.profile?.email !== session.user.email) {
						await userStore.refreshProfile();
					}
				}
				break;
		}
	});
});
