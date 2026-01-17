/**
 * 📌 Plugin de Inicialização (Client-side)
 *
 * Plugin client-side que sincroniza o Supabase Auth com os stores.
 * NÃO recarrega dados se já vieram do SSR - apenas monitora mudanças.
 */

import { useUserStore } from "~/stores/user";
import { useEstabelecimentoStore } from "~/stores/estabelecimento";

/**
 * Extrai o ID do usuário (suporta 'id' e 'sub')
 */
const getUserId = (user: unknown): string | null => {
	if (!user || typeof user !== "object") return null;
	const u = user as Record<string, unknown>;
	return (u.id as string) ?? (u.sub as string) ?? null;
};

export default defineNuxtPlugin(() => {
	// Só executar no client-side
	if (!import.meta.client) return;

	const supabase = useSupabaseClient();
	const user = useSupabaseUser();
	const userStore = useUserStore();
	const estabelecimentoStore = useEstabelecimentoStore();

	/**
	 * Carrega todos os dados em uma única query
	 */
	const loadAllData = async (): Promise<void> => {
		const userId = getUserId(user.value);
		if (!userId) return;

		try {
			const { data: perfil, error } = await supabase
				.from("perfis")
				.select(
					`
					*,
					estabelecimentos:estabelecimento_id (
						id,
						nome,
						slug,
						logo_url,
						status,
						aberto
					)
				`,
				)
				.eq("id", userId)
				.single();

			if (error) {
				console.error("[AuthClient] Erro na query:", error.message);
				return;
			}

			if (perfil) {
				const { estabelecimentos, ...perfilData } = perfil;

				userStore.$patch({
					profile: perfilData,
					isLoadingProfile: false,
					lastProfileFetch: Date.now(),
				});

				if (estabelecimentos) {
					estabelecimentoStore.$patch({
						estabelecimento: estabelecimentos,
						isLoading: false,
						lastFetch: Date.now(),
					});
				}
			}
		} catch (error) {
			console.error("[AuthClient] Erro ao carregar dados:", error);
		}
	};

	/**
	 * Limpa todos os dados
	 */
	const clearAllData = (): void => {
		userStore.clearUser();
		estabelecimentoStore.clear();
	};

	// ========================================
	// INICIALIZAÇÃO
	// ========================================

	const userId = getUserId(user.value);

	// Se tem usuário mas NÃO tem dados no store (SSR falhou ou não executou)
	if (userId && !userStore.profile) {
		userStore.setAuthUser(user.value);
		// Carregar dados em background (não bloqueia)
		loadAllData();
	}

	// ========================================
	// MONITORAMENTO DE MUDANÇAS DE AUTH
	// ========================================

	watch(
		user,
		(newUser, oldUser) => {
			const newUserId = getUserId(newUser);
			const oldUserId = getUserId(oldUser);

			if (newUserId && !oldUserId) {
				// Login - carregar dados
				userStore.setAuthUser(newUser);
				loadAllData();
			} else if (!newUserId && oldUserId) {
				// Logout - limpar dados
				clearAllData();
			} else if (newUserId && oldUserId && newUserId !== oldUserId) {
				// Troca de conta
				userStore.setAuthUser(newUser);
				estabelecimentoStore.clear();
				loadAllData();
			}
		},
		{ immediate: false },
	);

	// ========================================
	// LISTENER DE EVENTOS DE AUTH DO SUPABASE
	// ========================================

	supabase.auth.onAuthStateChange((event, session) => {
		switch (event) {
			case "SIGNED_IN":
				if (session?.user && !userStore.profile) {
					userStore.setAuthUser(session.user);
					loadAllData();
				}
				break;

			case "SIGNED_OUT":
				clearAllData();
				break;

			case "TOKEN_REFRESHED":
				if (session?.user) {
					const currentId = getUserId(userStore.authUser);
					if (currentId === session.user.id) {
						userStore.setAuthUser(session.user);
					}
				}
				break;

			case "USER_UPDATED":
				if (session?.user) {
					userStore.setAuthUser(session.user);
					// Recarregar perfil se email mudou
					if (userStore.profile?.email !== session.user.email) {
						loadAllData();
					}
				}
				break;
		}
	});
});
