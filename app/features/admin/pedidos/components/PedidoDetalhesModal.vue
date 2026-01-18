<script setup lang="ts">
/**
 * 📌 PedidoDetalhesModal
 *
 * Modal com detalhes completos do pedido usando UiModal.
 */

import type { PedidoCompleto } from "~/features/admin/pedidos/types/pedidos-admin";
import {
	formatarStatus,
	formatarTipoEntrega,
	formatarFormaPagamento,
	formatarTempoDecorrido,
	formatarDataHora,
} from "~/features/admin/pedidos/utils/pedido-formatters";

interface Props {
	modelValue: boolean;
	pedido: PedidoCompleto | null;
}

interface Emits {
	"update:modelValue": [value: boolean];
	acao: [pedido: PedidoCompleto, acao: string];
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

/**
 * Configuração visual do status
 */
const statusConfig = computed(() => {
	if (!props.pedido) return null;

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
 * Ações disponíveis por status
 */
const acoesDisponiveis = computed(() => {
	if (!props.pedido) return [];

	const acoes = {
		pendente: [
			{ label: "Aceitar Pedido", acao: "aceitar", color: "success" as const },
			{ label: "Cancelar", acao: "cancelar", color: "error" as const },
		],
		aceito: [
			{ label: "Iniciar Preparo", acao: "preparo", color: "primary" as const },
			{ label: "Cancelar", acao: "cancelar", color: "error" as const },
		],
		preparo: [{ label: "Marcar como Pronto", acao: "pronto", color: "primary" as const }],
		pronto: [
			{
				label: props.pedido.tipo_entrega === "delivery" ? "Saiu para Entrega" : "Concluir Pedido",
				acao: props.pedido.tipo_entrega === "delivery" ? "entrega" : "concluir",
				color: "success" as const,
			},
		],
		entrega: [{ label: "Marcar como Entregue", acao: "concluir", color: "success" as const }],
		concluido: [],
		cancelado: [],
	};

	return acoes[props.pedido.status] || [];
});

/**
 * Tempo decorrido desde criação
 */
const tempoDecorrido = computed(() => {
	if (!props.pedido) return "";
	return formatarTempoDecorrido(props.pedido.created_at);
});

/**
 * Emitir ação
 */
const handleAcao = (acao: string) => {
	if (!props.pedido) return;
	emit("acao", props.pedido, acao);
};
</script>

<template>
	<UiModal
		:model-value="modelValue"
		:title="`Pedido #${pedido?.numero || ''}`"
		size="lg"
		scrollable
		@update:model-value="emit('update:modelValue', $event)"
	>
		<div v-if="pedido" class="space-y-6">
			<!-- Status e Tempo -->
			<div class="flex items-center justify-between">
				<UiBadge v-if="statusConfig" :variant="statusConfig.variant" size="lg">
					<template #iconLeft>
						<Icon :name="statusConfig.icon" class="w-4 h-4" />
					</template>
					{{ formatarStatus(pedido.status) }}
				</UiBadge>
				<div class="text-right">
					<p class="text-sm text-[var(--text-muted)]">{{ tempoDecorrido }}</p>
					<p class="text-xs text-[var(--text-muted)]">
						{{ formatarDataHora(pedido.created_at) }}
					</p>
				</div>
			</div>

			<!-- Cliente -->
			<UiCard variant="outlined" size="sm">
				<div class="space-y-2">
					<div class="flex items-center gap-2 text-[var(--text-primary)]">
						<Icon name="lucide:user" class="w-5 h-5" />
						<span class="font-semibold">Cliente</span>
					</div>
					<div class="pl-7 space-y-1">
						<p class="text-base font-medium">{{ pedido.cliente_nome }}</p>
						<p class="text-sm text-[var(--text-muted)]">
							<Icon name="lucide:phone" class="w-4 h-4 inline mr-1" />
							{{ pedido.cliente_telefone }}
						</p>
						<p v-if="pedido.cliente_email" class="text-sm text-[var(--text-muted)]">
							<Icon name="lucide:mail" class="w-4 h-4 inline mr-1" />
							{{ pedido.cliente_email }}
						</p>
					</div>
				</div>
			</UiCard>

			<!-- Entrega -->
			<UiCard variant="outlined" size="sm">
				<div class="space-y-2">
					<div class="flex items-center gap-2 text-[var(--text-primary)]">
						<Icon
							:name="pedido.tipo_entrega === 'delivery' ? 'lucide:bike' : 'lucide:store'"
							class="w-5 h-5"
						/>
						<span class="font-semibold">{{ formatarTipoEntrega(pedido.tipo_entrega) }}</span>
					</div>
					<div
						v-if="pedido.tipo_entrega === 'delivery' && pedido.endereco_rua"
						class="pl-7 space-y-1"
					>
						<p class="text-sm">{{ pedido.endereco_rua }}, {{ pedido.endereco_numero }}</p>
						<p v-if="pedido.endereco_complemento" class="text-sm">
							{{ pedido.endereco_complemento }}
						</p>
						<p class="text-sm">
							{{ pedido.endereco_bairro }} - {{ pedido.endereco_cidade }}/{{
								pedido.endereco_estado
							}}
						</p>
						<p class="text-sm">CEP: {{ pedido.endereco_cep }}</p>
						<p v-if="pedido.endereco_referencia" class="text-sm text-[var(--text-muted)]">
							Ref: {{ pedido.endereco_referencia }}
						</p>
					</div>
					<div v-else class="pl-7">
						<p class="text-sm text-[var(--text-muted)]">Cliente retirará no local</p>
					</div>
				</div>
			</UiCard>

			<!-- Itens -->
			<UiCard variant="outlined" size="sm">
				<div class="space-y-3">
					<div class="flex items-center gap-2 text-[var(--text-primary)]">
						<Icon name="lucide:shopping-bag" class="w-5 h-5" />
						<span class="font-semibold">Itens ({{ pedido.itens.length }})</span>
					</div>
					<div class="pl-7 space-y-4">
						<div
							v-for="item in pedido.itens"
							:key="item.id"
							class="pb-3 border-b border-[var(--border-muted)] last:border-0 last:pb-0"
						>
							<div class="flex items-start justify-between gap-2">
								<div class="flex-1">
									<p class="text-sm font-medium">
										{{ item.quantidade }}x {{ item.produto_nome }}
										<span v-if="item.variacao_nome" class="text-[var(--text-muted)]">
											({{ item.variacao_nome }})
										</span>
									</p>
									<!-- Adicionais -->
									<div
										v-if="item.adicionais && item.adicionais.length > 0"
										class="mt-1 space-y-0.5"
									>
										<p
											v-for="adicional in item.adicionais"
											:key="adicional.id"
											class="text-xs text-[var(--text-muted)] pl-4"
										>
											+ {{ adicional.adicional_nome }}
										</p>
									</div>
									<!-- Observações -->
									<p v-if="item.observacoes" class="text-xs text-[var(--text-muted)] mt-1 italic">
										Obs: {{ item.observacoes }}
									</p>
								</div>
								<span class="text-sm font-medium text-[var(--text-primary)]">
									{{ $formatCurrency(item.subtotal) }}
								</span>
							</div>
						</div>
					</div>
				</div>
			</UiCard>

			<!-- Pagamento -->
			<UiCard variant="outlined" size="sm">
				<div class="space-y-3">
					<div class="flex items-center gap-2 text-[var(--text-primary)]">
						<Icon name="lucide:credit-card" class="w-5 h-5" />
						<span class="font-semibold">Pagamento</span>
					</div>
					<div class="pl-7 space-y-2">
						<div class="flex items-center justify-between text-sm">
							<span class="text-[var(--text-muted)]">Forma:</span>
							<span class="font-medium">{{ formatarFormaPagamento(pedido.forma_pagamento) }}</span>
						</div>
						<div
							v-if="pedido.forma_pagamento === 'dinheiro' && pedido.troco_para"
							class="flex items-center justify-between text-sm"
						>
							<span class="text-[var(--text-muted)]">Troco para:</span>
							<span class="font-medium">{{ $formatCurrency(pedido.troco_para) }}</span>
						</div>
						<div class="pt-2 border-t border-[var(--border-muted)] space-y-1">
							<div class="flex items-center justify-between text-sm">
								<span class="text-[var(--text-muted)]">Subtotal:</span>
								<span>{{ $formatCurrency(pedido.subtotal) }}</span>
							</div>
							<div class="flex items-center justify-between text-sm">
								<span class="text-[var(--text-muted)]">Taxa de entrega:</span>
								<span>{{ $formatCurrency(pedido.taxa_entrega) }}</span>
							</div>
							<div v-if="pedido.desconto > 0" class="flex items-center justify-between text-sm">
								<span class="text-[var(--text-muted)]">Desconto:</span>
								<span class="text-[var(--success)]">-{{ $formatCurrency(pedido.desconto) }}</span>
							</div>
							<div class="flex items-center justify-between text-lg font-bold pt-2">
								<span>Total:</span>
								<span class="text-[var(--primary)]">{{ $formatCurrency(pedido.total) }}</span>
							</div>
						</div>
					</div>
				</div>
			</UiCard>

			<!-- Observações Gerais -->
			<UiCard v-if="pedido.observacoes" variant="outlined" size="sm">
				<div class="space-y-2">
					<div class="flex items-center gap-2 text-[var(--text-primary)]">
						<Icon name="lucide:message-square" class="w-5 h-5" />
						<span class="font-semibold">Observações</span>
					</div>
					<p class="pl-7 text-sm text-[var(--text-muted)]">{{ pedido.observacoes }}</p>
				</div>
			</UiCard>

			<!-- Motivo Cancelamento -->
			<UiCard
				v-if="pedido.status === 'cancelado' && pedido.motivo_cancelamento"
				variant="outlined"
				size="sm"
			>
				<div class="space-y-2">
					<div class="flex items-center gap-2 text-[var(--error)]">
						<Icon name="lucide:alert-circle" class="w-5 h-5" />
						<span class="font-semibold">Motivo do Cancelamento</span>
					</div>
					<p class="pl-7 text-sm text-[var(--text-muted)]">{{ pedido.motivo_cancelamento }}</p>
				</div>
			</UiCard>
		</div>

		<!-- Footer com Ações -->
		<template v-if="acoesDisponiveis.length > 0" #footer>
			<div class="flex items-center justify-end gap-3">
				<UiButton
					v-for="acao in acoesDisponiveis"
					:key="acao.acao"
					:color="acao.color"
					variant="solid"
					size="md"
					@click="handleAcao(acao.acao)"
				>
					{{ acao.label }}
				</UiButton>
			</div>
		</template>
	</UiModal>
</template>
