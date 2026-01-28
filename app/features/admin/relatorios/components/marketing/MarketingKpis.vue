<script setup lang="ts">
/**
 * 📊 MarketingKpis
 *
 * Grid de KPIs do relatório de marketing.
 * Exibe métricas principais: cupons usados, desconto total, taxa de conversão, economia média.
 */

import KpiCard from "../shared/KpiCard.vue";
import type { KpisMarketing } from "../../types/marketing";

interface Props {
	kpis?: KpisMarketing;
	loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	kpis: undefined,
	loading: false,
});

// Converter KPIs para array
const kpisArray = computed(() => {
	if (!props.kpis) return [];

	return [
		props.kpis.cupons_usados,
		props.kpis.desconto_total,
		props.kpis.taxa_conversao,
		props.kpis.economia_cliente,
	];
});
</script>

<template>
	<div class="marketing-kpis">
		<!-- Loading State -->
		<div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
			<div
				v-for="i in 4"
				:key="i"
				class="h-32 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"
			></div>
		</div>

		<!-- KPIs Grid -->
		<div v-else-if="kpis" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
			<KpiCard v-for="(kpi, index) in kpisArray" :key="index" :kpi="kpi" />
		</div>

		<!-- Empty State -->
		<UiEmptyState
			v-else
			title="Nenhum dado disponível"
			description="Não há KPIs de marketing para o período selecionado"
			icon="lucide:megaphone"
			size="md"
		/>
	</div>
</template>
