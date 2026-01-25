<script setup lang="ts">
/**
 * 📊 FinanceiroKpis
 *
 * Grid de KPIs do relatório financeiro.
 * Exibe métricas principais: receita bruta, líquida, descontos, taxas, lucro.
 */

import type { KpisFinanceiro } from "../../types/financeiro";

interface Props {
	kpis: KpisFinanceiro;
	loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	loading: false,
});

// Converter KPIs para array
const kpisArray = computed(() => {
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
	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
		<KpiCard
			v-for="(kpi, index) in kpisArray"
			:key="index"
			:titulo="kpi.titulo"
			:valor="kpi.valor"
			:icone="kpi.icone"
			:cor="kpi.cor"
			:descricao="kpi.descricao"
			:loading="loading"
		/>
	</div>
</template>
