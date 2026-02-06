<script setup lang="ts">
/**
 * 📌 MarketingFilters
 *
 * Componente de filtros compartilhados para o módulo de marketing.
 * Layout: [Busca] [Ordenação] [Status] [Tipo] ---- [ViewMode] [Refresh] [Criar]
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
			placeholder: "Buscar por código ou descrição...",
			sortOptions: [
				{ label: "Mais recentes", value: "created_at_desc" },
				{ label: "Mais antigos", value: "created_at_asc" },
				{ label: "Código A-Z", value: "codigo_asc" },
				{ label: "Código Z-A", value: "codigo_desc" },
				{ label: "Mais usados", value: "usos_desc" },
				{ label: "Menos usados", value: "usos_asc" },
			],
			statusOptions: [
				{ label: "Ativos", value: "ativo" },
				{ label: "Inativos", value: "inativo" },
				{ label: "Expirados", value: "expirado" },
			],
			tipoOptions: [
				{ label: "Percentual", value: "percentual" },
				{ label: "Valor Fixo", value: "valor_fixo" },
				{ label: "Frete Grátis", value: "frete_gratis" },
			],
		},
		banners: {
			createText: "Novo Banner",
			createIcon: "lucide:image-plus",
			placeholder: "Buscar por título ou descrição...",
			sortOptions: [], // SEM ORDENAÇÃO PARA BANNERS
			statusOptions: [
				{ label: "Ativos", value: "ativo" },
				{ label: "Inativos", value: "inativo" },
			],
			tipoOptions: [
				{ label: "Imagem", value: "imagem" },
				{ label: "Texto", value: "texto" },
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
 * Handler para limpar ordenação (volta para padrão: vazio)
 */
const handleClearSort = (): void => {
	emit("sort", "");
};

/**
 * Handler para mudança de modo de visualização
 */
const handleViewModeChange = (mode: MarketingViewMode): void => {
	emit("view-mode-change", mode);
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
	if (!props.sortValue) return "";
	const option = sortOptions.value.find((opt) => opt.value === props.sortValue);
	return option?.label ?? "";
});

/**
 * Retorna o label do status selecionado
 */
const selectedStatusLabel = computed(() => {
	if (!props.filters.status) return "";
	const option = tabConfig.value.statusOptions.find((opt) => opt.value === props.filters.status);
	return option?.label ?? "";
});

/**
 * Retorna o label do tipo selecionado
 */
const selectedTipoLabel = computed(() => {
	const filterKey = props.activeTab === "banners" ? "tipo_conteudo" : "tipo";
	if (!props.filters[filterKey]) return "";
	const option = tabConfig.value.tipoOptions.find((opt) => opt.value === props.filters[filterKey]);
	return option?.label ?? "";
});

/**
 * Handler para mudança de filtro de status
 */
const handleStatusChange = (value: string): void => {
	const newFilters = { ...props.filters };
	newFilters.status = value;
	emit("filter", newFilters);
};

/**
 * Handler para limpar filtro de status
 */
const handleClearStatus = (): void => {
	const { status: _, ...newFilters } = props.filters;
	emit("filter", newFilters);
};

/**
 * Handler para mudança de filtro de tipo
 */
const handleTipoChange = (value: string): void => {
	const newFilters = { ...props.filters };
	const filterKey = props.activeTab === "banners" ? "tipo_conteudo" : "tipo";
	newFilters[filterKey] = value;
	emit("filter", newFilters);
};

/**
 * Handler para limpar filtro de tipo
 */
