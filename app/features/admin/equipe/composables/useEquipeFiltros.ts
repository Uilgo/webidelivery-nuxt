/**
 * 📌 useEquipeFiltros
 *
 * Composable para gerenciar filtros, busca e ordenação da equipe.
 * Centraliza o estado de filtros para membros e convites.
 */

import type { FiltrosMembros, OrdenacaoMembros, CargoEquipe, StatusMembro } from "../types/equipe";

export const useEquipeFiltros = () => {
	/**
	 * Filtros ativos
	 */
	const filtros = useState<FiltrosMembros>("equipe.filtros", () => ({
		cargo: undefined,
		status: undefined,
		busca: undefined,
	}));

	/**
	 * Ordenação ativa
	 */
	const ordenacao = useState<OrdenacaoMembros>("equipe.ordenacao", () => "recente_desc");

	/**
	 * Termo de busca
	 */
	const termoBusca = useState<string>("equipe.termoBusca", () => "");

	/**
	 * Define filtro de cargo
	 */
	const setFiltroCargo = (cargo: CargoEquipe | undefined): void => {
		filtros.value.cargo = cargo;
	};

	/**
	 * Define filtro de status
	 */
	const setFiltroStatus = (status: StatusMembro | undefined): void => {
		filtros.value.status = status;
	};

	/**
	 * Define termo de busca
	 */
	const setBusca = (busca: string): void => {
		termoBusca.value = busca;
		filtros.value.busca = busca || undefined;
	};

	/**
	 * Define ordenação
	 */
	const setOrdenacao = (novaOrdenacao: OrdenacaoMembros): void => {
		ordenacao.value = novaOrdenacao;
	};

	/**
	 * Limpa todos os filtros
	 */
	const limparFiltros = (): void => {
		filtros.value = {
			cargo: undefined,
			status: undefined,
			busca: undefined,
		};
		termoBusca.value = "";
		ordenacao.value = "recente_desc";
	};

	/**
	 * Verifica se há filtros ativos
	 */
	const temFiltrosAtivos = computed<boolean>(() => {
		return !!(filtros.value.cargo || filtros.value.status || filtros.value.busca);
	});

	/**
	 * Conta quantos filtros estão ativos
	 */
	const contadorFiltros = computed<number>(() => {
		let count = 0;
		if (filtros.value.cargo) count++;
		if (filtros.value.status) count++;
		if (filtros.value.busca) count++;
		return count;
	});

	return {
		// Estado
		filtros: readonly(filtros),
		ordenacao: readonly(ordenacao),
		termoBusca: readonly(termoBusca),
		temFiltrosAtivos,
		contadorFiltros,

		// Métodos
		setFiltroCargo,
		setFiltroStatus,
		setBusca,
		setOrdenacao,
		limparFiltros,
	};
};
