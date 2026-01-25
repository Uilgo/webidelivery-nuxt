<script setup lang="ts">
/**
 * 📋 PedidosTabela
 *
 * Tabela detalhada de pedidos do relatório:
 * - Lista todos os pedidos do período
 * - Formatação de valores e datas
 * - Badges de status
 * - Paginação e busca integradas
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
	},
	{
		key: "data",
		label: "Data",
		sortable: true,
		align: "left" as const,
		format: (value: unknown) => formatDateTime(value as string),
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
	},
	{
		key: "status",
		label: "Status",
		sortable: true,
		align: "center" as const,
	},
	{
		key: "tipo_entrega",
		label: "Tipo",
		sortable: true,
		align: "center" as const,
	},
	{
		key: "tempo_preparo",
		label: "Tempo Preparo",
		sortable: true,
		align: "right" as const,
		format: (value: unknown) => formatDuration(value as number),
	},
	{
		key: "tempo_entrega",
		label: "Tempo Entrega",
		sortable: true,
		align: "right" as const,
		format: (value: unknown) => (value ? formatDuration(value as number) : "-"),
	},
];

// Mapear status para badges
const statusConfig: Record<
	string,
	{
		label: string;
		variant: "default" | "primary" | "success" | "warning" | "error" | "info" | "outline";
	}
> = {
	pendente: { label: "Pendente", variant: "warning" },
	aceito: { label: "Aceito", variant: "info" },
	preparo: { label: "Em Preparo", variant: "primary" },
	pronto: { label: "Pronto", variant: "success" },
	entrega: { label: "Em Entrega", variant: "warning" },
	concluido: { label: "Concluído", variant: "success" },
	cancelado: { label: "Cancelado", variant: "error" },
};

// Mapear tipo de entrega para badges
const tipoEntregaConfig: Record<
	string,
	{
		label: string;
		variant: "default" | "primary" | "success" | "warning" | "error" | "info" | "outline";
	}
> = {
	delivery: { label: "Delivery", variant: "info" },
	retirada: { label: "Retirada", variant: "outline" },
};
</script>

<template>
	<div class="pedidos-tabela">
		<TabelaRelatorio
			:dados="(dados ? [...dados] : []) as unknown as Record<string, unknown>[]"
			:colunas="colunas"
			:loading="loading"
			:busca="true"
			busca-placeholder="Buscar por código, cliente..."
			:paginacao="true"
			:itens-por-pagina="10"
			:opcoes-itens-por-pagina="[10, 25, 50, 100]"
			empty-text="Nenhum pedido encontrado no período"
			empty-icon="lucide:shopping-bag"
		>
			<!-- Slot customizado para status -->
			<template #cell-status="{ value }">
				<UiBadge :variant="statusConfig[value as string]?.variant || 'default'" size="sm">
					{{ statusConfig[value as string]?.label || value }}
				</UiBadge>
			</template>

			<!-- Slot customizado para tipo de entrega -->
			<template #cell-tipo_entrega="{ value }">
				<UiBadge :variant="tipoEntregaConfig[value as string]?.variant || 'default'" size="sm">
					{{ tipoEntregaConfig[value as string]?.label || value }}
				</UiBadge>
			</template>
		</TabelaRelatorio>
	</div>
</template>
