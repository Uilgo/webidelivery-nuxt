<script setup lang="ts">
/**
 * 📌 MarketingFilters
 *
 * Componente de filtros compartilhados para o módulo de marketing.
 * Layout baseado no CardapioFilters: [Busca] [Ordenação] ---- [ViewMode] [Refresh] [Criar]
 */

import type { MarketingViewMode, MarketingTab } from "../../types/marketing";

interface Props {
	activeTab: MarketingTab;
	searchValue: string;
	sortValue: string;
	filters: Record<string, unknown>;
	viewMode: MarketingViewMode;
	loading?: boolean;
}

interface Emits {
	search: [value: string];
	sort: [value: string];
	filter: [filters: Record<string, unknown>];
	"view-mode-change": [mode: MarketingViewMode];
	refresh: [];
	create: [];
}

const props = withDefaults(defineProps<Props>(), {
	loading: false,
});
const emit = defineEmits<Emits>();

// Estado interno da busca
const searchQuery = ref(props.searchValue);

// Configurações específicas para cada aba
const tabConfig = computed(() => {
	const configs = {
		cupons: {
			createText: "Novo Cupom",
			createIcon: "lucide:ticket-plus",
			sortOptions: [
				{ label: "Mais recentes", value: "created_at" },
				{ label: "Código A-Z", value: "codigo" },
				{ label: "Mais usados", value: "usos" },
				{ label: "Status", value: "status" },
			],
		},
		banners: {
			createText: "Novo Banner",
			createIcon: "lucide:image-plus",
			sortOptions: [
				{ label: "Mais recentes", value: "created_at" },
				{ label: "Nome A-Z", value: "titulo" },
				{ label: "Ordem", value: "ordem" },
				{ label: "Status", value: "status" },
			],
		},
		promocoes: {
			createText: "Nova Promoção",
			createIcon: "lucide:percent",
			sortOptions: [
				{ label: "Mais recentes", value: "created_at" },
				{ label: "Nome A-Z", value: "nome" },
				{ label: "Maior desconto", value: "desconto" },
				{ label: "Status", value: "status" },
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
 * Handler para limpar ordenação
 */
const handleClearSort = (): void => {
	emit("sort", "created_at");
};

/**
 * Handler para mudança de modo de visualização
 */
const handleViewModeChange = (mode: MarketingViewMode): void => {
	emit("view-mode-change", mode);
};

/**
 * Handler para limpar filtros
 */
const handleClearFilters = (): void => {
	searchQuery.value = "";
	emit("search", "");
	emit("sort", "created_at");
	emit("filter", {});
};

// Limpar busca
const clearSearch = (): void => {
	searchQuery.value = "";
};

/**
 * Retorna as opções de ordenação baseadas na aba ativa
 */
const sortOptions = computed(() => {
	return tabConfig.value?.sortOptions ?? [];
});

/**
 * Retorna o label da ordenação selecionada
 */
const selectedSortLabel = computed(() => {
	if (!props.sortValue || props.sortValue === "created_at") return "";
	const option = sortOptions.value.find((opt) => opt.value === props.sortValue);
	return option?.label ?? "";
});
</script>

<template>
	<div class="flex items-center gap-4 py-4 border-b border-[var(--border-default)]">
		<!-- Lado Esquerdo: Busca + Ordenação -->
		<div class="flex items-center gap-3 flex-1">
			<!-- Input de Busca -->
			<div class="relative flex-1 max-w-sm">
				<UiInput v-model="searchQuery" placeholder="Buscar por código, nome ou descrição...">
					<template #iconLeft>
						<Icon name="lucide:search" class="w-4 h-4 text-[var(--text-muted)]" />
					</template>
				</UiInput>

				<!-- Botão limpar busca -->
				<button
					v-if="searchQuery"
					type="button"
					class="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
					@click="clearSearch"
				>
					<Icon name="lucide:x" class="w-4 h-4" />
				</button>
			</div>

			<!-- Dropdown de Ordenação -->
			<UiDropdown placement="bottom-start">
				<template #trigger="{ toggle }">
					<UiButton
						v-if="!selectedSortLabel"
						variant="ghost"
						size="md"
						icon="lucide:arrow-up-down"
						class="!min-h-[40px] !w-[40px]"
						aria-label="Ordenar"
						@click="toggle"
					/>
					<UiButton
						v-else
						variant="ghost"
						size="md"
						class="!min-h-[40px] !px-3"
						aria-label="Ordenar"
						@click="toggle"
					>
						<template #iconLeft>
							<Icon name="lucide:arrow-up-down" class="w-4 h-4" />
						</template>
						{{ selectedSortLabel }}
					</UiButton>
				</template>

				<template #default="{ close }">
					<div class="py-1 w-max min-w-[140px]">
						<button
							v-for="option in sortOptions"
							:key="option.value"
							type="button"
							class="w-full flex items-center px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors whitespace-nowrap rounded-lg"
							:class="{
								'bg-[var(--primary-light)] text-[var(--primary)]': props.sortValue === option.value,
							}"
							@click="
								handleSortChange(option);
								close();
							"
						>
							<span>{{ option.label }}</span>
							<Icon
								v-if="props.sortValue === option.value"
								name="lucide:check"
								class="w-4 h-4 ml-auto text-[var(--primary)]"
							/>
						</button>

						<!-- Botão Limpar -->
						<template v-if="selectedSortLabel">
							<div class="h-px bg-[var(--border-default)] my-1"></div>
							<button
								type="button"
								class="w-full flex items-center justify-between px-3 py-2 text-sm text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors rounded-lg"
								@click="
									handleClearSort();
									close();
								"
							>
								<span>Limpar</span>
								<Icon name="lucide:x" class="w-3.5 h-3.5" />
							</button>
						</template>
					</div>
				</template>
			</UiDropdown>
		</div>

		<!-- Lado Direito: ViewMode + Refresh + Criar + Limpar Filtros -->
		<div class="flex items-center gap-3">
			<!-- Toggle de Modo de Visualização -->
			<div class="flex items-center bg-[var(--bg-muted)] rounded-lg p-1">
				<UiButton
					:variant="viewMode === 'card' ? 'solid' : 'ghost'"
					size="sm"
					class="!p-2 !min-h-[32px] !w-[32px]"
					@click="handleViewModeChange('card')"
				>
					<Icon name="lucide:layout-grid" class="w-4 h-4" />
				</UiButton>
				<UiButton
					:variant="viewMode === 'list' ? 'solid' : 'ghost'"
					size="sm"
					class="!p-2 !min-h-[32px] !w-[32px]"
					@click="handleViewModeChange('list')"
				>
					<Icon name="lucide:list" class="w-4 h-4" />
				</UiButton>
			</div>

			<!-- Separador Vertical -->
			<div class="h-6 w-px bg-[var(--border-default)]"></div>

			<!-- Botão Refresh -->
			<UiButton
				variant="ghost"
				size="sm"
				class="!min-h-[32px] !w-[32px] !p-2"
				:loading="props.loading"
				@click="emit('refresh')"
			>
				<Icon name="lucide:refresh-cw" class="w-4 h-4" />
			</UiButton>

			<!-- Botão Criar -->
			<UiButton variant="solid" size="sm" class="!min-h-[32px]" @click="emit('create')">
				<Icon :name="tabConfig?.createIcon ?? 'lucide:plus'" class="w-4 h-4 mr-2" />
				{{ tabConfig?.createText ?? "Criar" }}
			</UiButton>

			<!-- Botão limpar filtros -->
			<UiButton
				v-if="props.searchValue || selectedSortLabel"
				variant="outline"
				size="sm"
				class="!min-h-[32px]"
				@click="handleClearFilters"
			>
				<Icon name="lucide:x" class="w-4 h-4 mr-2" />
				Limpar
			</UiButton>
		</div>
	</div>
</template>
