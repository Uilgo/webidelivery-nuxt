<script setup lang="ts">
/**
 * 📈 VendasComparativo
 *
 * Comparação visual entre período atual e anterior:
 * - Cards lado a lado
 * - Indicador de variação
 * - Percentual de crescimento/redução
 * Visual premium com cards estilizados e fontes maiores.
 */

import type { DadosComparativo } from "../../types/relatorios";
import { formatCurrency } from "~/lib/formatters/currency";

interface Props {
	dados: DadosComparativo | undefined;
	loading?: boolean;
}

withDefaults(defineProps<Props>(), {
	loading: false,
});
</script>

<template>
	<div class="vendas-comparativo">
		<!-- Loading State -->
		<div v-if="loading" class="grid grid-cols-1 md:grid-cols-3 gap-6">
			<div
				v-for="i in 3"
				:key="i"
				class="h-32 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse"
			></div>
		</div>

		<!-- Comparativo -->
		<div v-else-if="dados" class="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
			<!-- Período Anterior -->
			<div
				class="group relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-lg shadow-gray-200/50 dark:shadow-black/20 border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-all"
			>
				<p
					class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide"
				>
					Período Anterior
				</p>
				<p class="text-3xl font-bold text-gray-400 dark:text-gray-500">
					{{ formatCurrency(dados.periodo_anterior) }}
				</p>
			</div>

			<!-- Variação (Central) -->
			<div
				class="relative overflow-hidden rounded-2xl p-6 shadow-lg shadow-gray-200/50 dark:shadow-black/20 flex flex-col items-center justify-center transition-all hover:scale-105 z-10"
				:class="{
					'bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-800':
						dados.variacao_tipo === 'aumento',
					'bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-800':
						dados.variacao_tipo === 'reducao',
					'bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700':
						dados.variacao_tipo === 'neutro',
				}"
			>
				<div
					class="w-16 h-16 rounded-full flex items-center justify-center mb-3 shadow-inner"
					:class="{
						'bg-green-100 dark:bg-green-900/30': dados.variacao_tipo === 'aumento',
						'bg-red-100 dark:bg-red-900/30': dados.variacao_tipo === 'reducao',
						'bg-gray-100 dark:bg-gray-700': dados.variacao_tipo === 'neutro',
					}"
				>
					<Icon
						v-if="dados.variacao_tipo === 'aumento'"
						name="lucide:trending-up"
						class="w-8 h-8 text-green-600 dark:text-green-400"
					/>
					<Icon
						v-else-if="dados.variacao_tipo === 'reducao'"
						name="lucide:trending-down"
						class="w-8 h-8 text-red-600 dark:text-red-400"
					/>
					<Icon v-else name="lucide:minus" class="w-8 h-8 text-gray-400" />
				</div>

				<p
					class="text-4xl font-extrabold tracking-tight"
					:class="{
						'text-green-600 dark:text-green-400': dados.variacao_tipo === 'aumento',
						'text-red-600 dark:text-red-400': dados.variacao_tipo === 'reducao',
						'text-gray-500 dark:text-gray-400': dados.variacao_tipo === 'neutro',
					}"
				>
					{{ dados.variacao_percentual >= 0 ? "+" : "" }}{{ dados.variacao_percentual.toFixed(1) }}%
				</p>
				<p class="text-xs font-medium uppercase tracking-wider mt-1 opacity-70">Variação</p>
			</div>

			<!-- Período Atual -->
			<div
				class="group relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-lg shadow-gray-200/50 dark:shadow-black/20 border border-transparent hover:border-primary-200 dark:hover:border-primary-800 transition-all"
			>
				<div class="h-1 w-full bg-primary-500 absolute top-0 left-0"></div>
				<p
					class="text-sm font-medium text-primary-600 dark:text-primary-400 mb-2 uppercase tracking-wide"
				>
					Período Atual
				</p>
				<p class="text-3xl font-bold text-gray-900 dark:text-white">
					{{ formatCurrency(dados.periodo_atual) }}
				</p>
			</div>
		</div>

		<!-- Empty State -->
		<UiEmptyState
			v-else
			title="Nenhum dado disponível"
			description="Não há dados comparativos para o período selecionado"
			icon="lucide:git-compare"
			size="md"
		/>
	</div>
</template>
