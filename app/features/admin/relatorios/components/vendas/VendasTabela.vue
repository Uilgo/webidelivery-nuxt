<script setup lang="ts">
/**
 * 📋 VendasTabela
 *
 * Tabela detalhada de vendas do relatório:
 * - Lista todas as vendas do período
 * - Formatação de valores e datas
 * - Paginação e busca integradas
 * - Visual premium com formatação monetária destacada
 */

import type { RelatorioVendas } from "../../types/vendas";
import TabelaRelatorio from "../shared/TabelaRelatorio.vue";
import { formatCurrency } from "~/lib/formatters/currency";
import { formatDateTime } from "~/lib/formatters/date";

interface Props {
	dados: RelatorioVendas["tabela"] | undefined;
	loading?: boolean;
}

withDefaults(defineProps<Props>(), {
	loading: false,
});

// Definir colunas da tabela
const colunas = [
	{
		key: "numero",
		label: "Número",
		sortable: true,
		align: "left" as const,
		width: "120px",
	},
	{
		key: "data",
		label: "Data",
		sortable: true,
		align: "left" as const,
		format: (value: unknown) => formatDateTime(value as string),
		width: "180px",
	},
	{
		key: "cliente_nome",
		label: "Cliente",
		sortable: true,
		align: "left" as const,
	},
	{
		key: "subtotal",
		label: "Subtotal",
		sortable: true,
		align: "right" as const,
		format: (value: unknown) => formatCurrency(value as number),
		width: "120px",
	},
	{
		key: "desconto",
		label: "Desconto",
		sortable: true,
		align: "right" as const,
		format: (value: unknown) => formatCurrency(value as number),
		width: "120px",
	},
	{
		key: "taxa_entrega",
		label: "Taxa Entrega",
		sortable: true,
		align: "right" as const,
		format: (value: unknown) => formatCurrency(value as number),
		width: "130px",
	},
	{
		key: "total",
		label: "Total",
		sortable: true,
		align: "right" as const,
		format: (value: unknown) => formatCurrency(value as number),
		width: "140px",
	},
	{
		key: "forma_pagamento",
		label: "Pagamento",
		sortable: true,
		align: "center" as const,
		width: "160px",
	},
];

// Configuração visual para formas de pagamento
const pagamentoConfig: Record<string, { icon: string; classes: string }> = {
	"Cartão de Crédito": {
		icon: "lucide:credit-card",
		classes:
			"bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200 dark:border-blue-800",
	},
	"Cartão de Débito": {
		icon: "lucide:credit-card",
		classes:
			"bg-cyan-50 text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800",
	},
	PIX: {
		icon: "lucide:zap",
		classes:
			"bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
	},
	Dinheiro: {
		icon: "lucide:banknote",
		classes:
			"bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800",
	},
};
</script>

<template>
	<div class="vendas-tabela">
		<TabelaRelatorio
			:dados="(dados ? [...dados] : []) as unknown as Record<string, unknown>[]"
			:colunas="colunas"
			:loading="loading"
			:busca="true"
			busca-placeholder="Buscar venda por número, cliente..."
			:paginacao="true"
			:itens-por-pagina="10"
			:opcoes-itens-por-pagina="[10, 25, 50, 100]"
			empty-text="Nenhuma venda encontrada no período"
			empty-icon="lucide:dollar-sign"
		>
			<!-- Número com visual mono -->
			<template #cell-numero="{ value }">
				<span
					class="font-mono font-medium text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-900 px-2 py-1 rounded border border-gray-200 dark:border-gray-800 text-xs"
				>
					#{{ value }}
				</span>
			</template>

			<!-- Desconto em vermelho suave -->
			<template #cell-desconto="{ value }">
				<span v-if="Number(value) > 0" class="text-red-500 dark:text-red-400 text-xs">
					-{{ formatCurrency(value as number) }}
				</span>
				<span v-else class="text-gray-400">-</span>
			</template>

			<!-- Total destacado -->
			<template #cell-total="{ value }">
				<span class="font-bold text-gray-900 dark:text-white">
					{{ formatCurrency(value as number) }}
				</span>
			</template>

			<!-- Forma de Pagamento com Badge -->
			<template #cell-forma_pagamento="{ value }">
				<span
					class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors whitespace-nowrap"
					:class="
						pagamentoConfig[value as string]?.classes || 'bg-gray-100 text-gray-600 border-gray-200'
					"
				>
					<Icon
						:name="pagamentoConfig[value as string]?.icon || 'lucide:wallet'"
						class="w-3.5 h-3.5"
					/>
					{{ value }}
				</span>
			</template>
		</TabelaRelatorio>
	</div>
</template>
