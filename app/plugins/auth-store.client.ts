/**
 * 📌 Plugin de Inicialização (Client-side)
 *
 * Plugin client-side que sincroniza o Supabase Auth com os stores.
 * NÃO recarrega dados se já vieram do SSR - apenas monitora mudanças.
 */

import { useUserStore } from "~/stores/user";
import { useEstabelecimentoStore } from "~/stores/estabelecimento";

/**
 * Tipos para a resposta da query de perfil
 */
interface PerfilComEstabelecimento {
	id: string;
	nome: string;
	sobrenome: string;
	cargo: import("#shared/types/database").Cargo;
	estabelecimento_id: string | null;
	created_at: string;
	updated_at: string;
	estabelecimentos: {
		id: string;
		nome: string;
		slug: string;
		logo_url: string | null;
		status: string;
		aberto: boolean;
		onboarding: boolean;
	} | null;
}

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
			const { data: perfil, error } = (await supabase
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
						aberto,
						onboarding
					)
				`,
				)
				.eq("id", userId)
				.single()) as {
				data: PerfilComEstabelecimento | null;
				error: unknown | null;
			};

			if (error) {
				const errorMessage =
					error && typeof error === "object" && "message" in error
						? (error as { message: string }).message
						: "Erro desconhecido";
				console.error("[AuthClient] Erro na query:", errorMessage);
				return;
			}

			if (perfil) {
				// Extrair dados do estabelecimento
				const estabelecimentos = perfil.estabelecimentos;

				// Criar objeto do perfil completo com todas as propriedades necessárias
				const perfilCompleto = {
					id: perfil.id,
					nome: perfil.nome,
					sobrenome: perfil.sobrenome,
					cargo: perfil.cargo as import("#shared/types/database").Cargo,
					estabelecimento_id: perfil.estabelecimento_id,
					created_at: perfil.created_at,
					updated_at: perfil.updated_at,
					// Propriedades que não estão na query mas são obrigatórias no tipo Perfil
					avatar_url: null,
					email: user.value?.email || "",
					telefone: null,
					ativo: true,
					termos_aceitos_em: null,
					privacidade_aceita_em: null,
				};

				// Atualizar store do usuário
				userStore.$patch((state) => {
					state.profile = perfilCompleto;
					state.isLoadingProfile = false;
					state.lastProfileFetch = Date.now();
				});

				if (estabelecimentos) {
					estabelecimentoStore.$patch({
						estabelecimento: estabelecimentos,
						isLoading: false,
						lastFetch: Date.now(),
					});

					// ========================================
					// LÓGICA DE REDIRECIONAMENTO PARA ONBOARDING
					// ========================================
					await nextTick(); // Aguardar store ser atualizado

					// Se estabelecimento existe mas onboarding não foi concluído
					if (estabelecimentos.onboarding === false) {
						// Usar window.location.pathname ao invés de useRoute() em plugin
						const currentPath = window.location.pathname;

						// Só redirecionar se estiver tentando acessar páginas admin (não onboarding)
						if (currentPath.startsWith("/admin") && currentPath !== "/admin/onboarding") {
							console.warn("[AuthClient] Onboarding pendente, redirecionando...");
							await navigateTo("/admin/onboarding");
							return; // Parar execução aqui
						}
					}
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
		async (newUser, oldUser) => {
			const newUserId = getUserId(newUser);
			const oldUserId = getUserId(oldUser);

			if (newUserId && !oldUserId) {
				// Login - carregar dados
				userStore.setAuthUser(newUser);
				await loadAllData(); // Aguardar para verificar onboarding
			} else if (!newUserId && oldUserId) {
				// Logout - limpar dados
				clearAllData();
			} else if (newUserId && oldUserId && newUserId !== oldUserId) {
				// Troca de conta
				userStore.setAuthUser(newUser);
				estabelecimentoStore.clear();
				await loadAllData();
			}
		},
		{ immediate: false },
	);

	// ========================================
	// LISTENER DE EVENTOS DE AUTH DO SUPABASE
	// ========================================

	supabase.auth.onAuthStateChange(async (event, session) => {
		switch (event) {
			case "SIGNED_IN":
				if (session?.user && !userStore.profile) {
					userStore.setAuthUser(session.user);
					await loadAllData(); // Aguardar carregar dados para verificar onboarding
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
						await loadAllData();
					}
				}
				break;
		}
	});
});
