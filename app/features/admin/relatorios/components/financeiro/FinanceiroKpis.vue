<script setup lang="ts">
/**
 * 📊 FinanceiroKpis
 *
 * Grid de KPIs do relatório financeiro.
 * Exibe métricas principais: receita bruta, líquida, descontos, taxas, lucro.
 */

import KpiCard from "../shared/KpiCard.vue";
import type { KpisFinanceiro } from "../../types/financeiro";

interface Props {
	kpis?: KpisFinanceiro;
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
		props.kpis.receita_bruta,
		props.kpis.receita_liquida,
		props.kpis.descontos,
		props.kpis.taxas_entrega,
		props.kpis.lucro_estimado,
	];
});
</script>

<template>
	<div class="financeiro-kpis">
		<!-- Loading State -->
		<div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
			<div
				v-for="i in 5"
				:key="i"
				class="h-32 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"
			></div>
		</div>

		<!-- KPIs Grid -->
		<div v-else-if="kpis" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
			<KpiCard v-for="(kpi, index) in kpisArray" :key="index" :kpi="kpi" />
		</div>

		<!-- Empty State -->
		<UiEmptyState
			v-else
			title="Nenhum dado disponível"
			description="Não há KPIs financeiros para o período selecionado"
			icon="lucide:dollar-sign"
			size="md"
		/>
	</div>
</template>
