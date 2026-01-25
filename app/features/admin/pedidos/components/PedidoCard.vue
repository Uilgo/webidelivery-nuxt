<script setup lang="ts">
/**
 * 📌 PedidoCard
 *
 * Card de pedido para visualização em grid usando UiCard.
 * Versão simplificada com apenas botão "Ver Mais".
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
 * Emitir clique no card
 */
const handleClick = () => {
	emit("click", props.pedido);
};
</script>

<template>
	<UiCard variant="outlined" size="sm" clickable class="w-full" @click="handleClick">
		<!-- Header -->
		<template #header>
			<div class="flex flex-col gap-1.5">
				<div class="flex items-center justify-between">
					<span class="text-lg font-bold text-[var(--text-primary)]">#{{ pedido.numero }}</span>
					<UiBadge :variant="statusConfig.variant" size="sm">
						<template #iconLeft>
							<Icon :name="statusConfig.icon" class="w-3 h-3" />
						</template>
						{{ formatarStatus(pedido.status) }}
					</UiBadge>
				</div>
				<!-- Código de Rastreamento -->
				<div class="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
					<Icon name="lucide:hash" class="w-3.5 h-3.5" />
					<span class="font-mono">{{
						formatarCodigoRastreamento(pedido.codigo_rastreamento)
					}}</span>
				</div>
			</div>
		</template>

		<!-- Conteúdo -->
		<div class="space-y-2">
			<!-- Cliente -->
			<div>
				<p class="text-sm font-medium text-[var(--text-primary)]">
					{{ pedido.cliente_nome }}
				</p>
				<p class="text-xs text-[var(--text-muted)]">{{ pedido.cliente_telefone }}</p>
			</div>

			<!-- Informações -->
			<div class="flex items-center gap-3 text-xs">
				<!-- Tipo de Entrega -->
				<div class="flex items-center gap-1 text-[var(--text-secondary)]">
					<Icon
						:name="pedido.tipo_entrega === 'delivery' ? 'lucide:bike' : 'lucide:store'"
						class="w-3.5 h-3.5"
					/>
					<span>{{ formatarTipoEntrega(pedido.tipo_entrega) }}</span>
				</div>

				<!-- Forma de Pagamento -->
				<div class="flex items-center gap-1 text-[var(--text-secondary)]">
					<Icon name="lucide:credit-card" class="w-3.5 h-3.5" />
					<span>{{ formatarFormaPagamento(pedido.forma_pagamento) }}</span>
				</div>
			</div>

			<!-- Itens -->
			<div class="flex items-center gap-1 text-xs text-[var(--text-muted)]">
				<Icon name="lucide:shopping-bag" class="w-3.5 h-3.5" />
				<span>{{ totalItens }} {{ totalItens === 1 ? "item" : "itens" }}</span>
			</div>

			<!-- Tempo Decorrido e Total na mesma linha -->
			<div class="pt-2 border-t border-[var(--border-muted)]">
				<div class="flex items-center justify-between">
					<span class="text-xs text-[var(--text-muted)]">{{ tempoDecorrido }}</span>
					<span class="text-base font-bold text-[var(--text-primary)]">
						{{ $formatCurrency(pedido.total) }}
					</span>
				</div>
			</div>
		</div>

		<!-- Footer com Ações -->
		<template #footer>
			<UiButton variant="solid" color="primary" size="sm" full-width @click.stop="handleClick">
				Ver Mais
			</UiButton>
		</template>
	</UiCard>
</template>
