<script setup lang="ts">
/**
 * 📌 PedidoInfoCard
 *
 * Card com informações básicas do pedido (Tailwind + Design System Adaptativo).
 */

import type { PedidoCompleto } from "~/features/public/pedido/types/pedido";
import { formatDateTime } from "~/lib/formatters/date";
import { usePedido } from "~/features/public/pedido/composables/usePedido";

interface Props {
	pedido: PedidoCompleto;
}

const props = defineProps<Props>();

const { formatarFormaPagamento, formatarTipoEntrega } = usePedido();
</script>

<template>
	<div
		class="grid grid-cols-1 sm:grid-cols-2 gap-4 p-6 bg-[var(--cardapio-secondary)] rounded-2xl shadow-[var(--cardapio-card-shadow)]"
	>
		<!-- Número do Pedido -->
		<div class="flex flex-col gap-1">
			<span class="text-xs font-semibold text-[var(--cardapio-text-muted)] uppercase tracking-wide">
				Número do Pedido
			</span>
			<span class="text-lg font-bold text-[var(--cardapio-primary)]"> #{{ pedido.numero }} </span>
		</div>

		<!-- Data -->
		<div class="flex flex-col gap-1">
			<span class="text-xs font-semibold text-[var(--cardapio-text-muted)] uppercase tracking-wide">
				Data
			</span>
			<span class="text-sm font-semibold text-[var(--cardapio-text)]">
				{{ formatDateTime(pedido.created_at) }}
			</span>
		</div>

		<!-- Tipo de Entrega -->
		<div class="flex flex-col gap-1">
			<span class="text-xs font-semibold text-[var(--cardapio-text-muted)] uppercase tracking-wide">
				Tipo de Entrega
			</span>
			<span class="text-sm font-semibold text-[var(--cardapio-text)] flex items-center gap-2">
				<Icon name="lucide:bike" class="w-4 h-4 text-[var(--cardapio-primary)]" />
				{{ formatarTipoEntrega(pedido.tipo_entrega) }}
			</span>
		</div>

		<!-- Forma de Pagamento -->
		<div class="flex flex-col gap-1">
			<span class="text-xs font-semibold text-[var(--cardapio-text-muted)] uppercase tracking-wide">
				Forma de Pagamento
			</span>
			<span class="text-sm font-semibold text-[var(--cardapio-primary)] flex items-center gap-2">
				<Icon name="lucide:credit-card" class="w-4 h-4" />
				{{ formatarFormaPagamento(pedido.forma_pagamento) }}
			</span>
		</div>
	</div>
</template>