const handleClearTipo = (): void => {
	const filterKey = props.activeTab === "banners" ? "tipo_conteudo" : "tipo";
	const { [filterKey]: _, ...newFilters } = props.filters;
	emit("filter", newFilters);
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
					class="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
					@click="clearSearch"
				>
					<Icon name="lucide:x" class="w-4 h-4" />
				</button>
			</div>

			<!-- Dropdown de Ordenação (apenas se houver opções) -->
			<UiDropdown v-if="sortOptions.length > 0" placement="bottom-start">
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

			<!-- Dropdown de Status -->
			<UiDropdown placement="bottom-start">
				<template #trigger="{ toggle }">
					<UiButton
						v-if="!selectedStatusLabel"
						variant="ghost"
						size="md"
						class="!min-h-[40px] !px-3"
						aria-label="Filtrar por status"
						@click="toggle"
					>
						<template #iconLeft>
							<Icon name="lucide:circle-dot" class="w-4 h-4" />
						</template>
						Status
					</UiButton>
					<UiButton
						v-else
						variant="ghost"
						size="md"
						class="!min-h-[40px] !px-3"
						aria-label="Filtrar por status"
						@click="toggle"
					>
						<template #iconLeft>
							<Icon name="lucide:circle-dot" class="w-4 h-4" />
						</template>
						{{ selectedStatusLabel }}
					</UiButton>
				</template>

				<template #default="{ close }">
					<div class="py-1 w-max min-w-[140px]">
						<button
							v-for="option in tabConfig.statusOptions"
							:key="option.value"
							type="button"
							class="w-full flex items-center px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors whitespace-nowrap rounded-lg"
							:class="{
								'bg-[var(--primary-light)] text-[var(--primary)]':
									props.filters.status === option.value,
							}"
							@click="
								handleStatusChange(option.value);
								close();
							"
						>
							<span>{{ option.label }}</span>
							<Icon
								v-if="props.filters.status === option.value"
								name="lucide:check"
								class="w-4 h-4 ml-auto text-[var(--primary)]"
							/>
						</button>

						<!-- Botão Limpar -->
						<template v-if="selectedStatusLabel">
							<div class="h-px bg-[var(--border-default)] my-1"></div>
							<button
								type="button"
								class="w-full flex items-center justify-between px-3 py-2 text-sm text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors rounded-lg"
								@click="
									handleClearStatus();
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

			<!-- Dropdown de Tipo -->
			<UiDropdown placement="bottom-start">
				<template #trigger="{ toggle }">
					<UiButton
						v-if="!selectedTipoLabel"
						variant="ghost"
						size="md"
						class="!min-h-[40px] !px-3"
						aria-label="Filtrar por tipo"
						@click="toggle"
					>
						<template #iconLeft>
							<Icon name="lucide:tag" class="w-4 h-4" />
						</template>
						Tipo
					</UiButton>
					<UiButton
						v-else
						variant="ghost"
						size="md"
						class="!min-h-[40px] !px-3"
						aria-label="Filtrar por tipo"
						@click="toggle"
					>
						<template #iconLeft>
							<Icon name="lucide:tag" class="w-4 h-4" />
						</template>
						{{ selectedTipoLabel }}
					</UiButton>
				</template>

				<template #default="{ close }">
					<div class="py-1 w-max min-w-[140px]">
						<button
							v-for="option in tabConfig.tipoOptions"
							:key="option.value"
							type="button"
							class="w-full flex items-center px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors whitespace-nowrap rounded-lg"
							:class="{
								'bg-[var(--primary-light)] text-[var(--primary)]':
									props.filters[activeTab === 'banners' ? 'tipo_conteudo' : 'tipo'] ===
									option.value,
							}"
							@click="
								handleTipoChange(option.value);
								close();
							"
						>
							<span>{{ option.label }}</span>
							<Icon
								v-if="
									props.filters[activeTab === 'banners' ? 'tipo_conteudo' : 'tipo'] === option.value
								"
								name="lucide:check"
								class="w-4 h-4 ml-auto text-[var(--primary)]"
							/>
						</button>

						<!-- Botão Limpar -->
						<template v-if="selectedTipoLabel">
							<div class="h-px bg-[var(--border-default)] my-1"></div>
							<button
								type="button"
								class="w-full flex items-center justify-between px-3 py-2 text-sm text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors rounded-lg"
								@click="
									handleClearTipo();
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

		<!-- Lado Direito: ViewMode + Refresh + Criar -->
		<div class="flex items-center gap-3">
			<!-- Toggle de Modo de Visualização -->
			<div class="flex items-center bg-[var(--bg-muted)] rounded-lg p-1">
				<UiButton
					:variant="viewMode === 'card' ? 'solid' : 'ghost'"
					size="md"
					class="!p-2 !min-h-[40px] !w-[40px]"
					@click="handleViewModeChange('card')"
				>
					<Icon name="lucide:layout-grid" class="w-4 h-4" />
				</UiButton>
				<UiButton
					:variant="viewMode === 'list' ? 'solid' : 'ghost'"
					size="md"
					class="!p-2 !min-h-[40px] !w-[40px]"
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
				size="md"
				class="!p-2 !min-h-[40px] !w-[40px]"
				aria-label="Atualizar"
				:disabled="loading"
				@click="emit('refresh')"
			>
				<Icon name="lucide:refresh-cw" class="w-4 h-4" :class="{ 'animate-spin': loading }" />
			</UiButton>

			<!-- Botão Criar -->
			<UiButton variant="solid" size="md" @click="emit('create')">
				<template #iconLeft>
					<Icon :name="tabConfig?.createIcon ?? 'lucide:plus'" class="w-4 h-4" />
				</template>
				{{ tabConfig?.createText ?? "Criar" }}
			</UiButton>
		</div>
	</div>
</template>
