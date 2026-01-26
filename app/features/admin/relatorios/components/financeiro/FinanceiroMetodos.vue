<script setup lang="ts">
/**
 * 💳 FinanceiroMetodos
 *
 * Exibe receita por método de pagamento.
 */

import type { MetodosPagamento } from "../../types/financeiro";
import { formatCurrency } from "~/lib/formatters/currency";

interface Props {
	metodos?: MetodosPagamento;
	loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	metodos: undefined,
	loading: false,
});

// Calcular percentuais
const metodosComPercentual = computed(() => {
	if (!props.metodos) return [];
	return [
		{
			nome: "Dinheiro",
			valor: props.metodos.dinheiro.valor_total,
			percentual: props.metodos.dinheiro.percentual_total,
			icone: "lucide:banknote",
			cor: "green",
		},
		{
			nome: "PIX",
			valor: props.metodos.pix.valor_total,
			percentual: props.metodos.pix.percentual_total,
			icone: "lucide:smartphone",
			cor: "blue",
		},
		{
			nome: "Crédito",
			valor: props.metodos.credito.valor_total,
			percentual: props.metodos.credito.percentual_total,
			icone: "lucide:credit-card",
			cor: "orange",
		},
		{
			nome: "Débito",
			valor: props.metodos.debito.valor_total,
			percentual: props.metodos.debito.percentual_total,
			icone: "lucide:credit-card",
			cor: "purple",
		},
	];
});

// Cores dos ícones
const coresIcone: Record<string, string> = {
	green: "text-green-500 bg-green-100 dark:bg-green-900",
	blue: "text-blue-500 bg-blue-100 dark:bg-blue-900",
	orange: "text-orange-500 bg-orange-100 dark:bg-orange-900",
	purple: "text-purple-500 bg-purple-100 dark:bg-purple-900",
};
</script>

<template>
	<UiCard>
		<template #header>
			<div class="flex items-center gap-2">
				<Icon name="lucide:wallet" class="w-5 h-5 text-blue-500" />
				<h3 class="text-lg font-semibold">Receita por Método de Pagamento</h3>
			</div>
		</template>

		<div v-if="loading">
			<UiSkeleton class="h-48 w-full" />
		</div>

		<div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
			<div
				v-for="metodo in metodosComPercentual"
				:key="metodo.nome"
				class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
			>
				<div class="flex items-center gap-3 mb-3">
					<div
						:class="[
							'flex items-center justify-center w-10 h-10 rounded-full',
							coresIcone[metodo.cor],
						]"
					>
						<Icon :name="metodo.icone" class="w-5 h-5" />
					</div>
					<div>
						<p class="text-sm text-gray-500 dark:text-gray-400">{{ metodo.nome }}</p>
						<p class="text-lg font-semibold text-gray-900 dark:text-white">
							{{ formatCurrency(metodo.valor) }}
						</p>
					</div>
				</div>
				<div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
					<div
						:class="[
							'h-2 rounded-full transition-all',
							metodo.cor === 'green' && 'bg-green-500',
							metodo.cor === 'blue' && 'bg-blue-500',
							metodo.cor === 'orange' && 'bg-orange-500',
							metodo.cor === 'purple' && 'bg-purple-500',
						]"
						:style="{ width: `${metodo.percentual}%` }"
					></div>
				</div>
				<p class="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
					{{ metodo.percentual.toFixed(1) }}%
				</p>
			</div>
		</div>
	</UiCard>
</template>
