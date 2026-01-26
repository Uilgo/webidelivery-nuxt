<script setup lang="ts">
/**
 * 📋 ProdutosTabela
 *
 * Tabela detalhada de produtos do relatório:
 * - Lista todos os produtos do período
 * - Formatação de valores e percentuais com barras de progresso
 * - Paginação e busca integradas
 * - Visual premium
 */

import type { RelatorioProdutos } from "../../types/produtos";
import TabelaRelatorio from "../shared/TabelaRelatorio.vue";
import { formatCurrency } from "~/lib/formatters/currency";
import { formatNumber } from "~/lib/formatters/number";

interface Props {
	dados: RelatorioProdutos["tabela"] | undefined;
	loading?: boolean;
}

withDefaults(defineProps<Props>(), {
	loading: false,
});

// Definir colunas da tabela
const colunas = [
	{
		key: "nome",
		label: "Produto",
		sortable: true,
		align: "left" as const,
		width: "250px",
	},
	{
		key: "categoria_nome",
		label: "Categoria",
		sortable: true,
		align: "left" as const,
		width: "150px",
	},
	{
		key: "quantidade_vendida",
		label: "Qtd. Vendida",
		sortable: true,
		align: "right" as const,
		format: (value: unknown) => formatNumber(value as number),
		width: "120px",
	},
	{
		key: "receita_total",
		label: "Receita Total",
		sortable: true,
		align: "right" as const,
		format: (value: unknown) => formatCurrency(value as number),
		width: "140px",
	},
	{
		key: "preco_medio",
		label: "Preço Médio",
		sortable: true,
		align: "right" as const,
		format: (value: unknown) => formatCurrency(value as number),
		width: "120px",
	},
	{
		key: "percentual_vendas",
		label: "% Vendas",
		sortable: true,
		align: "right" as const,
		width: "120px",
	},
];
</script>

<template>
	<div class="produtos-tabela">
		<TabelaRelatorio
			:dados="(dados ? [...dados] : []) as unknown as Record<string, unknown>[]"
			:colunas="colunas"
			:loading="loading"
			:busca="true"
			busca-placeholder="Buscar por produto, categoria..."
			:paginacao="true"
			:itens-por-pagina="10"
			:opcoes-itens-por-pagina="[10, 25, 50, 100]"
			empty-text="Nenhum produto encontrado no período"
			empty-icon="lucide:package"
		>
			<!-- Nome do Produto com destaque -->
			<template #cell-nome="{ value }">
				<span class="font-medium text-gray-900 dark:text-white">
					{{ value }}
				</span>
			</template>

			<!-- Categoria com Badge -->
			<template #cell-categoria_nome="{ value }">
				<span
					class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700"
				>
					{{ value }}
				</span>
			</template>

			<!-- Receita Total com destaque -->
			<template #cell-receita_total="{ value }">
				<span class="font-semibold text-gray-900 dark:text-white">
					{{ formatCurrency(value as number) }}
				</span>
			</template>

			<!-- Percentual de Vendas com Barra de Progresso -->
			<template #cell-percentual_vendas="{ value }">
				<div class="flex items-center gap-2 justify-end">
					<span class="text-xs font-medium text-gray-600 dark:text-gray-400 w-10 text-right">
						{{ (value as number).toFixed(1) }}%
					</span>
					<div class="w-16 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
						<div
							class="h-full bg-blue-500 rounded-full"
							:style="{ width: `${Math.min(value as number, 100)}%` }"
						></div>
					</div>
				</div>
			</template>
		</TabelaRelatorio>
	</div>
</template>
