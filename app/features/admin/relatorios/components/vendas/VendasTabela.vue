<script setup lang="ts">
/**
 * 📋 VendasTabela
 *
 * Tabela detalhada de vendas do relatório:
 * - Lista todas as vendas do período
 * - Formatação de valores e datas
 * - Paginação e busca integradas
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
	},
	{
		key: "data",
		label: "Data",
		sortable: true,
		align: "left" as const,
		format: (value: unknown) => formatDateTime(value as string),
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
	},
	{
		key: "desconto",
		label: "Desconto",
		sortable: true,
		align: "right" as const,
		format: (value: unknown) => formatCurrency(value as number),
	},
	{
		key: "taxa_entrega",
		label: "Taxa Entrega",
		sortable: true,
		align: "right" as const,
		format: (value: unknown) => formatCurrency(value as number),
	},
	{
		key: "total",
		label: "Total",
		sortable: true,
		align: "right" as const,
		format: (value: unknown) => formatCurrency(value as number),
	},
	{
		key: "forma_pagamento",
		label: "Pagamento",
		sortable: true,
		align: "center" as const,
	},
];
</script>

<template>
	<div class="vendas-tabela">
		<TabelaRelatorio
			:dados="(dados ? [...dados] : []) as unknown as Record<string, unknown>[]"
			:colunas="colunas"
			:loading="loading"
			:busca="true"
			busca-placeholder="Buscar por número, cliente..."
			:paginacao="true"
			:itens-por-pagina="10"
			:opcoes-itens-por-pagina="[10, 25, 50, 100]"
			empty-text="Nenhuma venda encontrada no período"
			empty-icon="lucide:dollar-sign"
		/>
	</div>
</template>
