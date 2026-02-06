<script setup lang="ts">
/**
 * 📊 VendasGraficos
 *
 * Gráficos do relatório de vendas:
 * - Faturamento diário (linha)
 * - Faturamento por categoria (pizza)
 * - Comparativo mensal (barras)
 * Design premium com containers modernos.
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
				class="h-80 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse"
			></div>
		</div>

		<!-- Gráficos -->
		<div v-else-if="dados" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
			<!-- Faturamento Diário -->
			<div
				class="group relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-lg shadow-gray-200/50 dark:shadow-black/20 transition-all duration-300 hover:shadow-xl lg:col-span-2"
			>
				<div class="h-1 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500"></div>

				<div class="p-6">
					<div class="flex items-center gap-3 mb-6">
						<div
							class="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center"
						>
							<Icon name="lucide:bar-chart-2" class="w-5 h-5 text-white" />
						</div>
						<div>
							<h3 class="text-base font-bold text-gray-900 dark:text-white">Faturamento Diário</h3>
							<p class="text-xs text-gray-500 dark:text-gray-400">Evolução da receita no período</p>
						</div>
					</div>

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
			</div>

			<!-- Faturamento por Categoria -->
			<div
				class="group relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-lg shadow-gray-200/50 dark:shadow-black/20 transition-all duration-300 hover:shadow-xl"
			>
				<div class="h-1 w-full bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500"></div>

				<div class="p-6">
					<div class="flex items-center gap-3 mb-6">
						<div
							class="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center"
						>
							<Icon name="lucide:pie-chart" class="w-5 h-5 text-white" />
						</div>
						<div>
							<h3 class="text-base font-bold text-gray-900 dark:text-white">
								Faturamento por Categoria
							</h3>
							<p class="text-xs text-gray-500 dark:text-gray-400">Distribuição da receita</p>
						</div>
					</div>

					<UiChartPie
						:labels="[...dados.faturamento_por_categoria.labels]"
						:data="[...(dados.faturamento_por_categoria.datasets[0]?.data || [])]"
						:height="300"
						:value-format="(value: number) => formatCurrency(value)"
						:show-percentage="true"
						legend-position="bottom"
					/>
				</div>
			</div>

			<!-- Comparativo Mensal -->
			<div
				class="group relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-lg shadow-gray-200/50 dark:shadow-black/20 transition-all duration-300 hover:shadow-xl"
			>
				<div class="h-1 w-full bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500"></div>

				<div class="p-6">
					<div class="flex items-center gap-3 mb-6">
						<div
							class="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center"
						>
							<Icon name="lucide:calendar-range" class="w-5 h-5 text-white" />
						</div>
						<div>
							<h3 class="text-base font-bold text-gray-900 dark:text-white">Comparativo Mensal</h3>
							<p class="text-xs text-gray-500 dark:text-gray-400">Desempenho vs meses anteriores</p>
						</div>
					</div>

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
