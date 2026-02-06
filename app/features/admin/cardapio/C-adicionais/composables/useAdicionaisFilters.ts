/**
 * 📌 useAdicionaisFilters - Filtros e Ordenação de Adicionais
 *
 * Responsável por:
 * - Aplicar filtros locais nos dados
 * - Busca por texto (com debounce de 300ms)
 * - Ordenação
 * - Filtros por status
 */

import type { AdicionalComputado } from "../../../types/adicional";
import { useDebounceFn } from "@vueuse/core";

export interface AdicionalFilters {
	busca?: string;
	ativo?: boolean;
	ordenacao?: "nome" | "preco" | "ordem";
	direcao?: "asc" | "desc";
}

export interface UseAdicionaisFiltersReturn {
	filters: Ref<AdicionalFilters>;
	setSearch: (value: string) => void;
	setAtivo: (value: boolean | undefined) => void;
	setOrdenacao: (
		field: AdicionalFilters["ordenacao"],
		direcao: AdicionalFilters["direcao"],
	) => void;
	clearFilters: () => void;
	applyFilters: (adicionais: AdicionalComputado[]) => AdicionalComputado[];
}

export const useAdicionaisFilters = (): UseAdicionaisFiltersReturn => {
	// Estado dos filtros
	const filters = ref<AdicionalFilters>({
		busca: "",
		ativo: undefined,
		ordenacao: "ordem",
		direcao: "asc",
	});

	// Debounce da busca (300ms)
	const debouncedSetSearch = useDebounceFn((value: string) => {
		filters.value.busca = value;
	}, 300);

	/**
	 * Define valor da busca (com debounce de 300ms)
	 */
	const setSearch = (value: string): void => {
		debouncedSetSearch(value);
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
		field: AdicionalFilters["ordenacao"],
		direcao: AdicionalFilters["direcao"],
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
			ordenacao: "ordem",
			direcao: "asc",
		};
	};

	/**
	 * Aplica filtros em uma lista de adicionais
	 */
	const applyFilters = (adicionais: AdicionalComputado[]): AdicionalComputado[] => {
		let result = [...adicionais];

		// Filtro por busca (nome ou descrição) - normaliza acentos
		if (filters.value.busca) {
			const searchLower = filters.value.busca
				.toLowerCase()
				.normalize("NFD")
				.replace(/[\u0300-\u036f]/g, "");

			result = result.filter((adicional) => {
				const nome = adicional.nome
					.toLowerCase()
					.normalize("NFD")
					.replace(/[\u0300-\u036f]/g, "");
				const descricao = adicional.descricao
					? adicional.descricao
							.toLowerCase()
							.normalize("NFD")
							.replace(/[\u0300-\u036f]/g, "")
					: "";

				return nome.includes(searchLower) || descricao.includes(searchLower);
			});
		}

		// Filtro por ativo
		if (filters.value.ativo !== undefined) {
			result = result.filter((adicional) => adicional.ativo === filters.value.ativo);
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
