/**
 * 📌 useMembros
 *
 * Composable para gerenciar membros da equipe.
 * Busca, filtra e ordena membros do estabelecimento.
 */

import { useState, readonly, useSupabaseClient } from "#imports";
import type { Membro, FiltrosMembros, OrdenacaoMembros } from "../types/equipe";
import { useEstabelecimentoStore } from "~/stores/estabelecimento";

export const useMembros = () => {
	const supabase = useSupabaseClient();
	const estabelecimentoStore = useEstabelecimentoStore();

	/**
	 * Lista de membros
	 */
	const membros = useState<Membro[]>("equipe.membros", () => []);

	/**
	 * Estado de carregamento
	 */
	const loading = useState<boolean>("equipe.membros.loading", () => false);

	/**
	 * Erro
	 */
	const error = useState<string | null>("equipe.membros.error", () => null);

	/**
	 * Busca membros do estabelecimento
	 */
	const fetchMembros = async (): Promise<void> => {
		// Verificar se o cache já foi carregado pelo plugin
		const cacheLoaded = useState<boolean>("equipe-membros-cache-loaded", () => false);
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
			const { data, error: fetchError } = await supabase
				.from("perfis")
				.select("*")
				.eq("estabelecimento_id", estabelecimentoStore.estabelecimento.id)
				.in("cargo", ["admin", "gerente", "staff", "entregador"])
				.order("created_at", { ascending: false });

			if (fetchError) throw fetchError;

			membros.value = (data as Membro[]) || [];
			cacheLoaded.value = true;
		} catch (err) {
			console.error("Erro ao buscar membros:", err);
			error.value = "Erro ao carregar membros da equipe";
		} finally {
			loading.value = false;
		}
	};

	/**
	 * Filtra membros baseado nos filtros
	 */
	const filtrarMembros = (filtros: FiltrosMembros): Membro[] => {
		let resultado = [...membros.value];

		// Filtro por cargo
		if (filtros.cargo) {
			resultado = resultado.filter((m) => m.cargo === filtros.cargo);
		}

		// Filtro por status
		if (filtros.status) {
			const ativo = filtros.status === "ativo";
			resultado = resultado.filter((m) => m.ativo === ativo);
		}

		// Busca por nome ou email
		if (filtros.busca) {
			const busca = filtros.busca.toLowerCase();
			resultado = resultado.filter((m) => {
				const nomeCompleto = `${m.nome} ${m.sobrenome}`.toLowerCase();
				const email = m.email.toLowerCase();
				return nomeCompleto.includes(busca) || email.includes(busca);
			});
		}

		return resultado;
	};

	/**
	 * Ordena membros
	 */
	const ordenarMembros = (membros: Membro[], ordenacao: OrdenacaoMembros): Membro[] => {
		const resultado = [...membros];

		switch (ordenacao) {
			case "nome_asc":
				return resultado.sort((a, b) => {
					const nomeA = `${a.nome} ${a.sobrenome}`.toLowerCase();
					const nomeB = `${b.nome} ${b.sobrenome}`.toLowerCase();
					return nomeA.localeCompare(nomeB);
				});

			case "nome_desc":
				return resultado.sort((a, b) => {
					const nomeA = `${a.nome} ${a.sobrenome}`.toLowerCase();
					const nomeB = `${b.nome} ${b.sobrenome}`.toLowerCase();
					return nomeB.localeCompare(nomeA);
				});

			case "recente_asc":
				return resultado.sort(
					(a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
				);

			case "recente_desc":
				return resultado.sort(
					(a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
				);

			default:
				return resultado;
		}
	};

	/**
	 * Atualiza a lista após uma ação
	 */
	const refreshMembros = async (): Promise<void> => {
		await fetchMembros();
	};

	return {
		// Estado
		membros: readonly(membros),
		loading: readonly(loading),
		error: readonly(error),

		// Métodos
		fetchMembros,
		filtrarMembros,
		ordenarMembros,
		refreshMembros,
	};
};
