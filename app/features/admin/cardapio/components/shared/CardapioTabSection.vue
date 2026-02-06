<script setup lang="ts">
/**
 * 📌 CardapioTabSection
 *
 * Componente que renderiza o conteúdo de cada aba do cardápio.
 * Responsável apenas por: loading (skeleton), empty state e conteúdo.
 * Os filtros ficam no CardapioManager (fora das abas).
 *
 * NOTA: Os dados são carregados pelo plugin de servidor, então na maioria dos casos
 * os dados já estarão disponíveis na hidratação (sem skeleton).
 * O skeleton só aparece como fallback (primeira visita, erro no SSR, etc).
 */

import CardapioEmptyState from "./CardapioEmptyState.vue";
import CardapioCardSkeleton from "./CardapioCardSkeleton.vue";
import CardapioListSkeleton from "./CardapioListSkeleton.vue";

interface Props {
	/** Aba ativa atual */
	activeTab: "categorias" | "produtos" | "adicionais" | "combos";
	/** Estado de carregamento */
	loading?: boolean;
	/** Se há dados para exibir */
	hasData?: boolean;
	/** Modo de visualização */
	viewMode?: "card" | "list";
}

interface Emits {
	/** Evento para criar novo item (do empty state) */
	create: [];
}

withDefaults(defineProps<Props>(), {
	loading: false,
	hasData: false,
	viewMode: "card",
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
		<!-- Estado de Loading com Skeleton (fallback) -->
		<div v-if="loading" class="h-full overflow-hidden">
			<!-- Skeleton Grid (Card Mode) -->
			<div
				v-if="viewMode === 'card'"
				class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 py-4"
			>
				<CardapioCardSkeleton v-for="i in 10" :key="i" />
			</div>

			<!-- Skeleton List (List Mode) -->
			<div v-else class="space-y-3 py-4">
				<CardapioListSkeleton v-for="i in 8" :key="i" />
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
