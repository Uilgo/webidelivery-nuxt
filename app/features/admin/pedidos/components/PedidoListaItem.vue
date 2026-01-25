<script setup lang="ts">
/**
 * 📌 PedidoListaItem
 *
 * Item de pedido para visualização em lista.
 */

import type { PedidoCompleto } from "~/features/admin/pedidos/types/pedidos-admin";
import {
	formatarStatus,
	formatarTipoEntrega,
	formatarFormaPagamento,
	formatarTempoDecorrido,
} from "~/features/admin/pedidos/utils/pedido-formatters";
import { formatarCodigoRastreamento } from "~/lib/formatters/codigo-rastreamento";

interface Props {
	pedido: PedidoCompleto;
}

interface Emits {
	click: [pedido: PedidoCompleto];
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

/**
 * Configuração visual do status
 */
const statusConfig = computed(() => {
	const configs = {
		pendente: {
			variant: "warning" as const,
			icon: "lucide:clock",
		},
		aceito: {
			variant: "info" as const,
			icon: "lucide:check-circle",
		},
		preparo: {
			variant: "warning" as const,
			icon: "lucide:chef-hat",
		},
		pronto: {
			variant: "primary" as const,
			icon: "lucide:package-check",
		},
		entrega: {
			variant: "info" as const,
			icon: "lucide:bike",
		},
		concluido: {
			variant: "success" as const,
			icon: "lucide:check-circle-2",
		},
		cancelado: {
			variant: "error" as const,
			icon: "lucide:x-circle",
		},
	};

	return configs[props.pedido.status];
});

/**
 * Tempo decorrido desde criação
 */
const tempoDecorrido = computed(() => {
	return formatarTempoDecorrido(props.pedido.created_at);
});

/**
 * Quantidade total de itens
 */
const totalItens = computed(() => {
	return props.pedido.itens.reduce((acc, item) => acc + item.quantidade, 0);
});

/**
 * Emitir clique no item
 */
const handleClick = () => {
	emit("click", props.pedido);
};
</script>

<template>
	<div
		class="flex items-center gap-4 p-4 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg hover:shadow-md hover:border-[var(--border-strong)] transition-all duration-200 cursor-pointer"
		@click="handleClick"
	>
		<!-- Número -->
		<div class="flex-shrink-0 w-20">
			<div class="flex flex-col gap-0.5">
				<span class="text-lg font-bold text-[var(--text-primary)]">#{{ pedido.numero }}</span>
				<span class="text-xs text-[var(--text-muted)] font-mono">
					{{ formatarCodigoRastreamento(pedido.codigo_rastreamento) }}
				</span>
			</div>
		</div>

		<!-- Cliente com Badge -->
		<div class="flex items-center gap-3 flex-shrink-0">
			<div>
				<p class="text-sm font-medium text-[var(--text-primary)] truncate">
					{{ pedido.cliente_nome }}
				</p>
				<p class="text-xs text-[var(--text-muted)]">{{ pedido.cliente_telefone }}</p>
			</div>
			<UiBadge :variant="statusConfig.variant" size="sm">
				<template #iconLeft>
					<Icon :name="statusConfig.icon" class="w-3 h-3" />
				</template>
				{{ formatarStatus(pedido.status) }}
			</UiBadge>
		</div>

		<!-- Spacer -->
		<div class="flex-1"></div>

		<!-- Informações -->
		<div class="hidden md:flex items-center gap-4 flex-shrink-0">
			<!-- Tipo de Entrega -->
			<div class="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
				<Icon
					:name="pedido.tipo_entrega === 'delivery' ? 'lucide:bike' : 'lucide:store'"
					class="w-4 h-4"
				/>
				<span>{{ formatarTipoEntrega(pedido.tipo_entrega) }}</span>
			</div>

			<!-- Forma de Pagamento -->
			<div class="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
				<Icon name="lucide:credit-card" class="w-4 h-4" />
				<span>{{ formatarFormaPagamento(pedido.forma_pagamento) }}</span>
			</div>

			<!-- Itens -->
			<div class="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
				<Icon name="lucide:shopping-bag" class="w-4 h-4" />
				<span>{{ totalItens }}</span>
			</div>
		</div>

		<!-- Total e Tempo -->
		<div class="flex-shrink-0 w-32 text-right">
			<p class="text-lg font-bold text-[var(--text-primary)]">
				{{ $formatCurrency(pedido.total) }}
			</p>
			<p class="text-xs text-[var(--text-muted)]">{{ tempoDecorrido }}</p>
		</div>

		<!-- Botão Ver Detalhes -->
		<div class="flex-shrink-0">
			<UiButton color="primary" variant="solid" size="sm" @click.stop="handleClick">
				Ver Detalhes
			</UiButton>
		</div>
	</div>
</template>
