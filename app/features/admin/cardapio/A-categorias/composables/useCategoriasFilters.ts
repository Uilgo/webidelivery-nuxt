/**
 * 📌 useCategoriasFilters - Filtros e Ordenação de Categorias
 *
 * Responsável por:
 * - Aplicar filtros locais nos dados
 * - Busca por texto
 * - Ordenação
 */

import type { CategoriaComputada, CategoriaFilters } from "../../../types/categoria";

export interface UseCategoriasFiltersReturn {
	filters: Ref<CategoriaFilters>;
	setSearch: (value: string) => void;
	setAtivo: (value: boolean | undefined) => void;
	setOrdenacao: (
		field: CategoriaFilters["ordenacao"],
		direcao: CategoriaFilters["direcao"],
	) => void;
	clearFilters: () => void;
	applyFilters: (categorias: CategoriaComputada[]) => CategoriaComputada[];
}

export const useCategoriasFilters = (): UseCategoriasFiltersReturn => {
	// Estado dos filtros
	const filters = ref<CategoriaFilters>({
		busca: "",
		ativo: undefined,
		ordenacao: "created_at",
		direcao: "desc",
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
	 * Define ordenação
	 */
	const setOrdenacao = (
		field: CategoriaFilters["ordenacao"],
		direcao: CategoriaFilters["direcao"],
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
			ordenacao: "created_at",
			direcao: "desc",
		};
	};

	/**
	 * Aplica filtros em uma lista de categorias
	 */
	const applyFilters = (categorias: CategoriaComputada[]): CategoriaComputada[] => {
		let result = [...categorias];

		// Filtro por busca (nome ou descrição) - normaliza acentos
		if (filters.value.busca) {
			const searchLower = filters.value.busca
				.toLowerCase()
				.normalize("NFD")
				.replace(/[\u0300-\u036f]/g, "");

			result = result.filter((cat) => {
				const nome = cat.nome
					.toLowerCase()
					.normalize("NFD")
					.replace(/[\u0300-\u036f]/g, "");
				const descricao = cat.descricao
					? cat.descricao
							.toLowerCase()
							.normalize("NFD")
							.replace(/[\u0300-\u036f]/g, "")
					: "";

				return nome.includes(searchLower) || descricao.includes(searchLower);
			});
		}

		// Filtro por ativo
		if (filters.value.ativo !== undefined) {
			result = result.filter((cat) => cat.ativo === filters.value.ativo);
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
		setOrdenacao,
		clearFilters,
		applyFilters,
	};
};
