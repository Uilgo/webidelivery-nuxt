<script setup lang="ts">
/**
 * 📌 PedidoFiltros
 *
 * Componente de filtros e ações para pedidos.
 * Layout inspirado no CardapioFilters: [Busca] [Data] [Tipo] [Pagamento] ---- [Refresh] [Limpar]
 */

import type {
	FiltrosPedidos,
	ModoVisualizacao,
} from "~/features/admin/pedidos/types/pedidos-admin";
import PedidoViewToggle from "./PedidoViewToggle.vue";

interface Props {
	modelValue: FiltrosPedidos;
	loading?: boolean;
	viewMode?: ModoVisualizacao;
}

interface Emits {
	"update:modelValue": [value: FiltrosPedidos];
	"update:viewMode": [value: ModoVisualizacao];
	refresh: [];
	limpar: [];
}

const props = withDefaults(defineProps<Props>(), {
	loading: false,
	viewMode: "cards",
});

const emit = defineEmits<Emits>();

/**
 * Filtros locais (v-model interno)
 */
const filtrosLocais = computed({
	get: () => props.modelValue,
	set: (value: FiltrosPedidos) => emit("update:modelValue", value),
});

/**
 * Estado interno da busca
 */
const searchQuery = ref(props.modelValue.busca || "");

/**
 * Opções de preset de data
 */
const presetsData = [
	{ label: "Todos", value: "todos" },
	{ label: "Hoje", value: "hoje" },
	{ label: "Ontem", value: "ontem" },
	{ label: "Últimos 7 dias", value: "ultimos_7_dias" },
	{ label: "Personalizado", value: "custom" },
];

/**
 * Opções de tipo de entrega
 */
const tiposEntrega = [
	{ label: "Delivery", value: "delivery" },
	{ label: "Retirada", value: "retirada" },
];

/**
 * Opções de forma de pagamento
 */
const formasPagamento = [
	{ label: "Dinheiro", value: "dinheiro" },
	{ label: "PIX", value: "pix" },
	{ label: "Cartão de Crédito", value: "credito" },
	{ label: "Cartão de Débito", value: "debito" },
];

/**
 * Preset de data selecionado (inicializa como "todos")
 */
const presetSelecionado = ref("todos");

/**
 * Mostrar campos de data personalizada
 */
const mostrarDataCustom = computed(() => presetSelecionado.value === "custom");

/**
 * Debounce para busca
 */
let debounceTimer: NodeJS.Timeout | null = null;

const debouncedSearch = (value: string) => {
	if (debounceTimer) {
		clearTimeout(debounceTimer);
	}
	debounceTimer = setTimeout(() => {
		filtrosLocais.value = { ...filtrosLocais.value, busca: value };
	}, 300);
};

/**
 * Watch para mudanças na busca
 */
watch(searchQuery, (newValue) => {
	debouncedSearch(newValue);
});

/**
 * Watch para sincronizar com prop externa
 */
watch(
	() => props.modelValue.busca,
	(newValue) => {
		if (newValue !== searchQuery.value) {
			searchQuery.value = newValue || "";
		}
	},
);

/**
 * Aplicar preset de data
 */
const aplicarPresetData = (preset: string) => {
	presetSelecionado.value = preset;

	const hoje = new Date();
	hoje.setHours(0, 0, 0, 0);

	const filtros = { ...filtrosLocais.value };

	switch (preset) {
		case "todos": {
			// Limpar filtros de data
			filtros.data_inicio = null;
			filtros.data_fim = null;
			break;
		}

		case "hoje": {
			filtros.data_inicio = hoje;
			filtros.data_fim = hoje;
			break;
		}

		case "ontem": {
			const ontem = new Date(hoje);
			ontem.setDate(ontem.getDate() - 1);
			filtros.data_inicio = ontem;
			filtros.data_fim = ontem;
			break;
		}

		case "ultimos_7_dias": {
			const seteDiasAtras = new Date(hoje);
			seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);
			filtros.data_inicio = seteDiasAtras;
			filtros.data_fim = hoje;
			break;
		}

		case "custom": {
			// Não faz nada, usuário define manualmente
			break;
		}
	}

	filtrosLocais.value = filtros;
};

/**
 * Aplicar filtro de tipo de entrega
 */
const aplicarTipoEntrega = (tipo: string) => {
	filtrosLocais.value = {
		...filtrosLocais.value,
		tipo_entrega: tipo as "delivery" | "retirada",
	};
};

/**
 * Aplicar filtro de forma de pagamento
 */
