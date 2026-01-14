<script setup lang="ts">
/**
 * 📌 CardapioFilters
 *
 * Componente de filtros e ações para as abas do cardápio.
 * Layout: [Busca] [Ordenação] [Filtros] ---- [Refresh] [Criar]
 */

interface Props {
	/** Aba ativa atual para configurar filtros específicos */
	activeTab: "categorias" | "produtos" | "adicionais" | "combos";
	/** Valor da busca */
	searchValue?: string;
	/** Ordenação atual */
	sortValue?: string;
	/** Filtros ativos */
	filters?: Record<string, unknown>;
	/** Estado de carregamento */
	loading?: boolean;
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

const props = withDefaults(defineProps<Props>(), {
	searchValue: "",
	sortValue: "",
	filters: () => ({}),
	loading: false,
});

const emit = defineEmits<Emits>();

// Estado interno da busca
const searchQuery = ref(props.searchValue);

// Configurações específicas para cada aba
const tabConfig = computed(() => {
	const configs = {
		categorias: {
			placeholder: "Buscar categorias...",
			createText: "Criar Categoria",
			createIcon: "lucide:folder-plus",
			sortOptions: [
				{ label: "Nome (A-Z)", value: "nome_asc" },
				{ label: "Nome (Z-A)", value: "nome_desc" },
				{ label: "Ordem", value: "ordem_asc" },
				{ label: "Mais recentes", value: "created_at_desc" },
				{ label: "Mais antigas", value: "created_at_asc" },
			],
			filterOptions: [
				{ label: "Todas", value: "all" },
				{ label: "Ativas", value: "ativo_true" },
				{ label: "Inativas", value: "ativo_false" },
			],
		},
		produtos: {
			placeholder: "Buscar produtos...",
			createText: "Criar Produto",
			createIcon: "lucide:package-plus",
			sortOptions: [
				{ label: "Nome (A-Z)", value: "nome_asc" },
				{ label: "Nome (Z-A)", value: "nome_desc" },
				{ label: "Mais vendidos", value: "total_vendas_desc" },
				{ label: "Ordem", value: "ordem_asc" },
				{ label: "Mais recentes", value: "created_at_desc" },
			],
			filterOptions: [
				{ label: "Todos", value: "all" },
				{ label: "Ativos", value: "ativo_true" },
				{ label: "Inativos", value: "ativo_false" },
				{ label: "Em destaque", value: "destaque_true" },
				{ label: "Em promoção", value: "em_promocao_true" },
			],
		},
		adicionais: {
			placeholder: "Buscar grupos de adicionais...",
			createText: "Criar Grupo",
			createIcon: "lucide:plus-circle",
			sortOptions: [
				{ label: "Nome (A-Z)", value: "nome_asc" },
				{ label: "Nome (Z-A)", value: "nome_desc" },
				{ label: "Ordem", value: "ordem_asc" },
				{ label: "Mais recentes", value: "created_at_desc" },
			],
			filterOptions: [
				{ label: "Todos", value: "all" },
				{ label: "Ativos", value: "ativo_true" },
				{ label: "Inativos", value: "ativo_false" },
				{ label: "Obrigatórios", value: "obrigatorio_true" },
				{ label: "Opcionais", value: "obrigatorio_false" },
			],
		},
		combos: {
			placeholder: "Buscar combos...",
			createText: "Criar Combo",
			createIcon: "lucide:package-2",
			sortOptions: [
				{ label: "Nome (A-Z)", value: "nome_asc" },
				{ label: "Nome (Z-A)", value: "nome_desc" },
				{ label: "Menor preço", value: "preco_combo_asc" },
				{ label: "Maior preço", value: "preco_combo_desc" },
				{ label: "Ordem", value: "ordem_asc" },
				{ label: "Mais recentes", value: "created_at_desc" },
			],
			filterOptions: [
				{ label: "Todos", value: "all" },
				{ label: "Ativos", value: "ativo_true" },
				{ label: "Inativos", value: "ativo_false" },
				{ label: "Em destaque", value: "destaque_true" },
				{ label: "Período válido", value: "periodo_valido_true" },
			],
		},
	};

	return configs[props.activeTab];
});

// Debounce para busca
let debounceTimer: NodeJS.Timeout | null = null;

const debouncedSearch = (value: string) => {
	if (debounceTimer) {
		clearTimeout(debounceTimer);
	}
	debounceTimer = setTimeout(() => {
		emit("search", value);
	}, 300);
};

// Watch para mudanças na busca
watch(searchQuery, (newValue) => {
	debouncedSearch(newValue);
});

// Watch para sincronizar com prop externa
watch(
	() => props.searchValue,
	(newValue) => {
		if (newValue !== searchQuery.value) {
			searchQuery.value = newValue;
		}
	},
);

/**
 * Handler para mudança de ordenação
 */
const handleSortChange = (sortOption: { label: string; value: string }): void => {
	emit("sort", sortOption.value);
};

/**
 * Handler para mudança de filtros
 */
const handleFilterChange = (filterOption: { label: string; value: string }): void => {
	if (filterOption.value === "all") {
		emit("filter", {});
		return;
	}

	const parts = filterOption.value.split("_");
	const key = parts[0];
	const value = parts[1];

	if (!key || !value) {
		console.warn("Formato de filtro inválido:", filterOption.value);
		return;
	}

	const filterValue = value === "true" ? true : value === "false" ? false : value;
	const filters: Record<string, unknown> = {};
	filters[key] = filterValue;
	emit("filter", filters);
};

/**
 * Handler para refresh
 */
const handleRefresh = (): void => {
	emit("refresh");
};

/**
 * Handler para criar novo item
 */
const handleCreate = (): void => {
	emit("create");
};

// Limpar busca
const clearSearch = (): void => {
	searchQuery.value = "";
};
</script>

<template>
	<div class="flex items-center gap-4 py-4 border-b border-[var(--border-default)]">
		<!-- Lado Esquerdo: Busca + Ordenação + Filtros -->
		<div class="flex items-center gap-3 flex-1">
			<!-- Input de Busca -->
			<div class="relative flex-1 max-w-sm">
				<UiInput v-model="searchQuery" :placeholder="tabConfig.placeholder">
					<template #iconLeft>
						<Icon name="lucide:search" class="w-4 h-4 text-[var(--text-muted)]" />
					</template>
				</UiInput>

