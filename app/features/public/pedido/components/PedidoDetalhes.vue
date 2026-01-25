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
		<div class="p-4 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-color)]">
			<h3 class="font-bold text-[var(--text-primary)] mb-3 flex items-center gap-2">
				<Icon name="lucide:receipt" class="w-5 h-5" />
				Informações do Pedido
			</h3>
			<div class="space-y-2 text-sm">
				<div class="flex justify-between">
					<span class="text-[var(--text-muted)]">Número do Pedido:</span>
					<span class="font-bold text-[var(--text-primary)]">#{{ pedido.numero }}</span>
				</div>
				<div class="flex justify-between">
					<span class="text-[var(--text-muted)]">Data:</span>
					<span class="text-[var(--text-primary)]">{{ formatDateTime(pedido.created_at) }}</span>
				</div>
				<div class="flex justify-between">
					<span class="text-[var(--text-muted)]">Tipo de Entrega:</span>
					<span class="text-[var(--text-primary)]">
						{{ formatarTipoEntrega(pedido.tipo_entrega) }}
					</span>
				</div>
				<div class="flex justify-between">
					<span class="text-[var(--text-muted)]">Forma de Pagamento:</span>
					<span class="text-[var(--text-primary)]">
						{{ formatarFormaPagamento(pedido.forma_pagamento) }}
					</span>
				</div>
				<div v-if="pedido.troco_para" class="flex justify-between">
					<span class="text-[var(--text-muted)]">Troco para:</span>
					<span class="text-[var(--text-primary)]">R$ {{ pedido.troco_para.toFixed(2) }}</span>
				</div>
			</div>
		</div>

		<!-- Dados do Cliente -->
		<div class="p-4 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-color)]">
			<h3 class="font-bold text-[var(--text-primary)] mb-3 flex items-center gap-2">
				<Icon name="lucide:user" class="w-5 h-5" />
				Dados do Cliente
			</h3>
			<div class="space-y-2 text-sm">
				<div>
					<span class="text-[var(--text-muted)]">Nome:</span>
					<span class="ml-2 text-[var(--text-primary)]">{{ pedido.cliente_nome }}</span>
				</div>
				<div>
					<span class="text-[var(--text-muted)]">Telefone:</span>
					<span class="ml-2 text-[var(--text-primary)]">{{
						formatPhone(pedido.cliente_telefone)
					}}</span>
				</div>
				<div v-if="pedido.cliente_email">
					<span class="text-[var(--text-muted)]">E-mail:</span>
					<span class="ml-2 text-[var(--text-primary)]">{{ pedido.cliente_email }}</span>
				</div>
			</div>
		</div>

		<!-- Endereço de Entrega -->
		<div
			v-if="pedido.tipo_entrega === 'delivery' && pedido.endereco_rua"
			class="p-4 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-color)]"
		>
			<h3 class="font-bold text-[var(--text-primary)] mb-3 flex items-center gap-2">
				<Icon name="lucide:map-pin" class="w-5 h-5" />
				Endereço de Entrega
			</h3>
			<div class="text-sm text-[var(--text-primary)]">
				<p>
					{{ pedido.endereco_rua }}, {{ pedido.endereco_numero }}
					<span v-if="pedido.endereco_complemento"> - {{ pedido.endereco_complemento }} </span>
				</p>
				<p>
					{{ pedido.endereco_bairro }} - {{ pedido.endereco_cidade }}/{{ pedido.endereco_estado }}
				</p>
				<p>CEP: {{ pedido.endereco_cep ? formatCEP(pedido.endereco_cep) : "Não informado" }}</p>
				<p v-if="pedido.endereco_referencia" class="mt-2 text-[var(--text-muted)]">
					<strong>Referência:</strong> {{ pedido.endereco_referencia }}
				</p>
			</div>
		</div>

		<!-- Itens do Pedido -->
		<div class="p-4 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-color)]">
			<h3 class="font-bold text-[var(--text-primary)] mb-3 flex items-center gap-2">
				<Icon name="lucide:shopping-bag" class="w-5 h-5" />
				Itens do Pedido
			</h3>
			<div class="space-y-3">
				<div
					v-for="item in pedido.itens"
					:key="item.id"
					class="flex justify-between text-sm pb-3 border-b border-[var(--border-color)] last:border-0 last:pb-0"
				>
					<div class="flex-1">
						<p class="font-medium text-[var(--text-primary)]">
							{{ item.quantidade }}x {{ item.produto_nome }}
						</p>
						<p v-if="item.variacao_nome" class="text-xs text-[var(--text-muted)]">
							{{ item.variacao_nome }}
						</p>
						<p v-if="item.adicionais.length" class="text-xs text-[var(--text-muted)]">
							+ {{ item.adicionais.map((a) => `${a.quantidade}x ${a.adicional_nome}`).join(", ") }}
						</p>
						<p v-if="item.observacoes" class="text-xs text-[var(--text-muted)] italic mt-1">
							Obs: {{ item.observacoes }}
						</p>
					</div>
					<p class="font-bold text-[var(--text-primary)]">R$ {{ item.subtotal.toFixed(2) }}</p>
				</div>
			</div>
		</div>

		<!-- Observações -->
		<div
			v-if="pedido.observacoes"
			class="p-4 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-color)]"
		>
			<h3 class="font-bold text-[var(--text-primary)] mb-2 flex items-center gap-2">
				<Icon name="lucide:message-square" class="w-5 h-5" />
				Observações
			</h3>
			<p class="text-sm text-[var(--text-primary)]">{{ pedido.observacoes }}</p>
		</div>

		<!-- Totais -->
		<div class="p-4 rounded-lg bg-[var(--bg-muted)] border border-[var(--border-color)]">
			<div class="space-y-2 text-sm">
				<div class="flex justify-between">
					<span class="text-[var(--text-muted)]">Subtotal</span>
					<span class="font-medium text-[var(--text-primary)]">
						R$ {{ pedido.subtotal.toFixed(2) }}
					</span>
				</div>
				<div class="flex justify-between">
					<span class="text-[var(--text-muted)]">Taxa de entrega</span>
					<span class="font-medium text-[var(--text-primary)]">
						R$ {{ pedido.taxa_entrega.toFixed(2) }}
					</span>
				</div>
				<div v-if="pedido.desconto > 0" class="flex justify-between text-green-600">
					<span>Desconto</span>
					<span class="font-medium">- R$ {{ pedido.desconto.toFixed(2) }}</span>
				</div>
				<div class="pt-2 border-t border-[var(--border-color)] flex justify-between">
					<span class="font-bold text-[var(--text-primary)]">Total</span>
					<span class="font-bold text-lg text-primary">R$ {{ pedido.total.toFixed(2) }}</span>
				</div>
			</div>
		</div>
	</div>
</template>
