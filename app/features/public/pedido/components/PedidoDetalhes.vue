<script setup lang="ts">
/**
 * 📌 PedidoDetalhes
 *
 * Componente para exibir detalhes do pedido.
 */

import type { PedidoCompleto } from "~/features/public/pedido/types/pedido";
import { usePedido } from "~/features/public/pedido/composables/usePedido";
import { formatDateTime } from "~/lib/formatters/date";
import { formatPhone } from "~/lib/formatters/phone";
import { formatCEP } from "~/lib/formatters/cep";

interface Props {
	pedido: PedidoCompleto;
}

const props = defineProps<Props>();

const { formatarFormaPagamento, formatarTipoEntrega } = usePedido();
</script>

<template>
	<div class="space-y-6">
		<!-- Informações do Pedido -->
		<div
			class="p-4 rounded-2xl bg-[var(--cardapio-secondary)] border border-[var(--cardapio-border)] shadow-[var(--cardapio-card-shadow)]"
		>
			<h3 class="font-bold text-[var(--cardapio-text)] mb-3 flex items-center gap-2">
				<Icon name="lucide:receipt" class="w-5 h-5" />
				Informações do Pedido
			</h3>
			<div class="space-y-2 text-sm">
				<div class="flex justify-between">
					<span class="text-[var(--cardapio-text-muted)]">Número do Pedido:</span>
					<span class="font-bold text-[var(--cardapio-text)]">#{{ pedido.numero }}</span>
				</div>
				<div class="flex justify-between">
					<span class="text-[var(--cardapio-text-muted)]">Data:</span>
					<span class="text-[var(--cardapio-text)]">{{ formatDateTime(pedido.created_at) }}</span>
				</div>
				<div class="flex justify-between">
					<span class="text-[var(--cardapio-text-muted)]">Tipo de Entrega:</span>
					<span class="text-[var(--cardapio-text)]">
						{{ formatarTipoEntrega(pedido.tipo_entrega) }}
					</span>
				</div>
				<div class="flex justify-between">
					<span class="text-[var(--cardapio-text-muted)]">Forma de Pagamento:</span>
					<span class="text-[var(--cardapio-text)]">
						{{ formatarFormaPagamento(pedido.forma_pagamento) }}
					</span>
				</div>
				<div v-if="pedido.troco_para" class="flex justify-between">
					<span class="text-[var(--cardapio-text-muted)]">Troco para:</span>
					<span class="text-[var(--cardapio-text)]">R$ {{ pedido.troco_para.toFixed(2) }}</span>
				</div>
			</div>
		</div>

		<!-- Dados do Cliente -->
		<div
			class="p-4 rounded-2xl bg-[var(--cardapio-secondary)] border border-[var(--cardapio-border)] shadow-[var(--cardapio-card-shadow)]"
		>
			<h3 class="font-bold text-[var(--cardapio-text)] mb-3 flex items-center gap-2">
				<Icon name="lucide:user" class="w-5 h-5" />
				Dados do Cliente
			</h3>
			<div class="space-y-2 text-sm">
				<div>
					<span class="text-[var(--cardapio-text-muted)]">Nome:</span>
					<span class="ml-2 text-[var(--cardapio-text)]">{{ pedido.cliente_nome }}</span>
				</div>
				<div>
					<span class="text-[var(--cardapio-text-muted)]">Telefone:</span>
					<span class="ml-2 text-[var(--cardapio-text)]">{{
						formatPhone(pedido.cliente_telefone)
					}}</span>
				</div>
				<div v-if="pedido.cliente_email">
					<span class="text-[var(--cardapio-text-muted)]">E-mail:</span>
					<span class="ml-2 text-[var(--cardapio-text)]">{{ pedido.cliente_email }}</span>
				</div>
			</div>
		</div>

		<!-- Endereço de Entrega -->
		<div
			v-if="pedido.tipo_entrega === 'delivery' && pedido.endereco_rua"
			class="p-4 rounded-2xl bg-[var(--cardapio-secondary)] border border-[var(--cardapio-border)] shadow-[var(--cardapio-card-shadow)]"
		>
			<h3 class="font-bold text-[var(--cardapio-text)] mb-3 flex items-center gap-2">
				<Icon name="lucide:map-pin" class="w-5 h-5" />
				Endereço de Entrega
			</h3>
			<div class="text-sm text-[var(--cardapio-text)]">
				<p>
					{{ pedido.endereco_rua }}, {{ pedido.endereco_numero }}
					<span v-if="pedido.endereco_complemento"> - {{ pedido.endereco_complemento }} </span>
				</p>
				<p>
					{{ pedido.endereco_bairro }} - {{ pedido.endereco_cidade }}/{{ pedido.endereco_estado }}
				</p>
				<p>CEP: {{ pedido.endereco_cep ? formatCEP(pedido.endereco_cep) : "Não informado" }}</p>
				<p v-if="pedido.endereco_referencia" class="mt-2 text-[var(--cardapio-text-muted)]">
					<strong>Referência:</strong> {{ pedido.endereco_referencia }}
				</p>
			</div>
		</div>

		<!-- Itens do Pedido -->
		<div
			class="p-4 rounded-2xl bg-[var(--cardapio-secondary)] border border-[var(--cardapio-border)] shadow-[var(--cardapio-card-shadow)]"
		>
			<h3 class="font-bold text-[var(--cardapio-text)] mb-3 flex items-center gap-2">
				<Icon name="lucide:shopping-bag" class="w-5 h-5" />
				Itens do Pedido
			</h3>
			<div class="space-y-3">
				<div
					v-for="item in pedido.itens"
					:key="item.id"
					class="flex justify-between text-sm pb-3 border-b border-[var(--cardapio-border)] last:border-0 last:pb-0"
				>
					<div class="flex-1">
						<p class="font-medium text-[var(--cardapio-text)]">
							{{ item.quantidade }}x {{ item.produto_nome }}
						</p>
						<p v-if="item.variacao_nome" class="text-xs text-[var(--cardapio-text-muted)]">
							{{ item.variacao_nome }}
						</p>
						<p v-if="item.adicionais.length" class="text-xs text-[var(--cardapio-text-muted)]">
							+ {{ item.adicionais.map((a) => `${a.quantidade}x ${a.adicional_nome}`).join(", ") }}
						</p>
						<p
							v-if="item.observacoes"
							class="text-xs text-[var(--cardapio-text-muted)] italic mt-1"
						>
							Obs: {{ item.observacoes }}
						</p>
					</div>
					<p class="font-bold text-[var(--cardapio-text)]">R$ {{ item.subtotal.toFixed(2) }}</p>
				</div>
			</div>
		</div>

		<!-- Observações -->
		<div
			v-if="pedido.observacoes"
			class="p-4 rounded-2xl bg-[var(--cardapio-secondary)] border border-[var(--cardapio-border)] shadow-[var(--cardapio-card-shadow)]"
		>
			<h3 class="font-bold text-[var(--cardapio-text)] mb-2 flex items-center gap-2">
				<Icon name="lucide:message-square" class="w-5 h-5" />
				Observações
			</h3>
			<p class="text-sm text-[var(--cardapio-text)]">{{ pedido.observacoes }}</p>
		</div>

		<!-- Totais -->
		<div
			class="p-4 rounded-2xl bg-[var(--cardapio-muted)] border border-[var(--cardapio-border)] shadow-[var(--cardapio-card-shadow)]"
		>
			<div class="space-y-2 text-sm">
				<div class="flex justify-between">
					<span class="text-[var(--cardapio-text-muted)]">Subtotal</span>
					<span class="font-medium text-[var(--cardapio-text)]">
						R$ {{ pedido.subtotal.toFixed(2) }}
					</span>
				</div>
				<div class="flex justify-between">
					<span class="text-[var(--cardapio-text-muted)]">Taxa de entrega</span>
					<span class="font-medium text-[var(--cardapio-text)]">
						R$ {{ pedido.taxa_entrega.toFixed(2) }}
					</span>
				</div>
				<div v-if="pedido.desconto > 0" class="flex justify-between text-green-600">
					<span>Desconto</span>
					<span class="font-medium">- R$ {{ pedido.desconto.toFixed(2) }}</span>
				</div>
				<div class="pt-2 border-t border-[var(--cardapio-border)] flex justify-between">
					<span class="font-bold text-[var(--cardapio-text)]">Total</span>
					<span class="font-bold text-lg text-[var(--cardapio-primary)]"
						>R$ {{ pedido.total.toFixed(2) }}</span
					>
				</div>
			</div>
		</div>
	</div>
</template>
