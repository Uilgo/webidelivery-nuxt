<script setup lang="ts">
/**
 * 📌 CardapioTabSection
 *
 * Componente que renderiza o conteúdo de cada aba do cardápio.
 * Integra filtros, estados vazios e gerenciamento de dados.
 */

// Importações explícitas dos componentes
import CardapioFilters from "./CardapioFilters.vue";
import CardapioEmptyState from "./CardapioEmptyState.vue";

interface Props {
	/** Aba ativa atual */
	activeTab: "categorias" | "produtos" | "adicionais" | "combos";
	/** Estado de carregamento */
	loading?: boolean;
	/** Se há dados para exibir */
	hasData?: boolean;
	/** Valor da busca atual */
	searchValue?: string;
	/** Ordenação atual */
	sortValue?: string;
	/** Filtros ativos */
	filters?: Record<string, unknown>;
}

interface Emits {
	/** Evento quando busca é alterada */
	search: [value: string];
	/** Evento quando ordenação é alterada */
	sort: [value: string];
	/** Evento quando filtros são alterados */
	filter: [filters: Record<string, unknown>];
	/** Evento para refresh dos dados */
	refresh: [];
	/** Evento para criar novo item */
	create: [];
}

withDefaults(defineProps<Props>(), {
	loading: false,
	hasData: false,
	searchValue: "",
	sortValue: "",
	filters: () => ({}),
});

const emit = defineEmits<Emits>();

/**
 * Handler para busca
 */
const handleSearch = (value: string): void => {
	emit("search", value);
};

/**
 * Handler para ordenação
 */
const handleSort = (value: string): void => {
	emit("sort", value);
};

/**
 * Handler para filtros
 */
const handleFilter = (filters: Record<string, unknown>): void => {
	emit("filter", filters);
};

/**
 * Handler para refresh
 */
const handleRefresh = (): void => {
	emit("refresh");
};

/**
 * Handler para criar
 */
const handleCreate = (): void => {
	emit("create");
};

/**
 * Handler para ação do empty state
 */
const handleEmptyAction = (): void => {
	emit("create");
};
</script>

<template>
	<div class="flex flex-col h-full">
		<!-- Filtros da Aba -->
		<CardapioFilters
			:active-tab="activeTab"
			:search-value="searchValue"
			:sort-value="sortValue"
			:filters="filters"
			:loading="loading"
			@search="handleSearch"
			@sort="handleSort"
			@filter="handleFilter"
			@refresh="handleRefresh"
			@create="handleCreate"
		/>

		<!-- Conteúdo da Aba -->
		<div class="flex-1 overflow-hidden">
			<!-- Estado de Loading -->
			<div v-if="loading" class="flex items-center justify-center h-full">
				<div class="flex flex-col items-center gap-3">
					<Icon name="lucide:loader-2" class="w-8 h-8 text-[var(--primary)] animate-spin" />
					<p class="text-sm text-[var(--text-muted)]">Carregando {{ activeTab }}...</p>
				</div>
			</div>

			<!-- Estado Vazio -->
			<div v-else-if="!hasData" class="flex items-center justify-center h-full">
				<CardapioEmptyState :type="activeTab" @action="handleEmptyAction" />
			</div>

			<!-- Conteúdo com Dados -->
			<div v-else class="h-full overflow-auto">
				<!-- Slot para conteúdo específico de cada aba -->
				<slot :active-tab="activeTab"></slot>
			</div>
		</div>
	</div>
</template>
