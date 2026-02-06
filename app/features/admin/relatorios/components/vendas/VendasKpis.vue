<script setup lang="ts">
/**
 * 📊 VendasKpis
 *
 * Grid de KPIs do relatório de vendas:
 * - Receita bruta
 * - Receita líquida
 * - Ticket médio
 * - Total de transações
 * - Crescimento mensal
 */

import type { RelatorioVendas } from "../../types/vendas";
import KpiCard from "../shared/KpiCard.vue";

interface Props {
	dados: RelatorioVendas["kpis"] | undefined;
	loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	loading: false,
});

// Lista de KPIs na ordem de exibição
const kpisOrdenados = computed(() => {
	if (!props.dados) return [];

	return [
		props.dados.receita_bruta,
		props.dados.receita_liquida,
		props.dados.ticket_medio,
		props.dados.total_transacoes,
		props.dados.crescimento_mensal,
	];
});
</script>

<template>
	<div class="vendas-kpis">
		<!-- Loading State -->
		<div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			<div
				v-for="i in 5"
				:key="i"
				class="h-32 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"
			></div>
		</div>

		<!-- KPIs Grid -->
		<div v-else-if="dados" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			<KpiCard v-for="(kpi, index) in kpisOrdenados" :key="index" :kpi="kpi" />
		</div>

		<!-- Empty State -->
		<UiEmptyState
			v-else
			title="Nenhum dado disponível"
			description="Não há KPIs de vendas para o período selecionado"
			icon="lucide:trending-up"
			size="md"
		/>
	</div>
</template>
