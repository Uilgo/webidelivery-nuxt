<script setup lang="ts">
/**
 * 📌 PedidoClienteCard
 *
 * Card com dados do cliente (Tailwind + Design System Adaptativo).
 */

import type { PedidoCompleto } from "~/features/public/pedido/types/pedido";
import { formatPhone } from "~/lib/formatters/phone";

interface Props {
	pedido: PedidoCompleto;
}

const props = defineProps<Props>();
</script>

<template>
	<div class="p-6 bg-[var(--cardapio-secondary)] rounded-2xl shadow-[var(--cardapio-card-shadow)]">
		<div class="flex flex-col gap-4">
			<!-- Item: Nome -->
			<div class="flex items-center gap-4">
				<div
					class="w-10 h-10 rounded-full bg-[var(--cardapio-primary)] bg-opacity-10 flex items-center justify-center flex-shrink-0"
				>
					<Icon name="lucide:user" class="w-5 h-5 text-[var(--cardapio-primary)]" />
				</div>
				<div class="flex-1 min-w-0">
					<span
						class="block text-xs font-semibold text-[var(--cardapio-text-muted)] uppercase tracking-wide"
					>
						Nome
					</span>
					<span class="block text-base font-semibold text-[var(--cardapio-text)] truncate">
						{{ pedido.cliente_nome }}
					</span>
				</div>
			</div>

			<!-- Item: Telefone -->
			<div class="flex items-center gap-4">
				<div
					class="w-10 h-10 rounded-full bg-[var(--cardapio-primary)] bg-opacity-10 flex items-center justify-center flex-shrink-0"
				>
					<Icon name="lucide:phone" class="w-5 h-5 text-[var(--cardapio-primary)]" />
				</div>
				<div class="flex-1 min-w-0">
					<span
						class="block text-xs font-semibold text-[var(--cardapio-text-muted)] uppercase tracking-wide"
					>
						Telefone
					</span>
					<span class="block text-base font-semibold text-[var(--cardapio-text)]">
						{{ formatPhone(pedido.cliente_telefone) }}
					</span>
				</div>
			</div>

			<!-- Item: E-mail (opcional) -->
			<div v-if="pedido.cliente_email" class="flex items-center gap-4">
				<div
					class="w-10 h-10 rounded-full bg-[var(--cardapio-primary)] bg-opacity-10 flex items-center justify-center flex-shrink-0"
				>
					<Icon name="lucide:mail" class="w-5 h-5 text-[var(--cardapio-primary)]" />
				</div>
				<div class="flex-1 min-w-0">
					<span
						class="block text-xs font-semibold text-[var(--cardapio-text-muted)] uppercase tracking-wide"
					>
						E-mail
					</span>
					<span class="block text-base font-semibold text-[var(--cardapio-text)] truncate">
						{{ pedido.cliente_email }}
					</span>
				</div>
			</div>
		</div>
	</div>
</template>
