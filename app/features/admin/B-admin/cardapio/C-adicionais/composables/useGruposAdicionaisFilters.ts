/**
 * 📌 useGruposAdicionaisFilters - Filtros e Ordenação de Grupos de Adicionais
 *
 * Responsável por:
 * - Aplicar filtros locais nos dados
 * - Busca por texto
 * - Ordenação
 * - Filtros por status e obrigatoriedade
 */

import type { GrupoAdicionalComputado, GrupoAdicionalFilters } from "../../../types/adicional";

export interface UseGruposAdicionaisFiltersReturn {
	filters: Ref<GrupoAdicionalFilters>;
	setSearch: (value: string) => void;
	setAtivo: (value: boolean | undefined) => void;
	setObrigatorio: (value: boolean | undefined) => void;
	setOrdenacao: (
		field: GrupoAdicionalFilters["ordenacao"],
		direcao: GrupoAdicionalFilters["direcao"],
	) => void;
	clearFilters: () => void;
	applyFilters: (grupos: GrupoAdicionalComputado[]) => GrupoAdicionalComputado[];
}

export const useGruposAdicionaisFilters = (): UseGruposAdicionaisFiltersReturn => {
	// Estado dos filtros
	const filters = ref<GrupoAdicionalFilters>({
		busca: "",
		ativo: undefined,
		obrigatorio: undefined,
		ordenacao: "ordem",
		direcao: "asc",
	});

	/**
	 * Define valor da busca
	 */
	const setSearch = (value: string): void => {
		filters.value.busca = value;
	};

	/**
	 * Define filtro de ativo
	 */
	const setAtivo = (value: boolean | undefined): void => {
		filters.value.ativo = value;
	};

	/**
	 * Define filtro de obrigatorio
	 */
	const setObrigatorio = (value: boolean | undefined): void => {
		filters.value.obrigatorio = value;
	};

	/**
	 * Define ordenação
	 */
	const setOrdenacao = (
		field: GrupoAdicionalFilters["ordenacao"],
		direcao: GrupoAdicionalFilters["direcao"],
	): void => {
		filters.value.ordenacao = field;
		filters.value.direcao = direcao;
	};

	/**
	 * Limpa todos os filtros
	 */
	const clearFilters = (): void => {
		filters.value = {
			busca: "",
			ativo: undefined,
			obrigatorio: undefined,
			ordenacao: "ordem",
			direcao: "asc",
		};
	};

	/**
	 * Aplica filtros em uma lista de grupos
	 */
	const applyFilters = (grupos: GrupoAdicionalComputado[]): GrupoAdicionalComputado[] => {
		let result = [...grupos];

		// Filtro por busca (nome ou descrição)
		if (filters.value.busca) {
			const searchLower = filters.value.busca.toLowerCase();
			result = result.filter(
				(grupo) =>
					grupo.nome.toLowerCase().includes(searchLower) ||
					grupo.descricao?.toLowerCase().includes(searchLower),
			);
		}

		// Filtro por ativo
		if (filters.value.ativo !== undefined) {
			result = result.filter((grupo) => grupo.ativo === filters.value.ativo);
		}

		// Filtro por obrigatorio
		if (filters.value.obrigatorio !== undefined) {
			result = result.filter((grupo) => grupo.obrigatorio === filters.value.obrigatorio);
		}

		// Ordenação
		if (filters.value.ordenacao) {
			const field = filters.value.ordenacao;
			const direction = filters.value.direcao === "desc" ? -1 : 1;

			result.sort((a, b) => {
				const aValue = a[field];
				const bValue = b[field];

				if (aValue === null || aValue === undefined) return 1;
				if (bValue === null || bValue === undefined) return -1;

				if (typeof aValue === "string" && typeof bValue === "string") {
					return aValue.localeCompare(bValue) * direction;
				}

				if (aValue < bValue) return -1 * direction;
				if (aValue > bValue) return 1 * direction;
				return 0;
			});
		}

		return result;
	};

	return {
		filters,
		setSearch,
		setAtivo,
		setObrigatorio,
		setOrdenacao,
		clearFilters,
		applyFilters,
	};
};
