<script setup lang="ts">
/**
 * 📊 PedidosKpis
 *
 * Grid de KPIs do relatório de pedidos:
 * - Total de pedidos
 * - Pedidos concluídos
 * - Pedidos cancelados
 * - Taxa de cancelamento
 * - Tempo médio de preparo
 * - Tempo médio de entrega
 */

import type { RelatorioPedidos } from "../../types/pedidos";
import KpiCard from "../shared/KpiCard.vue";

interface Props {
	dados: RelatorioPedidos["kpis"] | undefined;
	loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	loading: false,
});

// Lista de KPIs na ordem de exibição
const kpisOrdenados = computed(() => {
	if (!props.dados) return [];

	return [
		props.dados.total_pedidos,
		props.dados.pedidos_concluidos,
		props.dados.pedidos_cancelados,
		props.dados.taxa_cancelamento,
		props.dados.tempo_medio_preparo,
		props.dados.tempo_medio_entrega,
	];
});
</script>

<template>
	<div class="pedidos-kpis">
		<!-- Loading State -->
		<div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			<div
				v-for="i in 6"
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
			description="Não há KPIs de pedidos para o período selecionado"
			icon="lucide:package"
			size="md"
		/>
	</div>
</template>
