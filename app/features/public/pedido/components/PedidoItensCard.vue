<script setup lang="ts">
/**
 * 📌 PedidoItensCard
 *
 * Card com itens do pedido e resumo de valores (Tailwind + Design System Adaptativo).
 */

import type { PedidoCompleto } from "~/features/public/pedido/types/pedido";

interface Props {
	pedido: PedidoCompleto;
}

const props = defineProps<Props>();
</script>

<template>
	<div class="space-y-6">
		<!-- Lista de Itens -->
		<div class="flex flex-col gap-3">
			<div
				v-for="item in pedido.itens"
				:key="item.id"
				class="flex gap-4 p-4 bg-[var(--cardapio-secondary)] rounded-2xl shadow-[var(--cardapio-card-shadow)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--cardapio-card-shadow-hover)]"
			>
				<!-- Ícone do Item -->
				<div
					class="w-16 h-16 rounded-xl bg-gradient-to-br from-[#ef4444] to-[#dc2626] flex items-center justify-center flex-shrink-0 text-white"
				>
					<Icon name="lucide:utensils" class="w-8 h-8" />
				</div>

				<!-- Detalhes do Item -->
				<div class="flex-1 min-w-0 flex flex-col justify-center">
					<div class="flex items-start justify-between gap-2 mb-1">
						<h4 class="text-base font-semibold text-[var(--cardapio-text)]">
							{{ item.quantidade }}x {{ item.produto_nome }}
						</h4>
						<span class="text-base font-bold text-[var(--cardapio-primary)] flex-shrink-0">
							R$ {{ item.subtotal.toFixed(2) }}
						</span>
					</div>
					<p v-if="item.variacao_nome" class="text-sm text-[var(--cardapio-text-muted)]">
						{{ item.variacao_nome }}
					</p>
					<p v-if="item.adicionais.length" class="text-xs text-[var(--cardapio-text-muted)] mt-1">
						+ {{ item.adicionais.map((a) => `${a.quantidade}x ${a.adicional_nome}`).join(", ") }}
					</p>
					<p v-if="item.observacoes" class="text-xs text-[var(--cardapio-text-muted)] italic mt-1">
						Obs: {{ item.observacoes }}
					</p>
				</div>
			</div>
		</div>

		<!-- Resumo de Valores -->
		<div class="p-5 bg-[var(--cardapio-muted)] rounded-2xl">
			<div class="space-y-2">
				<!-- Subtotal -->
				<div class="flex justify-between items-center text-sm">
					<span class="text-[var(--cardapio-text-muted)]">Subtotal</span>
					<span class="font-semibold text-[var(--cardapio-text)]">
						R$ {{ pedido.subtotal.toFixed(2) }}
					</span>
				</div>

				<!-- Taxa de Entrega -->
				<div class="flex justify-between items-center text-sm">
					<span class="text-[var(--cardapio-text-muted)]">Taxa de entrega</span>
					<span
						class="font-semibold"
						:class="
							pedido.taxa_entrega === 0
								? 'text-[var(--cardapio-primary)]'
								: 'text-[var(--cardapio-text)]'
						"
					>
						{{ pedido.taxa_entrega === 0 ? "Grátis" : `R$ ${pedido.taxa_entrega.toFixed(2)}` }}
					</span>
				</div>

				<!-- Desconto (se houver) -->
				<div
					v-if="pedido.desconto > 0"
					class="flex justify-between items-center text-sm text-green-600"
				>
					<span>Desconto</span>
					<span class="font-semibold">- R$ {{ pedido.desconto.toFixed(2) }}</span>
				</div>

				<!-- Total -->
				<div
					class="pt-3 mt-3 border-t-2 border-[var(--cardapio-border)] flex justify-between items-center"
				>
					<span class="text-base font-bold text-[var(--cardapio-text)]">Total</span>
					<span class="text-xl font-bold text-[var(--cardapio-primary)]">
						R$ {{ pedido.total.toFixed(2) }}
					</span>
				</div>
			</div>
		</div>
	</div>
</template>
