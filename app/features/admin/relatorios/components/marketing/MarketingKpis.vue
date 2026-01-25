<script setup lang="ts">
/**
 * 📊 MarketingKpis
 *
 * Grid de KPIs do relatório de marketing.
 * Exibe métricas principais: cupons usados, desconto total, taxa de conversão, economia média.
 */

import type { KpisMarketing } from "../../types/marketing";

interface Props {
	kpis: KpisMarketing;
	loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	loading: false,
});

// Converter KPIs para array
const kpisArray = computed(() => {
	return [
		props.kpis.cupons_usados,
		props.kpis.desconto_total,
		props.kpis.taxa_conversao,
		props.kpis.economia_cliente,
	];
});
</script>

<template>
	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
