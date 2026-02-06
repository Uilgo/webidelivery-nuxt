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
import { useToast } from "~/composables/ui/useToast";
import { useEstabelecimentoStore } from "~/stores/estabelecimento";

interface Props {
	pedido: PedidoCompleto;
}

interface Emits {
	click: [pedido: PedidoCompleto];
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

/**
 * Composables
 */
const toast = useToast();
const estabelecimentoStore = useEstabelecimentoStore();

/**
 * Copiar link da página de rastreamento do pedido
 */
const copiarLinkRastreamento = async (event: Event) => {
	event.stopPropagation(); // Evita abrir o drawer

	const estabelecimento = estabelecimentoStore.estabelecimento;
	if (!estabelecimento?.slug) {
		toast.add({
			title: "Erro",
			description: "Não foi possível obter o slug do estabelecimento",
			color: "error",
		});
		return;
	}

	// Gerar URL completa da página de rastreamento
	const baseUrl = window.location.origin;
	const linkRastreamento = `${baseUrl}/${estabelecimento.slug}/pedido/${props.pedido.codigo_rastreamento}`;

	try {
		await navigator.clipboard.writeText(linkRastreamento);
		toast.add({
			title: "Link copiado!",
			description: "O link de rastreamento foi copiado para a área de transferência",
			color: "success",
			duration: 3000,
		});
	} catch {
		toast.add({
			title: "Erro ao copiar",
			description: "Não foi possível copiar o link",
			color: "error",
		});
	}
};

/**
 * Abrir página de rastreamento em nova aba
 */
const abrirPaginaRastreamento = (event: Event) => {
	event.stopPropagation(); // Evita abrir o drawer

	const estabelecimento = estabelecimentoStore.estabelecimento;
	if (!estabelecimento?.slug) return;

	const baseUrl = window.location.origin;
	const linkRastreamento = `${baseUrl}/${estabelecimento.slug}/pedido/${props.pedido.codigo_rastreamento}`;

	window.open(linkRastreamento, "_blank");
};

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
				<div class="flex items-center gap-1">
					<span class="text-xs text-[var(--text-muted)] font-mono">
						{{ formatarCodigoRastreamento(pedido.codigo_rastreamento) }}
					</span>
					<!-- Botões de Ação -->
					<div class="flex items-center gap-0.5">
						<button
							type="button"
							class="p-0.5 rounded hover:bg-[var(--bg-muted)] transition-colors"
							title="Copiar link de rastreamento"
							@click="copiarLinkRastreamento"
						>
							<Icon
								name="lucide:copy"
								class="w-2.5 h-2.5 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
							/>
						</button>
						<button
							type="button"
							class="p-0.5 rounded hover:bg-[var(--bg-muted)] transition-colors"
							title="Abrir página de rastreamento"
							@click="abrirPaginaRastreamento"
						>
							<Icon
								name="lucide:external-link"
								class="w-2.5 h-2.5 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
							/>
						</button>
					</div>
				</div>
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