const aplicarFormaPagamento = (forma: string) => {
	filtrosLocais.value = {
		...filtrosLocais.value,
		forma_pagamento: forma as "dinheiro" | "pix" | "credito" | "debito",
	};
};

/**
 * Limpar busca
 */
const clearSearch = () => {
	searchQuery.value = "";
};

/**
 * Limpar filtro de tipo de entrega
 */
const limparTipoEntrega = () => {
	filtrosLocais.value = { ...filtrosLocais.value, tipo_entrega: null };
};

/**
 * Limpar filtro de forma de pagamento
 */
const limparFormaPagamento = () => {
	filtrosLocais.value = { ...filtrosLocais.value, forma_pagamento: null };
};

/**
 * Handler para mudança de modo de visualização
 */
const handleViewModeChange = (mode: ModoVisualizacao) => {
	emit("update:viewMode", mode);
};

/**
 * Handler para refresh
 */
const handleRefresh = () => {
	emit("refresh");
};

/**
 * Labels dos filtros selecionados
 */
const presetLabel = computed(() => {
	const preset = presetsData.find((p) => p.value === presetSelecionado.value);
	return preset?.label || "";
});

const tipoEntregaLabel = computed(() => {
	if (!filtrosLocais.value.tipo_entrega) return "";
	const tipo = tiposEntrega.find((t) => t.value === filtrosLocais.value.tipo_entrega);
	return tipo?.label || "";
});

const formaPagamentoLabel = computed(() => {
	if (!filtrosLocais.value.forma_pagamento) return "";
	const forma = formasPagamento.find((f) => f.value === filtrosLocais.value.forma_pagamento);
	return forma?.label || "";
});
</script>

