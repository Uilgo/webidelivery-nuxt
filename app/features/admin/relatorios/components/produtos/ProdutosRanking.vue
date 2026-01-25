<script setup lang="ts">
/**
 * 🏆 ProdutosRanking
 *
 * Ranking de produtos em 3 categorias:
 * - Mais vendidos (por quantidade)
 * - Menos vendidos (por quantidade)
 * - Maior receita
 */

import type { RelatorioProdutos } from "../../types/produtos";
import { formatCurrency } from "~/lib/formatters/currency";
import { formatNumber } from "~/lib/formatters/number";

interface Props {
	dados: RelatorioProdutos["ranking"] | undefined;
	loading?: boolean;
}

withDefaults(defineProps<Props>(), {
	loading: false,
});
</script>

<template>
	<div class="produtos-ranking">
		<!-- Loading State -->
		<div v-if="loading" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
			<div
				v-for="i in 3"
				:key="i"
				class="h-96 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"
			></div>
		</div>

		<!-- Rankings -->
		<div v-else-if="dados" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
			<!-- Mais Vendidos -->
			<div
				class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
			>
				<div class="flex items-center gap-2 mb-4">
					<Icon name="lucide:trophy" class="w-5 h-5 text-yellow-600" />
					<h3 class="text-base font-semibold text-gray-900 dark:text-white">Mais Vendidos</h3>
				</div>
				<div class="space-y-3">
					<div
						v-for="produto in dados.mais_vendidos"
						:key="produto.id"
						class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
					>
						<div
							class="flex-shrink-0 w-10 h-10 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center"
						>
							<span class="text-sm font-bold text-yellow-700 dark:text-yellow-400">
								{{ produto.posicao }}
							</span>
						</div>
						<div class="flex-1 min-w-0">
							<p class="text-sm font-medium text-gray-900 dark:text-white truncate">
								{{ produto.nome }}
							</p>
							<p class="text-xs text-gray-500 dark:text-gray-400">
								{{ produto.categoria_nome }}
							</p>
						</div>
						<div class="text-right">
							<p class="text-sm font-semibold text-gray-900 dark:text-white">
								{{ formatNumber(produto.quantidade_vendida) }}
							</p>
							<p class="text-xs text-gray-500 dark:text-gray-400">unidades</p>
						</div>
					</div>
				</div>
			</div>

			<!-- Maior Receita -->
			<div
				class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
			>
				<div class="flex items-center gap-2 mb-4">
					<Icon name="lucide:dollar-sign" class="w-5 h-5 text-green-600" />
					<h3 class="text-base font-semibold text-gray-900 dark:text-white">Maior Receita</h3>
				</div>
				<div class="space-y-3">
					<div
						v-for="produto in dados.maior_receita"
						:key="produto.id"
						class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
					>
						<div
							class="flex-shrink-0 w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center"
						>
							<span class="text-sm font-bold text-green-700 dark:text-green-400">
								{{ produto.posicao }}
							</span>
						</div>
						<div class="flex-1 min-w-0">
							<p class="text-sm font-medium text-gray-900 dark:text-white truncate">
								{{ produto.nome }}
							</p>
							<p class="text-xs text-gray-500 dark:text-gray-400">
								{{ produto.categoria_nome }}
							</p>
						</div>
						<div class="text-right">
							<p class="text-sm font-semibold text-gray-900 dark:text-white">
								{{ formatCurrency(produto.receita) }}
							</p>
							<p class="text-xs text-gray-500 dark:text-gray-400">receita</p>
						</div>
					</div>
				</div>
			</div>

			<!-- Menos Vendidos -->
			<div
				class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
			>
				<div class="flex items-center gap-2 mb-4">
					<Icon name="lucide:alert-triangle" class="w-5 h-5 text-orange-600" />
					<h3 class="text-base font-semibold text-gray-900 dark:text-white">Menos Vendidos</h3>
				</div>
				<div class="space-y-3">
					<div
						v-for="produto in dados.menos_vendidos"
						:key="produto.id"
						class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
					>
						<div
							class="flex-shrink-0 w-10 h-10 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center"
						>
							<span class="text-sm font-bold text-orange-700 dark:text-orange-400">
								{{ produto.posicao }}
							</span>
						</div>
						<div class="flex-1 min-w-0">
							<p class="text-sm font-medium text-gray-900 dark:text-white truncate">
								{{ produto.nome }}
							</p>
							<p class="text-xs text-gray-500 dark:text-gray-400">
								{{ produto.categoria_nome }}
							</p>
						</div>
						<div class="text-right">
							<p class="text-sm font-semibold text-gray-900 dark:text-white">
								{{ formatNumber(produto.quantidade_vendida) }}
							</p>
							<p class="text-xs text-gray-500 dark:text-gray-400">unidades</p>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Empty State -->
		<UiEmptyState
			v-else
			title="Nenhum dado disponível"
			description="Não há dados de ranking para o período selecionado"
			icon="lucide:bar-chart-3"
			size="md"
		/>
	</div>
</template>
