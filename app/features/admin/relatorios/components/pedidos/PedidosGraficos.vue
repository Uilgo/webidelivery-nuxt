<script setup lang="ts">
/**
 * 📈 PedidosGraficos
 *
 * Grid de gráficos do relatório de pedidos:
 * - Pedidos por dia (linha)
 * - Pedidos por status (pizza)
 * - Pedidos por hora (barras)
 * - Pedidos por tipo de entrega (pizza)
 */

import type { RelatorioPedidos } from "../../types/pedidos";
import { formatNumber } from "~/lib/formatters/number";

interface Props {
	dados: RelatorioPedidos["graficos"] | undefined;
	loading?: boolean;
}

withDefaults(defineProps<Props>(), {
	loading: false,
});
</script>

<template>
	<div class="pedidos-graficos space-y-6">
		<!-- Loading State -->
		<div v-if="loading" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
			<div
				v-for="i in 4"
				:key="i"
				class="h-80 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"
			></div>
		</div>

		<!-- Gráficos -->
		<div v-else-if="dados" class="space-y-6">
			<!-- Pedidos por Dia -->
			<div
				class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
			>
				<h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Pedidos por Dia</h3>
				<UiChartLine
					:labels="[...dados.pedidos_por_dia.labels]"
					:datasets="
						dados.pedidos_por_dia.datasets.map((d) => ({
							label: d.label,
							data: [...d.data],
							backgroundColor: d.backgroundColor as string | undefined,
							borderColor: d.borderColor as string | undefined,
							fill: d.fill,
							tension: d.tension,
						}))
					"
					:height="300"
					:show-legend="false"
					:fill="true"
					:value-format="formatNumber"
				/>
			</div>

			<!-- Grid 2 colunas -->
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<!-- Pedidos por Status -->
				<div
					class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
				>
					<h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
						Pedidos por Status
					</h3>
					<UiChartPie
						:labels="[...dados.pedidos_por_status.labels]"
						:data="[...(dados.pedidos_por_status.datasets[0]?.data || [])]"
						:colors="[
							...((dados.pedidos_por_status.datasets[0]?.backgroundColor as string[]) || []),
						]"
						:height="300"
						type="doughnut"
						legend-position="bottom"
						:value-format="formatNumber"
					/>
				</div>

				<!-- Pedidos por Tipo de Entrega -->
				<div
					class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
				>
					<h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
						Pedidos por Tipo de Entrega
					</h3>
					<UiChartPie
						:labels="[...dados.pedidos_por_tipo_entrega.labels]"
						:data="[...(dados.pedidos_por_tipo_entrega.datasets[0]?.data || [])]"
						:colors="[
							...((dados.pedidos_por_tipo_entrega.datasets[0]?.backgroundColor as string[]) || []),
						]"
						:height="300"
						type="pie"
						legend-position="bottom"
						:value-format="formatNumber"
					/>
				</div>
			</div>

			<!-- Pedidos por Hora -->
			<div
				class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
			>
				<h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
					Pedidos por Hora do Dia
				</h3>
				<UiChartBar
					:labels="[...dados.pedidos_por_hora.labels]"
					:datasets="
						dados.pedidos_por_hora.datasets.map((d) => ({
							label: d.label,
							data: [...d.data],
							backgroundColor: d.backgroundColor as string | string[] | undefined,
							borderColor: d.borderColor as string | string[] | undefined,
						}))
					"
					:height="300"
					:show-legend="false"
					:value-format="formatNumber"
				/>
			</div>
		</div>

		<!-- Empty State -->
		<UiEmptyState
			v-else
			title="Nenhum dado disponível"
			description="Não há dados de gráficos para o período selecionado"
			icon="lucide:bar-chart-3"
			size="md"
		/>
	</div>
</template>