<template>
	<div class="space-y-4">
		<!-- Linha Principal de Filtros -->
		<div class="flex items-center gap-4 py-4 border-b border-[var(--border-default)]">
			<!-- Lado Esquerdo: Busca + Tipo + Pagamento + Período + DatePickers -->
			<div class="flex items-center gap-3 flex-1">
				<!-- Input de Busca -->
				<div class="relative flex-1 max-w-sm">
					<UiInput v-model="searchQuery" placeholder="Buscar por número, cliente ou telefone...">
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

				<!-- Dropdown de Tipo de Entrega -->
				<UiDropdown placement="bottom-start">
					<template #trigger="{ toggle }">
						<UiButton
							v-if="!tipoEntregaLabel"
							variant="ghost"
							size="md"
							icon="lucide:bike"
							class="!min-h-[40px] !w-[40px]"
							aria-label="Filtrar por tipo de entrega"
							@click="toggle"
						/>
						<UiButton
							v-else
							variant="ghost"
							size="md"
							class="!min-h-[40px] !px-3"
							aria-label="Filtrar por tipo de entrega"
							@click="toggle"
						>
							<template #iconLeft>
								<Icon name="lucide:bike" class="w-4 h-4" />
							</template>
							{{ tipoEntregaLabel }}
						</UiButton>
					</template>

					<template #default="{ close }">
						<div class="py-1 w-max min-w-[140px]">
							<button
								v-for="tipo in tiposEntrega"
								:key="tipo.value"
								type="button"
								class="w-full flex items-center px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors whitespace-nowrap rounded-lg"
								:class="{
									'bg-[var(--primary-light)] text-[var(--primary)]':
										filtrosLocais.tipo_entrega === tipo.value,
								}"
								@click="
									aplicarTipoEntrega(tipo.value);
									close();
								"
							>
								<span>{{ tipo.label }}</span>
								<Icon
									v-if="filtrosLocais.tipo_entrega === tipo.value"
									name="lucide:check"
									class="w-4 h-4 ml-auto text-[var(--primary)]"
								/>
							</button>

							<!-- Botão Limpar -->
							<template v-if="tipoEntregaLabel">
								<div class="h-px bg-[var(--border-default)] my-1"></div>
								<button
									type="button"
									class="w-full flex items-center justify-between px-3 py-2 text-sm text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors rounded-lg"
									@click="
										limparTipoEntrega();
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

				<!-- Dropdown de Forma de Pagamento -->
				<UiDropdown placement="bottom-start">
					<template #trigger="{ toggle }">
						<UiButton
							v-if="!formaPagamentoLabel"
							variant="ghost"
							size="md"
							icon="lucide:credit-card"
							class="!min-h-[40px] !w-[40px]"
							aria-label="Filtrar por forma de pagamento"
							@click="toggle"
						/>
						<UiButton
							v-else
							variant="ghost"
							size="md"
							class="!min-h-[40px] !px-3"
							aria-label="Filtrar por forma de pagamento"
							@click="toggle"
						>
							<template #iconLeft>
								<Icon name="lucide:credit-card" class="w-4 h-4" />
							</template>
							{{ formaPagamentoLabel }}
						</UiButton>
					</template>

					<template #default="{ close }">
						<div class="py-1 w-max min-w-[180px]">
							<button
								v-for="forma in formasPagamento"
								:key="forma.value"
								type="button"
								class="w-full flex items-center px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors whitespace-nowrap rounded-lg"
								:class="{
									'bg-[var(--primary-light)] text-[var(--primary)]':
										filtrosLocais.forma_pagamento === forma.value,
								}"
								@click="
									aplicarFormaPagamento(forma.value);
									close();
								"
							>
								<span>{{ forma.label }}</span>
								<Icon
									v-if="filtrosLocais.forma_pagamento === forma.value"
									name="lucide:check"
									class="w-4 h-4 ml-auto text-[var(--primary)]"
								/>
							</button>

							<!-- Botão Limpar -->
							<template v-if="formaPagamentoLabel">
								<div class="h-px bg-[var(--border-default)] my-1"></div>
								<button
									type="button"
									class="w-full flex items-center justify-between px-3 py-2 text-sm text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors rounded-lg"
									@click="
										limparFormaPagamento();
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

				<!-- Separador Vertical -->
				<div class="h-6 w-px bg-[var(--border-default)]"></div>

				<!-- Dropdown de Período -->
				<UiDropdown placement="bottom-start">
					<template #trigger="{ toggle }">
						<UiButton
							variant="ghost"
							size="md"
							class="!min-h-[40px] !px-3"
							aria-label="Filtrar por período"
							@click="toggle"
						>
							<template #iconLeft>
								<Icon name="lucide:calendar" class="w-4 h-4" />
							</template>
							{{ presetLabel }}
						</UiButton>
					</template>

					<template #default="{ close }">
						<div class="py-1 w-max min-w-[180px]">
							<button
								v-for="preset in presetsData"
								:key="preset.value"
								type="button"
								class="w-full flex items-center px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors whitespace-nowrap rounded-lg"
								:class="{
									'bg-[var(--primary-light)] text-[var(--primary)]':
										presetSelecionado === preset.value,
								}"
								@click="
									aplicarPresetData(preset.value);
									close();
								"
							>
								<span>{{ preset.label }}</span>
								<Icon
									v-if="presetSelecionado === preset.value"
									name="lucide:check"
									class="w-4 h-4 ml-auto text-[var(--primary)]"
								/>
							</button>
						</div>
					</template>
				</UiDropdown>

				<!-- DatePickers (se período personalizado) -->
				<template v-if="mostrarDataCustom">
					<UiDatePicker
						:model-value="
							filtrosLocais.data_inicio ? filtrosLocais.data_inicio.toISOString().split('T')[0] : ''
						"
						placeholder="Data início"
						size="md"
						@update:model-value="(val) => (filtrosLocais.data_inicio = val ? new Date(val) : null)"
					/>

					<UiDatePicker
						:model-value="
							filtrosLocais.data_fim ? filtrosLocais.data_fim.toISOString().split('T')[0] : ''
						"
						placeholder="Data fim"
						size="md"
						@update:model-value="(val) => (filtrosLocais.data_fim = val ? new Date(val) : null)"
					/>

					<!-- Botão X vermelho para limpar datas e voltar para "Hoje" -->
					<UiButton
						variant="ghost"
						size="md"
						icon="lucide:x"
						class="!min-h-[40px] !w-[40px] text-red-500 hover:text-red-600"
						aria-label="Limpar datas personalizadas"
						@click="aplicarPresetData('hoje')"
					/>
				</template>
			</div>

			<!-- Lado Direito: ViewMode + Refresh -->
			<div class="flex items-center gap-3">
				<!-- Toggle de Modo de Visualização -->
				<PedidoViewToggle :model-value="viewMode" @update:model-value="handleViewModeChange" />

				<!-- Separador Vertical -->
				<div class="h-6 w-px bg-[var(--border-default)]"></div>

				<!-- Botão Refresh -->
				<UiButton
					variant="ghost"
					size="md"
					class="!p-2 !min-h-[40px] !w-[40px]"
					aria-label="Atualizar pedidos"
					:disabled="loading"
					@click="handleRefresh"
				>
					<Icon name="lucide:refresh-cw" class="w-4 h-4" :class="{ 'animate-spin': loading }" />
				</UiButton>
			</div>
		</div>
	</div>
</template>
