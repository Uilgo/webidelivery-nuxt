/**
 * 📌 useEquipe
 *
 * Composable orquestrador principal da feature de Equipe.
 * Integra todos os composables e gerencia o estado global da feature.
 * Implementa sincronização com URL e cookies para persistência da aba ativa.
 */

import type { AbaEquipe, EstatisticasEquipe, Membro } from "../types/equipe";
import { useMembros } from "./useMembros";
import { useMembrosActions } from "./useMembrosActions";
import { useConvites } from "./useConvites";
import { useConvitesActions } from "./useConvitesActions";
import { useEquipeFiltros } from "./useEquipeFiltros";
import { useCargoPermissions } from "./useCargoPermissions";

export const useEquipe = () => {
	const route = useRoute();
	const router = useRouter();

	// Composables
	const membrosComposable = useMembros();
	const membrosActionsComposable = useMembrosActions();
	const convitesComposable = useConvites();
	const convitesActionsComposable = useConvitesActions();
	const filtrosComposable = useEquipeFiltros();
	const permissoesComposable = useCargoPermissions();

	// ========================================
	// COOKIES PARA PERSISTÊNCIA
	// ========================================

	const lastTabCookie = useCookie<AbaEquipe>("equipe-last-tab", {
		default: () => "membros",
		maxAge: 60 * 60 * 24 * 30, // 30 dias
	});

	// ========================================
	// ESTADO DAS ABAS
	// ========================================

	/**
	 * Determina a aba inicial baseado na URL ou cookie
	 */
	const getInitialTab = (): AbaEquipe => {
		const queryTab = route.query.tab as string;
		const validTabs: AbaEquipe[] = ["membros", "convites"];

		if (queryTab && validTabs.includes(queryTab as AbaEquipe)) {
			return queryTab as AbaEquipe;
		}

		return lastTabCookie.value;
	};

	/**
	 * Aba ativa (membros ou convites)
	 */
	const abaAtiva = useState<AbaEquipe>("equipe.abaAtiva", () => getInitialTab());

	/**
	 * Modal de criar convite aberto
	 */
	const modalConviteAberto = useState<boolean>("equipe.modalConviteAberto", () => false);

	/**
	 * Modal de editar membro aberto
	 */
	const modalMembroAberto = useState<boolean>("equipe.modalMembroAberto", () => false);

	/**
	 * Membro selecionado para edição
	 */
	const membroSelecionado = useState<Membro | null>("equipe.membroSelecionado", () => null);

	// ========================================
	// MÉTODOS DE INICIALIZAÇÃO
	// ========================================

	/**
	 * Inicializa a feature (busca dados iniciais)
	 */
	const inicializar = async (): Promise<void> => {
		await Promise.all([membrosComposable.fetchMembros(), convitesComposable.fetchConvites()]);
	};

	/**
	 * Atualiza todos os dados
	 */
	const refresh = async (): Promise<void> => {
		await Promise.all([membrosComposable.refreshMembros(), convitesComposable.refreshConvites()]);
	};

	// ========================================
	// COMPUTADAS
	// ========================================

	/**
	 * Membros filtrados e ordenados
	 */
	const membrosFiltrados = computed<Membro[]>(() => {
		const filtrados = membrosComposable.filtrarMembros(filtrosComposable.filtros.value);
		return membrosComposable.ordenarMembros(filtrados, filtrosComposable.ordenacao.value);
	});

	/**
	 * Estatísticas da equipe
	 */
	const estatisticas = computed<EstatisticasEquipe>(() => {
		const membros = membrosComposable.membros.value;
		const convitesPendentes = convitesComposable.convitesAtivos.value;

		// Conta membros por cargo
		const porCargo = {
			admin: 0,
			gerente: 0,
			staff: 0,
			entregador: 0,
		};

		membros.forEach((membro) => {
			if (membro.cargo === "admin") porCargo.admin++;
			else if (membro.cargo === "gerente") porCargo.gerente++;
			else if (membro.cargo === "staff") porCargo.staff++;
			else if (membro.cargo === "entregador") porCargo.entregador++;
		});

		return {
			total_membros: membros.length,
			membros_ativos: membros.filter((m) => m.ativo).length,
			membros_inativos: membros.filter((m) => !m.ativo).length,
			convites_pendentes: convitesPendentes.length,
			por_cargo: porCargo,
		};
	});

	// ========================================
	// HANDLERS DE NAVEGAÇÃO
	// ========================================

	/**
	 * Handler para mudança de aba (sincroniza com URL e cookie)
	 */
	const setAbaAtiva = (aba: AbaEquipe): void => {
		abaAtiva.value = aba;
		lastTabCookie.value = aba;

		router.push({
			query: {
				...route.query,
				tab: aba,
			},
		});
	};

	/**
	 * Abre modal de criar convite
	 */
	const abrirModalConvite = (): void => {
		modalConviteAberto.value = true;
	};

	/**
	 * Fecha modal de criar convite
	 */
	const fecharModalConvite = (): void => {
		modalConviteAberto.value = false;
	};

	/**
	 * Abre modal de editar membro
	 */
	const abrirModalMembro = (membro: Membro): void => {
		membroSelecionado.value = membro;
		modalMembroAberto.value = true;
	};

	/**
	 * Fecha modal de editar membro
	 */
	const fecharModalMembro = (): void => {
		modalMembroAberto.value = false;
		membroSelecionado.value = null;
	};

	// ========================================
	// MÉTODOS DE AÇÕES
	// ========================================

	/**
	 * Cria um convite e atualiza a lista
	 */
	const criarConvite = async (
		dados: Parameters<typeof convitesActionsComposable.criarConvite>[1],
	): Promise<string | null> => {
		const codigo = await convitesActionsComposable.criarConvite(
			permissoesComposable.cargoUsuario.value,
			dados,
		);

		if (codigo) {
			await convitesComposable.refreshConvites();
			fecharModalConvite();
		}

		return codigo;
	};

	/**
	 * Cancela um convite e atualiza a lista
	 */
	const cancelarConvite = async (conviteId: string): Promise<boolean> => {
		const sucesso = await convitesActionsComposable.cancelarConvite(conviteId);

		if (sucesso) {
			await convitesComposable.refreshConvites();
		}

		return sucesso;
	};

	/**
	 * Edita um membro e atualiza a lista
	 */
	const editarMembro = async (
		membroId: string,
		cargoMembro: Parameters<typeof membrosActionsComposable.editarMembro>[1],
		dados: Parameters<typeof membrosActionsComposable.editarMembro>[2],
	): Promise<boolean> => {
		const sucesso = await membrosActionsComposable.editarMembro(membroId, cargoMembro, dados);

		if (sucesso) {
			await membrosComposable.refreshMembros();
			fecharModalMembro();
		}

		return sucesso;
	};

	/**
	 * Ativa um membro e atualiza a lista
	 */
	const ativarMembro = async (
		membroId: string,
		cargoMembro: Parameters<typeof membrosActionsComposable.ativarMembro>[1],
	): Promise<boolean> => {
		const sucesso = await membrosActionsComposable.ativarMembro(membroId, cargoMembro);

		if (sucesso) {
			await membrosComposable.refreshMembros();
		}

		return sucesso;
	};

	/**
	 * Desativa um membro e atualiza a lista
	 */
	const desativarMembro = async (
		membroId: string,
		cargoMembro: Parameters<typeof membrosActionsComposable.desativarMembro>[1],
	): Promise<boolean> => {
		const sucesso = await membrosActionsComposable.desativarMembro(membroId, cargoMembro);

		if (sucesso) {
			await membrosComposable.refreshMembros();
		}

		return sucesso;
	};

	/**
	 * Remove um membro e atualiza a lista
	 */
	const removerMembro = async (
		membroId: string,
		cargoMembro: Parameters<typeof membrosActionsComposable.removerMembro>[1],
	): Promise<boolean> => {
		const sucesso = await membrosActionsComposable.removerMembro(membroId, cargoMembro);

		if (sucesso) {
			await membrosComposable.refreshMembros();
		}

		return sucesso;
	};

	// ========================================
	// SINCRONIZAÇÃO COM URL
	// ========================================

	// Forçar parâmetro tab na URL se não existir
	if (import.meta.client && !route.query.tab) {
		router.replace({
			query: {
				...route.query,
				tab: abaAtiva.value,
			},
		});
	}

	// Watch para sincronizar aba ativa com mudanças na URL
	watch(
		() => route.query.tab,
		(newTab) => {
			const validTabs: AbaEquipe[] = ["membros", "convites"];
			const validTab = validTabs.includes(newTab as AbaEquipe) ? (newTab as AbaEquipe) : "membros";

			if (abaAtiva.value !== validTab) {
				abaAtiva.value = validTab;
			}
		},
	);

	// ========================================
	// RETORNO
	// ========================================

	return {
		// Estado
		abaAtiva: readonly(abaAtiva),
		modalConviteAberto: readonly(modalConviteAberto),
		modalMembroAberto: readonly(modalMembroAberto),
		membroSelecionado: readonly(membroSelecionado),

		// Dados
		membros: membrosComposable.membros,
		membrosFiltrados,
		convites: convitesComposable.convites,
		convitesAtivos: convitesComposable.convitesAtivos,
		convitesExpirados: convitesComposable.convitesExpirados,
		estatisticas,

		// Loading
		loadingMembros: membrosComposable.loading,
		loadingConvites: convitesComposable.loading,
		loadingActions: membrosActionsComposable.actionLoading,

		// Erros
		erroMembros: membrosComposable.error,
		erroConvites: convitesComposable.error,

		// Filtros
		filtros: filtrosComposable.filtros,
		ordenacao: filtrosComposable.ordenacao,
		termoBusca: filtrosComposable.termoBusca,
		temFiltrosAtivos: filtrosComposable.temFiltrosAtivos,
		contadorFiltros: filtrosComposable.contadorFiltros,

		// Permissões
		podeAcessarEquipe: permissoesComposable.podeAcessarEquipe,
		cargosDisponiveis: permissoesComposable.cargosDisponiveis,
		cargoUsuario: permissoesComposable.cargoUsuario,

		// Métodos - Inicialização
		inicializar,
		refresh,

		// Métodos - Navegação
		setAbaAtiva,
		abrirModalConvite,
		fecharModalConvite,
		abrirModalMembro,
		fecharModalMembro,

		// Métodos - Filtros
		setFiltroCargo: filtrosComposable.setFiltroCargo,
		setFiltroStatus: filtrosComposable.setFiltroStatus,
		setBusca: filtrosComposable.setBusca,
		setOrdenacao: filtrosComposable.setOrdenacao,
		limparFiltros: filtrosComposable.limparFiltros,

		// Métodos - Ações
		criarConvite,
		cancelarConvite,
		editarMembro,
		ativarMembro,
		desativarMembro,
		removerMembro,

		// Métodos - Helpers
		diasRestantes: convitesComposable.diasRestantes,
		podeEditar: permissoesComposable.podeEditar,
		podeRemover: permissoesComposable.podeRemover,
		ehUsuarioLogado: permissoesComposable.ehUsuarioLogado,
	};
};
