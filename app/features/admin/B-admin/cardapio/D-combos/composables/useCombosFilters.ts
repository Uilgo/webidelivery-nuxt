/**
 * 📌 useCombosFilters
 *
 * Composable responsável pelos filtros e ordenação de combos.
 * Aplica filtros de busca, status, destaque e ordenação.
 */

import type { Combo } from "../../../types/combo";

export const useCombosFilters = () => {
	// Estado de filtros
	const filters = ref({
		busca: "",
		ordenacao: "ordem" as "ordem" | "nome" | "preco_combo" | "created_at",
		direcao: "asc" as "asc" | "desc",
		ativo: undefined as boolean | undefined,
		destaque: undefined as boolean | undefined,
	});

	/**
	 * Setar busca
	 */
	const setSearch = (value: string): void => {
		filters.value.busca = value;
	};

	/**
	 * Setar ordenação
	 */
	const setOrdenacao = (
		field: "ordem" | "nome" | "preco_combo" | "created_at",
		dir: "asc" | "desc",
	): void => {
		filters.value.ordenacao = field;
		filters.value.direcao = dir;
	};

	/**
	 * Setar filtro de ativo
	 */
	const setAtivo = (value: boolean | undefined): void => {
		filters.value.ativo = value;
	};

	/**
	 * Setar filtro de destaque
	 */
	const setDestaque = (value: boolean | undefined): void => {
		filters.value.destaque = value;
	};

	/**
	 * Aplicar todos os filtros
	 */
	const applyFilters = (combos: readonly Combo[]): Combo[] => {
		let filtered = [...combos];

		// Filtro de busca (normaliza acentos)
		if (filters.value.busca) {
			const search = filters.value.busca
				.toLowerCase()
				.normalize("NFD")
				.replace(/[\u0300-\u036f]/g, "");

			filtered = filtered.filter((c) => {
				const nome = c.nome
					.toLowerCase()
					.normalize("NFD")
					.replace(/[\u0300-\u036f]/g, "");
				const descricao = c.descricao
					? c.descricao
							.toLowerCase()
							.normalize("NFD")
							.replace(/[\u0300-\u036f]/g, "")
					: "";

				return nome.includes(search) || descricao.includes(search);
			});
		}

		// Filtro de ativo
		if (filters.value.ativo !== undefined) {
			filtered = filtered.filter((c) => c.ativo === filters.value.ativo);
		}

		// Filtro de destaque
		if (filters.value.destaque !== undefined) {
			filtered = filtered.filter((c) => c.destaque === filters.value.destaque);
		}

		// Ordenação
		filtered.sort((a, b) => {
			const field = filters.value.ordenacao;
			const dir = filters.value.direcao === "asc" ? 1 : -1;

			if (field === "ordem") {
				return (a.ordem - b.ordem) * dir;
			}

			if (field === "nome") {
				return a.nome.localeCompare(b.nome) * dir;
			}

			if (field === "preco_combo") {
				return (a.preco_combo - b.preco_combo) * dir;
			}

			if (field === "created_at") {
				return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * dir;
			}

			return 0;
		});

		return filtered;
	};

	return {
		filters,
		setSearch,
		setOrdenacao,
		setAtivo,
		setDestaque,
		applyFilters,
	};
};
