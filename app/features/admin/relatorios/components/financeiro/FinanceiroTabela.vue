<script setup lang="ts">
/**
 * 📋 FinanceiroTabela
 *
 * Tabela de transações financeiras.
 */

import type { TransacaoFinanceira } from "../../types/financeiro";
import { formatCurrency } from "~/lib/formatters/currency";
import { formatDateTime } from "~/lib/formatters/date";

interface Props {
	tabela?: readonly TransacaoFinanceira[];
	loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	tabela: undefined,
	loading: false,
});

// Colunas da tabela
const colunas = [
	{ key: "numero", label: "Número" },
	{ key: "data", label: "Data" },
	{ key: "descricao", label: "Descrição" },
	{ key: "forma_pagamento", label: "Forma Pagamento" },
	{ key: "valor_bruto", label: "Valor Bruto" },
	{ key: "desconto", label: "Desconto" },
	{ key: "taxa_entrega", label: "Taxa Entrega" },
	{ key: "valor_liquido", label: "Valor Líquido" },
	{ key: "status", label: "Status" },
];

// Formatar dados para tabela (converter readonly para mutável)
const dadosTabela = computed(() => {
	if (!props.tabela) return [];
	return props.tabela.map((transacao) => {
		// Criar objeto completamente novo (não readonly)
		const novaTransacao: Record<string, unknown> = {
			id: transacao.id,
			numero: transacao.numero,
			data: formatDateTime(transacao.data),
			tipo: transacao.tipo,
			descricao: transacao.descricao,
			forma_pagamento: transacao.forma_pagamento,
			valor_bruto: formatCurrency(transacao.valor_bruto),
			desconto: formatCurrency(transacao.desconto),
			taxa_entrega: formatCurrency(transacao.taxa_entrega),
			valor_liquido: formatCurrency(transacao.valor_liquido),
			status: transacao.status === "concluido" ? "Concluído" : transacao.status,
		};
		return novaTransacao;
	});
});
</script>

<template>
	<UiCard>
		<template #header>
			<div class="flex items-center gap-2">
				<Icon name="lucide:list" class="w-5 h-5 text-gray-500" />
				<h3 class="text-lg font-semibold">Transações</h3>
			</div>
		</template>

		<div v-if="loading">
			<UiSkeleton class="h-96 w-full" />
		</div>

		<div v-else-if="!tabela || tabela.length === 0" class="py-8">
			<UiEmptyState
				title="Nenhuma transação"
				description="Não há transações para o período selecionado."
				icon="lucide:list"
				size="sm"
			/>
		</div>

		<UiTable v-else :columns="colunas" :data="dadosTabela" />
	</UiCard>
</template>
