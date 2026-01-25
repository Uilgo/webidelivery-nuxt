<script setup lang="ts">
/**
 * 📋 FinanceiroResumo
 *
 * Exibe resumo geral do relatório financeiro.
 */

import type { ResumoFinanceiro } from "../../types/financeiro";
import { formatCurrency } from "~/lib/formatters/currency";
import { formatNumber } from "~/lib/formatters/number";

interface Props {
	resumo: ResumoFinanceiro;
	loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	loading: false,
});

// Estatísticas formatadas
const estatisticas = computed(() => [
	{
		label: "Total de Transações",
		valor: formatNumber(props.resumo.total_transacoes),
		icone: "lucide:hash",
		cor: "blue",
	},
	{
		label: "Receita Bruta",
		valor: formatCurrency(props.resumo.receita_bruta),
		icone: "lucide:dollar-sign",
		cor: "blue",
	},
	{
		label: "Receita Líquida",
		valor: formatCurrency(props.resumo.receita_liquida),
		icone: "lucide:trending-up",
		cor: "green",
	},
	{
		label: "Total Descontos",
		valor: formatCurrency(props.resumo.total_descontos),
		icone: "lucide:percent",
		cor: "red",
	},
	{
		label: "Taxas de Entrega",
		valor: formatCurrency(props.resumo.total_taxas_entrega),
		icone: "lucide:truck",
		cor: "blue",
	},
	{
		label: "Lucro Estimado",
		valor: formatCurrency(props.resumo.lucro_estimado),
		icone: "lucide:piggy-bank",
		cor: "purple",
	},
	{
		label: "Margem de Lucro",
		valor: `${props.resumo.margem_lucro.toFixed(1)}%`,
		icone: "lucide:percent",
		cor: "green",
	},
	{
		label: "Ticket Médio",
		valor: formatCurrency(props.resumo.ticket_medio),
		icone: "lucide:trending-up",
		cor: "green",
	},
]);

// Método mais usado
const metodoMaisUsado = computed(() => {
	const distribuicao = props.resumo.distribuicao_pagamentos;
	let metodo = "";
	let quantidade = 0;

	Object.entries(distribuicao).forEach(([key, value]) => {
		if (value > quantidade) {
			metodo = key;
			quantidade = value;
		}
	});

	return metodo ? { metodo, quantidade } : null;
});

// Cores dos ícones
const coresIcone: Record<string, string> = {
	blue: "text-blue-500",
	green: "text-green-500",
	red: "text-red-500",
	orange: "text-orange-500",
	purple: "text-purple-500",
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
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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

			<!-- Método Mais Usado -->
			<div v-if="metodoMaisUsado" class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
				<div class="flex items-center gap-3">
					<div
						class="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full"
					>
						<Icon name="lucide:trophy" class="w-6 h-6 text-blue-600 dark:text-blue-400" />
					</div>
					<div>
						<p class="text-sm text-gray-600 dark:text-gray-300">Método Mais Usado</p>
						<p class="text-xl font-bold text-blue-600 dark:text-blue-400">
							{{ metodoMaisUsado.metodo }}
						</p>
						<p class="text-sm text-gray-500 dark:text-gray-400">
							{{ formatNumber(metodoMaisUsado.quantidade) }} transações
						</p>
					</div>
				</div>
			</div>

			<!-- Sem método mais usado -->
			<div v-else class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
				<p class="text-sm text-gray-500 dark:text-gray-400">Nenhuma transação no período</p>
			</div>
		</div>
	</UiCard>
</template>
