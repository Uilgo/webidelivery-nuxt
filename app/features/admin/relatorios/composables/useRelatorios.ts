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
	const route = useRoute();
	const router = useRouter();

	// ========================================
	// COOKIES PARA PERSISTÊNCIA
	// ========================================

	const lastTabCookie = useCookie<AbaRelatorio>("relatorios-last-tab", {
		default: () => "pedidos",
		maxAge: 60 * 60 * 24 * 30, // 30 dias
	});

	// ========================================
	// ESTADO DAS ABAS
	// ========================================

	/**
	 * Determina a aba inicial baseado na URL ou cookie
	 */
	const getInitialTab = (): AbaRelatorio => {
		const queryTab = route.query.tab as string;
		const validTabs: AbaRelatorio[] = ["pedidos", "vendas", "produtos", "marketing", "financeiro"];

		if (queryTab && validTabs.includes(queryTab as AbaRelatorio)) {
			return queryTab as AbaRelatorio;
		}

		return lastTabCookie.value;
	};

	const abaAtiva = ref<AbaRelatorio>(getInitialTab());

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

		router.push({
			query: {
				...route.query,
				tab: aba,
			},
		});
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
			const validTabs: AbaRelatorio[] = [
				"pedidos",
				"vendas",
				"produtos",
				"marketing",
				"financeiro",
			];
			const validTab = validTabs.includes(newTab as AbaRelatorio)
				? (newTab as AbaRelatorio)
				: "pedidos";

			if (abaAtiva.value !== validTab) {
				abaAtiva.value = validTab;
			}
		},
	);

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
	// RETORNO
	// ========================================

	return {
		// Estado
		abaAtiva,
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
