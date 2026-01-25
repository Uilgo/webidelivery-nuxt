<script setup lang="ts">
/**
 * 📊 VendasGraficos
 *
 * Gráficos do relatório de vendas:
 * - Faturamento diário (linha)
 * - Faturamento por categoria (pizza)
 * - Comparativo mensal (barras)
 */

import type { RelatorioVendas } from "../../types/vendas";
import { formatCurrency } from "~/lib/formatters/currency";

interface Props {
	dados: RelatorioVendas["graficos"] | undefined;
	loading?: boolean;
}

withDefaults(defineProps<Props>(), {
	loading: false,
});
</script>

<template>
	<div class="vendas-graficos space-y-6">
		<!-- Loading State -->
		<div v-if="loading" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
			<div
				v-for="i in 3"
				:key="i"
				class="h-80 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"
			></div>
		</div>

		<!-- Gráficos -->
		<div v-else-if="dados" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
			<!-- Faturamento Diário -->
			<div
				class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
			>
				<h3 class="text-base font-semibold text-gray-900 dark:text-white mb-4">
					Faturamento Diário
				</h3>
				<UiChartLine
					:labels="[...dados.faturamento_diario.labels]"
					:datasets="
						dados.faturamento_diario.datasets.map((d) => ({
							label: d.label,
							data: [...d.data],
							backgroundColor: d.backgroundColor as string | undefined,
							borderColor: d.borderColor,
							fill: d.fill,
							tension: d.tension,
						}))
					"
					:height="300"
					:value-format="(value: number) => formatCurrency(value)"
				/>
			</div>

			<!-- Faturamento por Categoria -->
			<div
				class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
			>
				<h3 class="text-base font-semibold text-gray-900 dark:text-white mb-4">
					Faturamento por Categoria
				</h3>
				<UiChartPie
					:labels="[...dados.faturamento_por_categoria.labels]"
					:data="[...(dados.faturamento_por_categoria.datasets[0]?.data || [])]"
					:height="300"
					:value-format="(value: number) => formatCurrency(value)"
					:show-percentage="true"
					legend-position="bottom"
				/>
			</div>

			<!-- Comparativo Mensal -->
			<div
				class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 lg:col-span-2"
			>
				<h3 class="text-base font-semibold text-gray-900 dark:text-white mb-4">
					Comparativo Mensal
				</h3>
				<UiChartBar
					:labels="[...dados.comparativo_mensal.labels]"
					:datasets="
						dados.comparativo_mensal.datasets.map((d) => ({
							label: d.label,
							data: [...d.data],
							backgroundColor: d.backgroundColor as string | string[] | undefined,
							borderColor: d.borderColor,
						}))
					"
					:height="300"
					:value-format="(value: number) => formatCurrency(value)"
				/>
			</div>
		</div>

		<!-- Empty State -->
		<UiEmptyState
			v-else
			title="Nenhum dado disponível"
			description="Não há dados de faturamento para o período selecionado"
			icon="lucide:bar-chart-3"
			size="md"
		/>
	</div>
</template>
