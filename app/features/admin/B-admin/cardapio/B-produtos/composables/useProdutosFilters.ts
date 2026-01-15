/**
 * 📌 useProdutosFilters - Filtros e Ordenação de Produtos
 *
 * Responsável por:
 * - Aplicar filtros locais nos dados
 * - Busca por texto
 * - Ordenação
 * - Filtros por categoria, destaque, promoção
 */

import type { ProdutoComputado, ProdutoFilters } from "../../../types/produto";

export interface UseProdutosFiltersReturn {
	filters: Ref<ProdutoFilters>;
	setSearch: (value: string) => void;
	setAtivo: (value: boolean | undefined) => void;
	setCategoria: (value: string | undefined) => void;
	setDestaque: (value: boolean | undefined) => void;
	setEmPromocao: (value: boolean | undefined) => void;
	setOrdenacao: (field: ProdutoFilters["ordenacao"], direcao: ProdutoFilters["direcao"]) => void;
	clearFilters: () => void;
	applyFilters: (produtos: ProdutoComputado[]) => ProdutoComputado[];
}

export const useProdutosFilters = (): UseProdutosFiltersReturn => {
	// Estado dos filtros
	const filters = ref<ProdutoFilters>({
		busca: "",
		ativo: undefined,
		categoria_id: undefined,
		destaque: undefined,
		em_promocao: undefined,
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
	 * Define filtro de categoria
	 */
	const setCategoria = (value: string | undefined): void => {
		filters.value.categoria_id = value;
	};

	/**
	 * Define filtro de destaque
	 */
	const setDestaque = (value: boolean | undefined): void => {
		filters.value.destaque = value;
	};

	/**
	 * Define filtro de em promoção
	 */
	const setEmPromocao = (value: boolean | undefined): void => {
		filters.value.em_promocao = value;
	};

	/**
	 * Define ordenação
	 */
	const setOrdenacao = (
		field: ProdutoFilters["ordenacao"],
		direcao: ProdutoFilters["direcao"],
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
			categoria_id: undefined,
			destaque: undefined,
			em_promocao: undefined,
			ordenacao: "created_at",
			direcao: "desc",
		};
	};

	/**
	 * Aplica filtros em uma lista de produtos
	 */
	const applyFilters = (produtos: ProdutoComputado[]): ProdutoComputado[] => {
		let result = [...produtos];

		// Filtro por busca (nome, descrição ou categoria) - normaliza acentos
		if (filters.value.busca) {
			const searchLower = filters.value.busca
				.toLowerCase()
				.normalize("NFD")
				.replace(/[\u0300-\u036f]/g, "");

			result = result.filter((prod) => {
				const nome = prod.nome
					.toLowerCase()
					.normalize("NFD")
					.replace(/[\u0300-\u036f]/g, "");
				const descricao = prod.descricao
					? prod.descricao
							.toLowerCase()
							.normalize("NFD")
							.replace(/[\u0300-\u036f]/g, "")
					: "";
				const categoriaNome = prod.categoria_nome
					.toLowerCase()
					.normalize("NFD")
					.replace(/[\u0300-\u036f]/g, "");

				return (
					nome.includes(searchLower) ||
					descricao.includes(searchLower) ||
					categoriaNome.includes(searchLower)
				);
			});
		}

		// Filtro por ativo
		if (filters.value.ativo !== undefined) {
			result = result.filter((prod) => prod.ativo === filters.value.ativo);
		}

		// Filtro por categoria
		if (filters.value.categoria_id) {
			result = result.filter((prod) => prod.categoria_id === filters.value.categoria_id);
		}

		// Filtro por destaque
		if (filters.value.destaque !== undefined) {
			result = result.filter((prod) => prod.destaque === filters.value.destaque);
		}

		// Filtro por em promoção
		if (filters.value.em_promocao !== undefined) {
			result = result.filter((prod) => prod.em_promocao === filters.value.em_promocao);
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
		setCategoria,
		setDestaque,
		setEmPromocao,
		setOrdenacao,
		clearFilters,
		applyFilters,
	};
};
