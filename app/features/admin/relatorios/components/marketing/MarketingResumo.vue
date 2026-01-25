<script setup lang="ts">
/**
 * 📋 MarketingResumo
 *
 * Exibe resumo geral do relatório de marketing.
 */

import type { ResumoMarketing } from "../../types/marketing";
import { formatCurrency } from "~/lib/formatters/currency";
import { formatNumber } from "~/lib/formatters/number";

interface Props {
	resumo: ResumoMarketing;
	loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	loading: false,
});

// Estatísticas formatadas
const estatisticas = computed(() => [
	{
		label: "Total de Cupons Ativos",
		valor: formatNumber(props.resumo.total_cupons_ativos),
		icone: "lucide:ticket",
		cor: "blue",
	},
	{
		label: "Total de Cupons Usados",
		valor: formatNumber(props.resumo.total_cupons_usados),
		icone: "lucide:check-circle",
		cor: "green",
	},
	{
		label: "Desconto Total Concedido",
		valor: formatCurrency(props.resumo.desconto_total_concedido),
		icone: "lucide:percent",
		cor: "red",
	},
	{
		label: "Receita com Cupons",
		valor: formatCurrency(props.resumo.receita_com_cupons),
		icone: "lucide:dollar-sign",
		cor: "green",
	},
	{
		label: "Economia Média por Cliente",
		valor: formatCurrency(props.resumo.economia_media_cliente),
		icone: "lucide:piggy-bank",
		cor: "purple",
	},
	{
		label: "Taxa de Conversão Geral",
		valor: `${props.resumo.taxa_conversao_geral.toFixed(1)}%`,
		icone: "lucide:trending-up",
		cor: "blue",
	},
]);

// Cores dos ícones
const coresIcone: Record<string, string> = {
	blue: "text-blue-500",
	green: "text-green-500",
	red: "text-red-500",
	purple: "text-purple-500",
	yellow: "text-yellow-500",
};
</script>

<template>
	<UiCard>
		<template #header>
			<div class="flex items-center gap-2">
				<Icon name="lucide:file-text" class="w-5 h-5 text-gray-500" />
				<h3 class="text-lg font-semibold">Resumo Geral</h3>
			</div>
		</template>

		<div v-if="loading">
			<UiSkeleton class="h-48 w-full" />
		</div>

		<div v-else class="space-y-6">
			<!-- Estatísticas -->
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
				<div
					v-for="(stat, index) in estatisticas"
					:key="index"
					class="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
				>
					<div
						class="flex items-center justify-center w-10 h-10 bg-white dark:bg-gray-700 rounded-full"
					>
						<Icon :name="stat.icone" :class="['w-5 h-5', coresIcone[stat.cor]]" />
					</div>
					<div>
						<p class="text-sm text-gray-500 dark:text-gray-400">{{ stat.label }}</p>
						<p class="text-lg font-semibold text-gray-900 dark:text-white">{{ stat.valor }}</p>
					</div>
				</div>
			</div>

			<!-- Cupom Mais Usado -->
			<div v-if="resumo.cupom_mais_usado" class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
				<div class="flex items-center gap-3">
					<div
						class="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full"
					>
						<Icon name="lucide:trophy" class="w-6 h-6 text-blue-600 dark:text-blue-400" />
					</div>
					<div>
						<p class="text-sm text-gray-600 dark:text-gray-300">Cupom Mais Usado</p>
						<p class="text-xl font-bold text-blue-600 dark:text-blue-400">
							{{ resumo.cupom_mais_usado.codigo }}
						</p>
						<p class="text-sm text-gray-500 dark:text-gray-400">
							{{ formatNumber(resumo.cupom_mais_usado.usos) }} usos
						</p>
					</div>
				</div>
			</div>

			<!-- Sem cupom mais usado -->
			<div v-else class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
				<p class="text-sm text-gray-500 dark:text-gray-400">Nenhum cupom foi usado no período</p>
			</div>
		</div>
	</UiCard>
</template>
