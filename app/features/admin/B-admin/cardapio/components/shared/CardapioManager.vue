<script setup lang="ts">
/**
 * 📌 CardapioManager
 *
 * Componente orquestrador do gerenciamento de cardápio.
 * Gerencia estado global, composables e coordena todos os componentes filhos.
 */

// Importações dos componentes
import CardapioMenuTabs from "./CardapioMenuTabs.vue";
import CardapioTabSection from "./CardapioTabSection.vue";

// Estados globais do cardápio
const route = useRoute();
const router = useRouter();

// Cookie para persistir última aba visitada
const lastTabCookie = useCookie<"categorias" | "produtos" | "adicionais" | "combos">(
	"cardapio-last-tab",
	{
		default: () => "categorias",
		maxAge: 60 * 60 * 24 * 30, // 30 dias
	},
);

// Aba ativa sincronizada com URL query parameter e cookie
const activeTab = ref<"categorias" | "produtos" | "adicionais" | "combos">(
	(route.query.tab as string) === "produtos"
		? "produtos"
		: (route.query.tab as string) === "adicionais"
			? "adicionais"
			: (route.query.tab as string) === "combos"
				? "combos"
				: (route.query.tab as string) === "categorias"
					? "categorias"
					: lastTabCookie.value, // usar última aba do cookie como fallback
);

// Forçar parâmetro tab na URL imediatamente se não existir
if (!route.query.tab) {
	router.replace({
		query: {
			...route.query,
			tab: activeTab.value,
		},
	});
}

// Estados de loading por aba
const loadingStates = ref({
	categorias: false,
	produtos: false,
	adicionais: false,
	combos: false,
});

// Dados por aba (mock inicial)
const tabData = ref({
	categorias: [],
	produtos: [],
	adicionais: [],
	combos: [],
});

// Contadores para badges das abas
const tabCounts = computed(() => ({
	categoriasCount: tabData.value.categorias.length,
	produtosCount: tabData.value.produtos.length,
	adicionaisCount: tabData.value.adicionais.length,
	combosCount: tabData.value.combos.length,
}));

// Estados de filtros por aba
const searchValues = ref({
	categorias: "",
	produtos: "",
	adicionais: "",
	combos: "",
});

const sortValues = ref({
	categorias: "",
	produtos: "",
	adicionais: "",
	combos: "",
});

const filterValues = ref({
	categorias: {},
	produtos: {},
	adicionais: {},
	combos: {},
});

// Computadas para aba ativa
const currentLoading = computed(() => loadingStates.value[activeTab.value]);
const currentHasData = computed(() => tabData.value[activeTab.value].length > 0);
const currentSearchValue = computed(() => searchValues.value[activeTab.value]);
const currentSortValue = computed(() => sortValues.value[activeTab.value]);
const currentFilters = computed(() => filterValues.value[activeTab.value]);

/**
 * Handler para mudança de aba
 */
const handleTabChange = (tab: string): void => {
	const newTab = tab as typeof activeTab.value;
	activeTab.value = newTab;

	// Salvar no cookie para persistir entre sessões
	lastTabCookie.value = newTab;

	// Atualizar URL query parameter
	router.push({
		query: {
			...route.query,
			tab: newTab,
		},
	});
};

/**
 * Handler para busca
 */
const handleSearch = (value: string): void => {
	searchValues.value[activeTab.value] = value;
	// TODO: Implementar lógica de busca
	console.warn(`TODO: Buscar ${activeTab.value}:`, value);
};

/**
 * Handler para ordenação
 */
const handleSort = (value: string): void => {
	sortValues.value[activeTab.value] = value;
	// TODO: Implementar lógica de ordenação
	console.warn(`TODO: Ordenar ${activeTab.value}:`, value);
};

/**
 * Handler para filtros
 */
const handleFilter = (filters: Record<string, unknown>): void => {
	filterValues.value[activeTab.value] = filters;
	// TODO: Implementar lógica de filtros
	console.warn(`TODO: Filtrar ${activeTab.value}:`, filters);
};

/**
 * Handler para refresh
 */
const handleRefresh = (): void => {
	// TODO: Implementar lógica de refresh
	console.warn(`TODO: Refresh ${activeTab.value}`);
};

/**
 * Handler para criar novo item
 */
const handleCreate = (): void => {
	// TODO: Implementar lógica de criação
	console.warn(`TODO: Criar ${activeTab.value}`);
};

// Watch para sincronizar aba ativa com mudanças na URL
watch(
	() => route.query.tab,
	(newTab) => {
		const validTab =
			(newTab as string) === "produtos"
				? "produtos"
				: (newTab as string) === "adicionais"
					? "adicionais"
					: (newTab as string) === "combos"
						? "combos"
						: "categorias";

		if (activeTab.value !== validTab) {
			activeTab.value = validTab;
		}
	},
);

// TODO: Implementar composables
// const { categorias, loading: loadingCategorias } = useCategorias()
// const { produtos, loading: loadingProdutos } = useProdutos()
// const { adicionais, loading: loadingAdicionais } = useAdicionais()
// const { combos, loading: loadingCombos } = useCombos()
</script>

<template>
	<div class="flex flex-col h-full">
		<!-- Tabs do Menu -->
		<div class="mb-6">
			<CardapioMenuTabs
				v-model="activeTab"
				:categorias-count="tabCounts.categoriasCount"
				:produtos-count="tabCounts.produtosCount"
				:adicionais-count="tabCounts.adicionaisCount"
				:combos-count="tabCounts.combosCount"
				@tab-change="handleTabChange"
			>
				<template #default>
					<!-- Seção da Aba Ativa -->
					<CardapioTabSection
						:active-tab="activeTab"
						:loading="currentLoading"
						:has-data="currentHasData"
						:search-value="currentSearchValue"
						:sort-value="currentSortValue"
						:filters="currentFilters"
						@search="handleSearch"
						@sort="handleSort"
						@filter="handleFilter"
						@refresh="handleRefresh"
						@create="handleCreate"
					>
						<template #default="{ activeTab: sectionTab }">
							<!-- Conteúdo específico de cada aba -->
							<div class="p-6">
								<!-- Placeholder para listas específicas -->
								<div class="text-center text-[var(--text-muted)]">
									<p>Conteúdo da aba: {{ sectionTab }}</p>
									<p class="text-xs mt-2">
										TODO: Implementar
										{{
											sectionTab === "categorias"
												? "CategoriasList"
												: sectionTab === "produtos"
													? "ProdutosList"
													: sectionTab === "adicionais"
														? "AdicionaisList"
														: "CombosList"
										}}
									</p>
								</div>
							</div>
						</template>
					</CardapioTabSection>
				</template>
			</CardapioMenuTabs>
		</div>
	</div>
</template>
