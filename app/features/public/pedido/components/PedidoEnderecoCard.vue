<script setup lang="ts">
/**
 * 📌 PedidoEnderecoCard
 *
 * Card com endereço de entrega (Tailwind + Design System Adaptativo).
 */

import type { PedidoCompleto } from "~/features/public/pedido/types/pedido";
import { formatCEP } from "~/lib/formatters/cep";

interface Props {
	pedido: PedidoCompleto;
}

const props = defineProps<Props>();
</script>

<template>
	<div
		v-if="pedido.tipo_entrega === 'delivery' && pedido.endereco_rua"
		class="flex gap-4 p-6 bg-[var(--cardapio-secondary)] rounded-2xl shadow-[var(--cardapio-card-shadow)]"
	>
		<!-- Ícone -->
		<div
			class="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--cardapio-primary)] to-[var(--cardapio-primary)] opacity-90 flex items-center justify-center flex-shrink-0 text-white"
		>
			<Icon name="lucide:home" class="w-6 h-6" />
		</div>

		<!-- Conteúdo -->
		<div class="flex-1 min-w-0">
			<p class="text-base font-bold text-[var(--cardapio-text)] mb-1">
				{{ pedido.endereco_rua }}, {{ pedido.endereco_numero }}
				<span v-if="pedido.endereco_complemento"> - {{ pedido.endereco_complemento }}</span>
			</p>
			<p class="text-sm text-[var(--cardapio-text-muted)] mb-1">
				{{ pedido.endereco_bairro }} - {{ pedido.endereco_cidade }}/{{ pedido.endereco_estado }}
			</p>
			<p class="text-sm text-[var(--cardapio-text-muted)] font-mono mb-2">
				CEP: {{ pedido.endereco_cep ? formatCEP(pedido.endereco_cep) : "Não informado" }}
			</p>
			<div
				v-if="pedido.endereco_referencia"
				class="flex items-start gap-2 p-2 bg-[var(--cardapio-muted)] rounded-lg"
			>
				<Icon
					name="lucide:info"
					class="w-4 h-4 text-[var(--cardapio-text-muted)] flex-shrink-0 mt-0.5"
				/>
				<p class="text-xs text-[var(--cardapio-text-muted)]">
					<strong>Referência:</strong> {{ pedido.endereco_referencia }}
				</p>
			</div>
		</div>
	</div>
</template>
