<script setup lang="ts">
/**
 * 📋 ProdutosTabela
 *
 * Tabela detalhada de produtos do relatório:
 * - Lista todos os produtos do período
 * - Formatação de valores e percentuais
 * - Paginação e busca integradas
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
	},
	{
		key: "categoria_nome",
		label: "Categoria",
		sortable: true,
		align: "left" as const,
	},
	{
		key: "quantidade_vendida",
		label: "Qtd. Vendida",
		sortable: true,
		align: "right" as const,
		format: (value: unknown) => formatNumber(value as number),
	},
	{
		key: "receita_total",
		label: "Receita Total",
		sortable: true,
		align: "right" as const,
		format: (value: unknown) => formatCurrency(value as number),
	},
	{
		key: "preco_medio",
		label: "Preço Médio",
		sortable: true,
		align: "right" as const,
		format: (value: unknown) => formatCurrency(value as number),
	},
	{
		key: "percentual_vendas",
		label: "% Vendas",
		sortable: true,
		align: "right" as const,
		format: (value: unknown) => `${(value as number).toFixed(1)}%`,
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
		/>
	</div>
</template>
