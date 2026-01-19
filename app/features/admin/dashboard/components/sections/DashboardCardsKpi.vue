<script setup lang="ts">
/**
 * 📊 DashboardStatsGrid - Grid de KPIs do Topo
 *
 * Responsável por renderizar os 4 cards principais de estatísticas
 * conectando os dados da interface DashboardKpis.
 */

import type { DashboardKpis } from "../../types/dashboard";
import DashboardStatsCard from "../base/DashboardStatsCard.vue";

interface Props {
	kpis: DashboardKpis;
	loading?: boolean;
}

defineProps<Props>();

/**
 * Formatter simples para moeda
 */
const formatCurrency = (value: number) => {
	return new Intl.NumberFormat("pt-BR", {
		style: "currency",
		currency: "BRL",
	}).format(value);
};
</script>

<template>
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
		<!-- KPI 1: Faturamento -->
		<DashboardStatsCard
			title="Faturamento do Dia"
			:value="formatCurrency(kpis.faturamento.hoje)"
			variant="emerald"
			icon="lucide:dollar-sign"
			:trend="{
				value: kpis.faturamento.variacao_semana,
				positive: kpis.faturamento.variacao_semana >= 0,
			}"
			secondary-label="Ticket Médio:"
			:secondary-value="formatCurrency(kpis.faturamento.ticket_medio)"
		/>

		<!-- KPI 2: Pedidos -->
		<DashboardStatsCard
			title="Pedidos Realizados"
			:value="kpis.pedidos_hoje.total"
			variant="blue"
			icon="lucide:shopping-bag"
			:trend="{
				value: kpis.pedidos_hoje.variacao_ontem,
				positive: kpis.pedidos_hoje.variacao_ontem >= 0,
			}"
			secondary-label="vs. ontem"
		/>

		<!-- KPI 3: Clientes -->
		<DashboardStatsCard
			title="Novos Clientes"
			:value="kpis.clientes.novos"
			variant="violet"
			icon="lucide:users"
			:trend="{
				value: kpis.clientes.variacao,
				positive: kpis.clientes.variacao >= 0,
			}"
			secondary-label="Recorrência:"
			:secondary-value="`${kpis.clientes.recorrencia}%`"
		/>

		<!-- KPI 4: Taxa de Conclusão -->
		<DashboardStatsCard
			title="Taxa de Conclusão"
			:value="`${kpis.conversao.taxa}%`"
			variant="rose"
			icon="lucide:check-circle-2"
			:trend="{
				value: kpis.conversao.variacao,
				positive: kpis.conversao.variacao >= 0,
			}"
			secondary-label="Total de Pedidos:"
			:secondary-value="`${kpis.conversao.visitas}`"
		/>
	</div>
</template>
