/**
 * 📌 usePerfil
 *
 * Composable consolidado que utiliza o useUserStore central.
 * Evita duplicação de chamadas e aproveita o cache do Pinia já hidratado pelo SSR.
 */

import { computed } from "vue";
import { useUserStore } from "~/stores/user";
import type { PerfilComEstabelecimento } from "../types/perfil";

export const usePerfil = () => {
	const userStore = useUserStore();

	// Se não tiver perfil carregado e houver usuário, busca
	// Isso cobre o caso de navegação client-side onde o SSR não rodou para esta rota específica
	if (userStore.isAuthenticated && !userStore.profile && !userStore.isLoadingProfile) {
		userStore.fetchProfile();
	}

	// Converte o perfil do store para o tipo esperado pelo componente (com os getters já prontos)
	// Nota: O tipo Perfil no store é similar ao PerfilComEstabelecimento, mas garantimos a compatibilidade aqui
	const perfil = computed(() => {
		if (!userStore.profile) return null;

		// O store já tem os dados base. Se precisar de estabelecimentos,
		// o auth-store.server.ts já carrega e hidrata.
		// Aqui fazemos um cast seguro ou mapeamento se necessário.
		return userStore.profile as unknown as PerfilComEstabelecimento;
	});

	// Loading e Error do store
	const loading = computed(() => userStore.isLoadingProfile);
	const error = computed(() => (userStore.profileError ? new Error(userStore.profileError) : null));

	const refresh = async () => {
		await userStore.refreshProfile();
	};

	/**
	 * Computeds de conveniência (reutilizando a lógica do store via getters ou reimplementando localmente)
	 */

	const ehPlataforma = computed(() => userStore.isPlataformUser);

	const temEstabelecimento = computed(() => !!userStore.establishmentId);

	const nomeCompleto = computed(() => {
		if (!perfil.value) return "";
		return `${perfil.value.nome} ${perfil.value.sobrenome}`.trim();
	});

	const iniciais = computed(() => {
		if (!perfil.value) return "";
		return userStore.profileComplete?.iniciais || "";
	});

	const membroDesde = computed(() => {
		if (!perfil.value?.created_at) return "";
		return new Date(perfil.value.created_at).toLocaleDateString("pt-BR", {
			day: "2-digit",
			month: "2-digit",
			year: "numeric",
		});
	});

	return {
		perfil,
		loading,
		error,
		refresh,
		ehPlataforma,
		temEstabelecimento,
		nomeCompleto,
		iniciais,
		membroDesde,
	};
};
