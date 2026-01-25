<script setup lang="ts">
/**
 * 📊 ProdutosGraficos
 *
 * Gráficos do relatório de produtos:
 * - Vendas por categoria (pizza)
 * - Evolução de vendas (linha)
 * - Top 10 produtos (barras)
 */

import type { RelatorioProdutos } from "../../types/produtos";
import { formatNumber } from "~/lib/formatters/number";

interface Props {
	dados: RelatorioProdutos["graficos"] | undefined;
	loading?: boolean;
}

withDefaults(defineProps<Props>(), {
	loading: false,
});
</script>

<template>
	<div class="produtos-graficos space-y-6">
		<!-- Loading State -->
		<div v-if="loading" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
			<div
				v-for="i in 3"
				:key="i"
				class="h-80 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"
			></div>
		</div>

		<!-- Gráficos -->
		<div v-else-if="dados" class="space-y-6">
			<!-- Grid 2 colunas -->
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<!-- Vendas por Categoria -->
				<div
					class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
				>
					<h3 class="text-base font-semibold text-gray-900 dark:text-white mb-4">
						Vendas por Categoria
					</h3>
					<UiChartPie
						:labels="[...dados.vendas_por_categoria.labels]"
						:data="[...(dados.vendas_por_categoria.datasets[0]?.data || [])]"
						:height="300"
						:value-format="(value: number) => formatNumber(value)"
						:show-percentage="true"
						legend-position="bottom"
					/>
				</div>

				<!-- Evolução de Vendas -->
				<div
					class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
				>
					<h3 class="text-base font-semibold text-gray-900 dark:text-white mb-4">
						Evolução de Vendas
					</h3>
					<UiChartLine
						:labels="[...dados.evolucao_vendas.labels]"
						:datasets="
							dados.evolucao_vendas.datasets.map((d) => ({
								label: d.label,
								data: [...d.data],
								backgroundColor: d.backgroundColor as string | undefined,
								borderColor: d.borderColor,
								fill: d.fill,
								tension: d.tension,
							}))
						"
						:height="300"
						:value-format="(value: number) => formatNumber(value)"
					/>
				</div>
			</div>

			<!-- Top 10 Produtos -->
			<div
				class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
			>
				<h3 class="text-base font-semibold text-gray-900 dark:text-white mb-4">
					Top 10 Produtos Mais Vendidos
				</h3>
				<UiChartBar
					:labels="[...dados.top_10_produtos.labels]"
					:datasets="
						dados.top_10_produtos.datasets.map((d) => ({
							label: d.label,
							data: [...d.data],
							backgroundColor: d.backgroundColor as string | string[] | undefined,
						}))
					"
					:height="300"
					orientation="horizontal"
					:value-format="(value: number) => formatNumber(value)"
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