				<!-- Botão limpar busca -->
				<button
					v-if="searchQuery"
					type="button"
					class="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
					@click="clearSearch"
				>
					<Icon name="lucide:x" class="w-4 h-4" />
				</button>
			</div>

			<!-- Dropdown de Ordenação -->
			<UiDropdown placement="bottom-start">
				<template #trigger="{ toggle }">
					<UiButton
						variant="ghost"
						size="md"
						class="!p-2 !min-h-[40px] !w-[40px]"
						:aria-label="'Ordenar ' + activeTab"
						@click="toggle"
					>
						<Icon name="lucide:arrow-up-down" class="w-4 h-4" />
					</UiButton>
				</template>

				<template #default="{ close }">
					<div class="py-1">
						<div
							class="px-3 py-2 text-xs font-medium text-[var(--text-muted)] border-b border-[var(--border-default)]"
						>
							Ordenar por
						</div>
						<button
							v-for="option in tabConfig.sortOptions"
							:key="option.value"
							type="button"
							class="w-full flex items-center px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
							:class="{
								'bg-[var(--primary-light)] text-[var(--primary)]': sortValue === option.value,
							}"
							@click="
								handleSortChange(option);
								close();
							"
						>
							<span>{{ option.label }}</span>
							<Icon
								v-if="sortValue === option.value"
								name="lucide:check"
								class="w-4 h-4 ml-auto text-[var(--primary)]"
							/>
						</button>
					</div>
				</template>
			</UiDropdown>

			<!-- Dropdown de Filtros -->
			<UiDropdown placement="bottom-start">
				<template #trigger="{ toggle }">
					<UiButton
						variant="ghost"
						size="md"
						class="!p-2 !min-h-[40px] !w-[40px]"
						:aria-label="'Filtrar ' + activeTab"
						@click="toggle"
					>
						<Icon name="lucide:filter" class="w-4 h-4" />
					</UiButton>
				</template>

				<template #default="{ close }">
					<div class="py-1">
						<div
							class="px-3 py-2 text-xs font-medium text-[var(--text-muted)] border-b border-[var(--border-default)]"
						>
							Filtrar por
						</div>
						<button
							v-for="option in tabConfig.filterOptions"
							:key="option.value"
							type="button"
							class="w-full flex items-center px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
							@click="
								handleFilterChange(option);
								close();
							"
						>
							<span>{{ option.label }}</span>
						</button>
					</div>
				</template>
			</UiDropdown>
		</div>

		<!-- Lado Direito: Refresh + Criar -->
		<div class="flex items-center gap-2">
			<!-- Botão Refresh -->
			<UiButton
				variant="ghost"
				size="md"
				class="!p-2 !min-h-[40px] !w-[40px]"
				:loading="loading"
				:aria-label="'Atualizar ' + activeTab"
				@click="handleRefresh"
			>
				<Icon name="lucide:refresh-cw" class="w-4 h-4" />
			</UiButton>

			<!-- Botão Criar -->
			<UiButton variant="solid" size="md" @click="handleCreate">
				<template #iconLeft>
					<Icon :name="tabConfig.createIcon" class="w-4 h-4" />
				</template>
				{{ tabConfig.createText }}
			</UiButton>
		</div>
	</div>
</template>
