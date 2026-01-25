/**
 * 📌 useRelatorios
 *
 * Composable orquestrador principal da feature de relatórios.
 * Gerencia navegação entre abas, sincronização com URL/cookie e integração com outros composables.
 */

import type { AbaRelatorio } from "../types/relatorios";
import { useRelatoriosFiltros } from "./useRelatoriosFiltros";
import { useRelatoriosPermissions } from "./useRelatoriosPermissions";

export const useRelatorios = () => {
	// ========================================
	// ESTADO DAS ABAS
	// ========================================

	/**
	 * Aba ativa atual
	 */
	const abaAtiva = useState<AbaRelatorio>("relatorios.abaAtiva", () => "pedidos");

	/**
	 * Cookie para persistir última aba visitada (30 dias)
	 */
	const lastTabCookie = useCookie<AbaRelatorio>("relatorios-last-tab", {
		default: () => "pedidos",
		maxAge: 60 * 60 * 24 * 30, // 30 dias
	});

	// ========================================
	// INTEGRAÇÃO COM OUTROS COMPOSABLES
	// ========================================

	const filtros = useRelatoriosFiltros();
	const permissions = useRelatoriosPermissions();

	// ========================================
	// COMPUTED PROPERTIES
	// ========================================

	/**
	 * Verifica se o usuário pode acessar a feature
	 */
	const podeAcessar = computed(() => permissions.podeAcessarRelatorios.value);

	/**
	 * Lista de abas disponíveis com metadados
	 */
	const abasDisponiveis = computed(() => [
		{
			id: "pedidos" as const,
			label: "Pedidos",
			icone: "lucide:package",
			descricao: "Análise de pedidos e status",
		},
		{
			id: "vendas" as const,
			label: "Vendas",
			icone: "lucide:trending-up",
			descricao: "Faturamento e receitas",
		},
		{
			id: "produtos" as const,
			label: "Produtos",
			icone: "lucide:shopping-bag",
			descricao: "Performance de produtos",
		},
		{
			id: "marketing" as const,
			label: "Marketing",
			icone: "lucide:megaphone",
			descricao: "Cupons e campanhas",
		},
		{
			id: "financeiro" as const,
			label: "Financeiro",
			icone: "lucide:dollar-sign",
			descricao: "Fluxo de caixa e lucros",
		},
	]);

	// ========================================
	// MÉTODOS DE NAVEGAÇÃO
	// ========================================

	/**
	 * Define a aba ativa e persiste no cookie
	 */
	const setAbaAtiva = (aba: AbaRelatorio) => {
		abaAtiva.value = aba;
		lastTabCookie.value = aba;
	};

	/**
	 * Inicializa a aba a partir do cookie ou URL
	 */
	const inicializarAba = () => {
		const route = useRoute();
		const tabFromUrl = route.query.tab as AbaRelatorio | undefined;

		if (tabFromUrl && abasDisponiveis.value.some((a) => a.id === tabFromUrl)) {
			abaAtiva.value = tabFromUrl;
		} else if (lastTabCookie.value) {
			abaAtiva.value = lastTabCookie.value;
		}
	};

	/**
	 * Sincroniza aba ativa com a URL
	 */
	const sincronizarComUrl = () => {
		const router = useRouter();
		const route = useRoute();

		watch(
			abaAtiva,
			(novaAba) => {
				if (route.query.tab !== novaAba) {
					router.push({
						query: { ...route.query, tab: novaAba },
					});
				}
			},
			{ immediate: false },
		);
	};

	// ========================================
	// MÉTODOS DE REFRESH
	// ========================================

	/**
	 * Força atualização de todos os dados da aba atual
	 */
	const refreshAbaAtual = async () => {
		// Será implementado quando criarmos os composables específicos de cada aba
		// Por enquanto, apenas força re-render dos componentes
	};

	/**
	 * Reseta todos os filtros para o padrão
	 */
	const resetarFiltros = () => {
		filtros.resetarPeriodo();
	};

	// ========================================
	// LIFECYCLE
	// ========================================

	onMounted(() => {
		inicializarAba();
		sincronizarComUrl();
	});

	// ========================================
	// RETORNO
	// ========================================

	return {
		// Estado
		abaAtiva: readonly(abaAtiva),
		abasDisponiveis,
		podeAcessar,

		// Filtros (re-exportados para conveniência)
		periodo: filtros.periodo,
		periodoLabel: filtros.labelPeriodo,
		ehPeriodoPersonalizado: filtros.ehPeriodoPersonalizado,

		// Métodos
		setAbaAtiva,
		refreshAbaAtual,
		resetarFiltros,

		// Métodos de filtros (re-exportados)
		setPeriodo: filtros.setPeriodo,
		setPeriodoCustomizado: filtros.setPeriodoCustomizado,
	};
};
