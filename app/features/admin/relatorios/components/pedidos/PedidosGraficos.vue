<script setup lang="ts">
/**
 * 📈 PedidosGraficos
 *
 * Grid de gráficos do relatório de pedidos:
 * - Pedidos por dia (linha) - Destaque principal
 * - Pedidos por status (pizza)
 * - Pedidos por hora (barras)
 * - Pedidos por tipo de entrega (pizza)
 * Design premium com containers modernos
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
		<div v-if="loading" class="space-y-6">
			<div class="h-80 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse"></div>
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<div
					v-for="i in 2"
					:key="i"
					class="h-72 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse"
				></div>
			</div>
			<div class="h-72 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse"></div>
		</div>

		<!-- Gráficos -->
		<div v-else-if="dados" class="space-y-6">
			<!-- Gráfico Principal: Pedidos por Dia -->
			<div
				class="group relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-lg shadow-gray-200/50 dark:shadow-black/20 transition-all duration-300 hover:shadow-xl"
			>
				<!-- Linha colorida no topo -->
				<div class="h-1 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>

				<div class="p-6">
					<!-- Header do gráfico -->
					<div class="flex items-center justify-between mb-6">
						<div class="flex items-center gap-3">
							<div
								class="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center"
							>
								<Icon name="lucide:trending-up" class="w-5 h-5 text-white" />
							</div>
							<div>
								<h3 class="text-lg font-bold text-gray-900 dark:text-white">Pedidos por Dia</h3>
								<p class="text-sm text-gray-500 dark:text-gray-400">Evolução diária do período</p>
							</div>
						</div>
					</div>

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
			</div>

			<!-- Grid 2 colunas: Status e Tipo Entrega -->
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<!-- Pedidos por Status -->
				<div
					class="group relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-lg shadow-gray-200/50 dark:shadow-black/20 transition-all duration-300 hover:shadow-xl"
				>
					<div class="h-1 w-full bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500"></div>

					<div class="p-6">
						<div class="flex items-center gap-3 mb-6">
							<div
								class="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center"
							>
								<Icon name="lucide:check-circle" class="w-5 h-5 text-white" />
							</div>
							<div>
								<h3 class="text-base font-bold text-gray-900 dark:text-white">
									Pedidos por Status
								</h3>
								<p class="text-xs text-gray-500 dark:text-gray-400">Distribuição de status</p>
							</div>
						</div>

						<UiChartPie
							:labels="[...dados.pedidos_por_status.labels]"
							:data="[...(dados.pedidos_por_status.datasets[0]?.data || [])]"
							:colors="[
								...((dados.pedidos_por_status.datasets[0]?.backgroundColor as string[]) || []),
							]"
							:height="240"
							type="doughnut"
							legend-position="bottom"
							:value-format="formatNumber"
						/>
					</div>
				</div>

				<!-- Pedidos por Tipo de Entrega -->
				<div
					class="group relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-lg shadow-gray-200/50 dark:shadow-black/20 transition-all duration-300 hover:shadow-xl"
				>
					<div
						class="h-1 w-full bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500"
					></div>

					<div class="p-6">
						<div class="flex items-center gap-3 mb-6">
							<div
								class="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center"
							>
								<Icon name="lucide:truck" class="w-5 h-5 text-white" />
							</div>
							<div>
								<h3 class="text-base font-bold text-gray-900 dark:text-white">Tipo de Entrega</h3>
								<p class="text-xs text-gray-500 dark:text-gray-400">Delivery vs Retirada</p>
							</div>
						</div>

						<UiChartPie
							:labels="[...dados.pedidos_por_tipo_entrega.labels]"
							:data="[...(dados.pedidos_por_tipo_entrega.datasets[0]?.data || [])]"
							:colors="[
								...((dados.pedidos_por_tipo_entrega.datasets[0]?.backgroundColor as string[]) ||
									[]),
							]"
							:height="240"
							type="pie"
							legend-position="bottom"
							:value-format="formatNumber"
						/>
					</div>
				</div>
			</div>

			<!-- Gráfico: Pedidos por Hora -->
			<div
				class="group relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-lg shadow-gray-200/50 dark:shadow-black/20 transition-all duration-300 hover:shadow-xl"
			>
				<div
					class="h-1 w-full bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500"
				></div>

				<div class="p-6">
					<div class="flex items-center justify-between mb-6">
						<div class="flex items-center gap-3">
							<div
								class="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center"
							>
								<Icon name="lucide:clock" class="w-5 h-5 text-white" />
							</div>
							<div>
								<h3 class="text-lg font-bold text-gray-900 dark:text-white">Pedidos por Hora</h3>
								<p class="text-sm text-gray-500 dark:text-gray-400">Identifique horários de pico</p>
							</div>
						</div>
					</div>

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
						:height="280"
						:show-legend="false"
						:value-format="formatNumber"
					/>
				</div>
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
