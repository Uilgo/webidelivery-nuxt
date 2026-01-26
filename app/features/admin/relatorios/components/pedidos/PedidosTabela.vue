<script setup lang="ts">
/**
 * 📋 PedidosTabela
 *
 * Tabela detalhada de pedidos do relatório:
 * - Lista todos os pedidos do período
 * - Formatação de valores e datas
 * - Badges de status modernos
 * - Paginação e busca integradas
 * - Visual premium para melhor legibilidade
 */

import type { RelatorioPedidos } from "../../types/pedidos";
import TabelaRelatorio from "../shared/TabelaRelatorio.vue";
import { formatCurrency } from "~/lib/formatters/currency";
import { formatDateTime, formatDuration } from "~/lib/formatters/date";

interface Props {
	dados: RelatorioPedidos["tabela"] | undefined;
	loading?: boolean;
}

withDefaults(defineProps<Props>(), {
	loading: false,
});

// Definir colunas da tabela
const colunas = [
	{
		key: "codigo",
		label: "Código",
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
		key: "cliente",
		label: "Cliente",
		sortable: true,
		align: "left" as const,
	},
	{
		key: "valor",
		label: "Valor",
		sortable: true,
		align: "right" as const,
		format: (value: unknown) => formatCurrency(value as number),
		width: "140px",
	},
	{
		key: "status",
		label: "Status",
		sortable: true,
		align: "center" as const,
		width: "160px",
	},
	{
		key: "tipo_entrega",
		label: "Tipo",
		sortable: true,
		align: "center" as const,
		width: "140px",
	},
	{
		key: "tempo_preparo",
		label: "Tempo Preparo",
		sortable: true,
		align: "right" as const,
		format: (value: unknown) => formatDuration(value as number),
		width: "140px",
	},
	{
		key: "tempo_entrega",
		label: "Tempo Entrega",
		sortable: true,
		align: "right" as const,
		format: (value: unknown) => (value ? formatDuration(value as number) : "-"),
		width: "140px",
	},
];

// Mapear status para configuração visual (cores e ícones)
const statusConfig: Record<
	string,
	{
		label: string;
		classes: string;
		icon: string;
	}
> = {
	pendente: {
		label: "Pendente",
		classes:
			"bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
		icon: "lucide:clock",
	},
	aceito: {
		label: "Aceito",
		classes:
			"bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800",
		icon: "lucide:thumbs-up",
	},
	preparo: {
		label: "Em Preparo",
		classes:
			"bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800",
		icon: "lucide:chef-hat",
	},
	pronto: {
		label: "Pronto",
		classes:
			"bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 border-teal-200 dark:border-teal-800",
		icon: "lucide:shopping-bag",
	},
	entrega: {
		label: "Em Entrega",
		classes:
			"bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800",
		icon: "lucide:bike",
	},
	concluido: {
		label: "Concluído",
		classes:
			"bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800",
		icon: "lucide:check-circle",
	},
	cancelado: {
		label: "Cancelado",
		classes:
			"bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
		icon: "lucide:x-circle",
	},
};

// Mapear tipo de entrega para configuração visual
const tipoEntregaConfig: Record<
	string,
	{
		label: string;
		classes: string;
		icon: string;
	}
> = {
	delivery: {
		label: "Delivery",
		classes:
			"bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700",
		icon: "lucide:truck",
	},
	retirada: {
		label: "Retirada",
		classes:
			"bg-white text-gray-700 dark:bg-gray-900 dark:text-gray-300 border-gray-200 dark:border-gray-700 border",
		icon: "lucide:store",
	},
};
</script>

<template>
	<div class="pedidos-tabela">
		<TabelaRelatorio
			:dados="(dados ? [...dados] : []) as unknown as Record<string, unknown>[]"
			:colunas="colunas"
			:loading="loading"
			:busca="true"
			busca-placeholder="Buscar pedido por código, cliente..."
			:paginacao="true"
			:itens-por-pagina="10"
			:opcoes-itens-por-pagina="[10, 25, 50, 100]"
			empty-text="Nenhum pedido encontrado no período selecionado"
			empty-icon="lucide:search-x"
		>
			<!-- Código com visual mono -->
			<template #cell-codigo="{ value }">
				<span
					class="font-mono font-medium text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-900 px-2 py-1 rounded border border-gray-200 dark:border-gray-800 text-xs"
				>
					{{ value }}
				</span>
			</template>

			<!-- Valor com destaque -->
			<template #cell-valor="{ value }">
				<span class="font-semibold text-gray-900 dark:text-white">
					{{ formatCurrency(value as number) }}
				</span>
			</template>

			<!-- Slot customizado para status -->
			<template #cell-status="{ value }">
				<span
					class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors"
					:class="
						statusConfig[value as string]?.classes || 'bg-gray-100 text-gray-600 border-gray-200'
					"
				>
					<Icon
						:name="statusConfig[value as string]?.icon || 'lucide:help-circle'"
						class="w-3.5 h-3.5"
					/>
					{{ statusConfig[value as string]?.label || value }}
				</span>
			</template>

			<!-- Slot customizado para tipo de entrega -->
			<template #cell-tipo_entrega="{ value }">
				<span
					class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors"
					:class="tipoEntregaConfig[value as string]?.classes"
				>
					<Icon
						:name="tipoEntregaConfig[value as string]?.icon || 'lucide:package'"
						class="w-3.5 h-3.5"
					/>
					{{ tipoEntregaConfig[value as string]?.label || value }}
				</span>
			</template>
		</TabelaRelatorio>
	</div>
</template>
