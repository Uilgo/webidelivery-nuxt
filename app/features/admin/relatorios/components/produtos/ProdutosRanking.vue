<script setup lang="ts">
/**
 * 🏆 ProdutosRanking
 *
 * Ranking de produtos em 3 categorias:
 * - Mais vendidos (por quantidade)
 * - Menos vendidos (por quantidade)
 * - Maior receita
 * Visual premium com cards de destaque.
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
				class="h-96 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse"
			></div>
		</div>

		<!-- Rankings -->
		<div v-else-if="dados" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
			<!-- Mais Vendidos -->
			<div
				class="group relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-lg shadow-gray-200/50 dark:shadow-black/20 border border-transparent hover:border-yellow-200 dark:hover:border-yellow-800 transition-all hover:shadow-xl"
			>
				<div class="h-1 w-full bg-yellow-500 absolute top-0 left-0"></div>
				<div class="p-6">
					<div class="flex items-center gap-3 mb-6">
						<div
							class="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg shadow-yellow-500/25"
						>
							<Icon name="lucide:trophy" class="w-5 h-5 text-white" />
						</div>
						<h3 class="text-lg font-bold text-gray-900 dark:text-white">Mais Vendidos</h3>
					</div>

					<div class="space-y-4">
						<div
							v-for="(produto, index) in dados.mais_vendidos"
							:key="produto.id"
							class="flex items-center gap-4 p-3 rounded-xl transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
							:class="{ 'bg-yellow-50/50 dark:bg-yellow-900/10': index === 0 }"
						>
							<div
								class="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm"
								:class="{
									'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400':
										index === 0,
									'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400': index > 0,
								}"
							>
								{{ produto.posicao }}
							</div>
							<div class="flex-1 min-w-0">
								<p class="text-sm font-medium text-gray-900 dark:text-white truncate">
									{{ produto.nome }}
								</p>
								<p class="text-xs text-gray-500 dark:text-gray-400 truncate">
									{{ produto.categoria_nome }}
								</p>
							</div>
							<div class="text-right">
								<p class="text-sm font-bold text-gray-900 dark:text-white">
									{{ formatNumber(produto.quantidade_vendida) }}
								</p>
								<p class="text-[10px] uppercase text-gray-400 dark:text-gray-500">Unid.</p>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Maior Receita -->
			<div
				class="group relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-lg shadow-gray-200/50 dark:shadow-black/20 border border-transparent hover:border-green-200 dark:hover:border-green-800 transition-all hover:shadow-xl"
			>
				<div class="h-1 w-full bg-green-500 absolute top-0 left-0"></div>
				<div class="p-6">
					<div class="flex items-center gap-3 mb-6">
						<div
							class="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/25"
						>
							<Icon name="lucide:dollar-sign" class="w-5 h-5 text-white" />
						</div>
						<h3 class="text-lg font-bold text-gray-900 dark:text-white">Maior Receita</h3>
					</div>

					<div class="space-y-4">
						<div
							v-for="(produto, index) in dados.maior_receita"
							:key="produto.id"
							class="flex items-center gap-4 p-3 rounded-xl transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
							:class="{ 'bg-green-50/50 dark:bg-green-900/10': index === 0 }"
						>
							<div
								class="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm"
								:class="{
									'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400':
										index === 0,
									'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400': index > 0,
								}"
							>
								{{ produto.posicao }}
							</div>
							<div class="flex-1 min-w-0">
								<p class="text-sm font-medium text-gray-900 dark:text-white truncate">
									{{ produto.nome }}
								</p>
								<p class="text-xs text-gray-500 dark:text-gray-400 truncate">
									{{ produto.categoria_nome }}
								</p>
							</div>
							<div class="text-right">
								<p class="text-sm font-bold text-gray-900 dark:text-white">
									{{ formatCurrency(produto.receita) }}
								</p>
								<p class="text-[10px] uppercase text-gray-400 dark:text-gray-500">Receita</p>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Menos Vendidos -->
			<div
				class="group relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-lg shadow-gray-200/50 dark:shadow-black/20 border border-transparent hover:border-orange-200 dark:hover:border-orange-800 transition-all hover:shadow-xl"
			>
				<div class="h-1 w-full bg-orange-500 absolute top-0 left-0"></div>
				<div class="p-6">
					<div class="flex items-center gap-3 mb-6">
						<div
							class="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/25"
						>
							<Icon name="lucide:alert-triangle" class="w-5 h-5 text-white" />
						</div>
						<h3 class="text-lg font-bold text-gray-900 dark:text-white">Menos Vendidos</h3>
					</div>

					<div class="space-y-4">
						<div
							v-for="(produto, index) in dados.menos_vendidos"
							:key="produto.id"
							class="flex items-center gap-4 p-3 rounded-xl transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
							:class="{ 'bg-orange-50/50 dark:bg-orange-900/10': index === 0 }"
						>
							<div
								class="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm"
								:class="{
									'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400':
										index === 0,
									'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400': index > 0,
								}"
							>
								{{ produto.posicao }}
							</div>
							<div class="flex-1 min-w-0">
								<p class="text-sm font-medium text-gray-900 dark:text-white truncate">
									{{ produto.nome }}
								</p>
								<p class="text-xs text-gray-500 dark:text-gray-400 truncate">
									{{ produto.categoria_nome }}
								</p>
							</div>
							<div class="text-right">
								<p class="text-sm font-bold text-gray-900 dark:text-white">
									{{ formatNumber(produto.quantidade_vendida) }}
								</p>
								<p class="text-[10px] uppercase text-gray-400 dark:text-gray-500">Unid.</p>
							</div>
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
