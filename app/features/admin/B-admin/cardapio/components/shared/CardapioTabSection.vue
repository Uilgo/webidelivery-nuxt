<script setup lang="ts">
/**
 * 📌 CardapioTabSection
 *
 * Componente que renderiza o conteúdo de cada aba do cardápio.
 * Responsável apenas por: loading, empty state e conteúdo.
 * Os filtros ficam no CardapioManager (fora das abas).
 */

import CardapioEmptyState from "./CardapioEmptyState.vue";

interface Props {
	/** Aba ativa atual */
	activeTab: "categorias" | "produtos" | "adicionais" | "combos";
	/** Estado de carregamento */
	loading?: boolean;
	/** Se há dados para exibir */
	hasData?: boolean;
}

interface Emits {
	/** Evento para criar novo item (do empty state) */
	create: [];
}

withDefaults(defineProps<Props>(), {
	loading: false,
	hasData: false,
});

const emit = defineEmits<Emits>();

/**
 * Handler para ação do empty state
 */
const handleEmptyAction = (): void => {
	emit("create");
};
</script>

<template>
	<div class="flex flex-col h-full">
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
		<div v-else class="h-full overflow-y-auto overflow-x-hidden">
			<slot :active-tab="activeTab"></slot>
		</div>
	</div>
</template>
