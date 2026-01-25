<script setup lang="ts">
/**
 * 📈 VendasComparativo
 *
 * Comparação visual entre período atual e anterior:
 * - Cards lado a lado
 * - Indicador de variação
 * - Percentual de crescimento/redução
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
		<div v-if="loading" class="grid grid-cols-1 md:grid-cols-3 gap-4">
			<div
				v-for="i in 3"
				:key="i"
				class="h-32 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"
			></div>
		</div>

		<!-- Comparativo -->
		<div v-else-if="dados" class="grid grid-cols-1 md:grid-cols-3 gap-4">
			<!-- Período Anterior -->
			<div
				class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
			>
				<p class="text-sm text-gray-600 dark:text-gray-400 mb-2">Período Anterior</p>
				<p class="text-2xl font-bold text-gray-900 dark:text-white">
					{{ formatCurrency(dados.periodo_anterior) }}
				</p>
			</div>

			<!-- Variação -->
			<div
				class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 flex flex-col items-center justify-center"
			>
				<Icon
					v-if="dados.variacao_tipo === 'aumento'"
					name="lucide:trending-up"
					class="w-12 h-12 text-green-600 mb-2"
				/>
				<Icon
					v-else-if="dados.variacao_tipo === 'reducao'"
					name="lucide:trending-down"
					class="w-12 h-12 text-red-600 mb-2"
				/>
				<Icon v-else name="lucide:minus" class="w-12 h-12 text-gray-400 mb-2" />
				<p
					class="text-3xl font-bold"
					:class="{
						'text-green-600': dados.variacao_tipo === 'aumento',
						'text-red-600': dados.variacao_tipo === 'reducao',
						'text-gray-500': dados.variacao_tipo === 'neutro',
					}"
				>
					{{ dados.variacao_percentual >= 0 ? "+" : "" }}{{ dados.variacao_percentual.toFixed(1) }}%
				</p>
			</div>

			<!-- Período Atual -->
			<div
				class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
			>
				<p class="text-sm text-gray-600 dark:text-gray-400 mb-2">Período Atual</p>
				<p class="text-2xl font-bold text-gray-900 dark:text-white">
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
