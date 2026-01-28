/**
 * 📌 useConvites
 *
 * Composable para gerenciar convites de equipe.
 * Busca, filtra e gerencia convites pendentes.
 */

import { useState, readonly, computed, useSupabaseClient } from "#imports";
import type { Convite } from "../types/equipe";
import { useEstabelecimentoStore } from "~/stores/estabelecimento";

export const useConvites = () => {
	const supabase = useSupabaseClient();
	const estabelecimentoStore = useEstabelecimentoStore();

	/**
	 * Lista de convites
	 */
	const convites = useState<Convite[]>("equipe.convites", () => []);

	/**
	 * Estado de carregamento
	 */
	const loading = useState<boolean>("equipe.convites.loading", () => false);

	/**
	 * Erro
	 */
	const error = useState<string | null>("equipe.convites.error", () => null);

	/**
	 * Busca convites pendentes do estabelecimento
	 */
	const fetchConvites = async (): Promise<void> => {
		// Verificar se o cache já foi carregado pelo plugin
		const cacheLoaded = useState<boolean>("equipe-convites-cache-loaded", () => false);
		if (cacheLoaded.value) {
			// Dados já foram carregados pelo plugin, não fazer fetch novamente
			return;
		}

		if (!estabelecimentoStore.estabelecimento?.id) {
			error.value = "Estabelecimento não encontrado";
			return;
		}

		loading.value = true;
		error.value = null;

		try {
			// Buscar convites sem relacionamento (evita erro de foreign key)
			const { data: convitesData, error: fetchError } = await supabase
				.from("codigos_convite")
				.select("*")
				.eq("estabelecimento_id", estabelecimentoStore.estabelecimento.id)
				.eq("tipo", "membro_equipe")
				.eq("usado", false)
				.order("created_at", { ascending: false });

			if (fetchError) throw fetchError;

			if (!convitesData || convitesData.length === 0) {
				convites.value = [];
				cacheLoaded.value = true;
				return;
			}

			// Buscar IDs únicos dos criadores
			const criadoresIds = [...new Set(convitesData.map((c) => c.criado_por).filter(Boolean))];

			// Buscar perfis dos criadores em uma única query
			const { data: criadoresData } = await supabase
				.from("perfis")
				.select("id, nome, sobrenome")
				.in("id", criadoresIds);

			// Criar mapa de criadores para lookup rápido
			const criadoresMap = new Map(
				(criadoresData || []).map((criador) => [
					criador.id,
					`${criador.nome} ${criador.sobrenome}`,
				]),
			);

			// Mapear convites com nomes dos criadores
			convites.value = convitesData.map((convite) => ({
				...convite,
				criador_nome: convite.criado_por ? criadoresMap.get(convite.criado_por) : undefined,
			}));

			cacheLoaded.value = true;
		} catch (err) {
			console.error("Erro ao buscar convites:", err);
			error.value = "Erro ao carregar convites";
			convites.value = [];
		} finally {
			loading.value = false;
		}
	};

	/**
	 * Filtra convites não expirados
	 */
	const convitesAtivos = computed<Convite[]>(() => {
		const agora = new Date();

		return convites.value.filter((convite) => {
			// Se não tem data de expiração, está ativo
			if (!convite.expires_at) return true;

			// Verifica se não expirou
			const expiraEm = new Date(convite.expires_at);
			return expiraEm > agora;
		});
	});

	/**
	 * Convites expirados
	 */
	const convitesExpirados = computed<Convite[]>(() => {
		const agora = new Date();

		return convites.value.filter((convite) => {
			if (!convite.expires_at) return false;

			const expiraEm = new Date(convite.expires_at);
			return expiraEm <= agora;
		});
	});

	/**
	 * Calcula dias restantes até expiração
	 */
	const diasRestantes = (convite: Convite): number | null => {
		if (!convite.expires_at) return null;

		const agora = new Date();
		const expiraEm = new Date(convite.expires_at);
		const diff = expiraEm.getTime() - agora.getTime();
		const dias = Math.ceil(diff / (1000 * 60 * 60 * 24));

		return dias > 0 ? dias : 0;
	};

	/**
	 * Atualiza a lista após uma ação
	 */
	const refreshConvites = async (): Promise<void> => {
		await fetchConvites();
	};

	return {
		// Estado
		convites: readonly(convites),
		convitesAtivos,
		convitesExpirados,
		loading: readonly(loading),
		error: readonly(error),

		// Métodos
		fetchConvites,
		diasRestantes,
		refreshConvites,
	};
};
