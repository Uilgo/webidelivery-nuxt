<script setup lang="ts">
/**
 * 📌 CardapioCarrinhoFlutuante
 *
 * Botão flutuante do carrinho que mostra quantidade e total.
 * Abre o drawer do carrinho ao clicar.
 */

import { useCarrinhoStore } from "~/stores/carrinho";
import { formatCurrency } from "~/lib/formatters/currency";

interface Emits {
	(e: "abrir"): void;
}

const emit = defineEmits<Emits>();

// Store do carrinho
const carrinhoStore = useCarrinhoStore();

/**
 * Estado de hidratação - evita mismatch SSR
 */
const montado = ref(false);

onMounted(() => {
	montado.value = true;
});
</script>

<template>
	<Transition
		enter-active-class="transition-all duration-300 ease-out"
		enter-from-class="translate-y-full opacity-0"
		enter-to-class="translate-y-0 opacity-100"
		leave-active-class="transition-all duration-200 ease-in"
		leave-from-class="translate-y-0 opacity-100"
		leave-to-class="translate-y-full opacity-0"
	>
		<div
			v-if="montado && !carrinhoStore.estaVazio"
			class="fixed bottom-0 left-0 right-0 z-50 p-4 bg-[var(--cardapio-background)] border-t border-[var(--cardapio-border)] shadow-lg cardapio-theme-bridge"
		>
			<div class="max-w-3xl mx-auto">
				<UiButton variant="solid" color="primary" size="lg" class="w-full" @click="emit('abrir')">
					<template #iconLeft>
						<span
							class="flex items-center justify-center w-6 h-6 bg-white/20 rounded-full text-sm font-semibold"
						>
							{{ carrinhoStore.quantidadeTotal }}
						</span>
					</template>

					<span class="flex-1">Ver carrinho</span>

					<span class="font-semibold">{{ formatCurrency(carrinhoStore.total) }}</span>
				</UiButton>
			</div>
		</div>
	</Transition>
</template>

<style scoped></style>
