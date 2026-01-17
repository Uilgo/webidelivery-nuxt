/**
 * 📌 Plugin de Inicialização (Server-side)
 *
 * Plugin server-side que carrega os dados do usuário E estabelecimento no servidor.
 */

import { useUserStore } from "~/stores/user";
import { useEstabelecimentoStore } from "~/stores/estabelecimento";

export default defineNuxtPlugin(async () => {
	// Só executar no server-side
	if (!import.meta.server) return;

	const user = useSupabaseUser();

	// O Supabase Auth usa 'id' mas o JWT usa 'sub' - verificar ambos
	const userId = user.value?.id ?? (user.value as { sub?: string } | null)?.sub;

	// Se não há usuário logado, não fazer nada
	if (!userId) {
		return;
	}

	const supabase = useSupabaseClient();
	const userStore = useUserStore();
	const estabelecimentoStore = useEstabelecimentoStore();

	// Definir usuário de auth no store
	userStore.setAuthUser(user.value);

	try {
		// Buscar perfil e estabelecimento em UMA ÚNICA query com JOIN
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
			console.error("[AuthServer] Erro na query:", error.message);
			return;
		}

		if (perfil) {
			// Extrair estabelecimentos do perfil
			const { estabelecimentos, ...perfilData } = perfil;

			// Definir perfil no store
			userStore.$patch({
				profile: perfilData,
				isLoadingProfile: false,
				lastProfileFetch: Date.now(),
			});

			// Definir estabelecimento no store (se existir)
			if (estabelecimentos) {
				estabelecimentoStore.$patch({
					estabelecimento: estabelecimentos,
					isLoading: false,
					lastFetch: Date.now(),
				});
			}
		}
	} catch (error) {
		console.error("[AuthServer] Erro ao carregar dados:", error);
	}
});
