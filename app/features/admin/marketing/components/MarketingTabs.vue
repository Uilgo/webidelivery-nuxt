<script setup lang="ts">
/**
 * 📌 MarketingTabs
 *
 * Componente de navegação entre as abas do marketing.
 * Exibe cupons, banners e promoções com contadores.
 */

import type { MarketingTab } from "../types/marketing";

interface Props {
	activeTab: MarketingTab;
	tabCounts: {
		cuponsCount: number;
		bannersCount: number;
		promocoesCount: number;
	};
}

interface Emits {
	tabChange: [tab: string];
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// ========================================
// CONFIGURAÇÃO DAS ABAS
// ========================================

const tabItems = computed(() => [
	{
		key: "cupons",
		label: "Cupons",
		icon: "lucide:ticket",
		badge: props.tabCounts.cuponsCount,
	},
	{
		key: "banners",
		label: "Banners",
		icon: "lucide:image",
		badge: props.tabCounts.bannersCount,
	},
	{
		key: "promocoes",
		label: "Promoções",
		icon: "lucide:percent",
		badge: props.tabCounts.promocoesCount,
	},
]);

// ========================================
// HANDLERS
// ========================================

/**
 * Handler para mudança de aba
 */
const handleTabChange = (tab: string): void => {
	emit("tabChange", tab);
};
</script>

<template>
	<div class="w-full">
		<UiTabs :tabs="tabItems" :model-value="activeTab" @update:model-value="handleTabChange" />
	</div>
</template>
