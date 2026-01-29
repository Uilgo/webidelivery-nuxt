<script setup lang="ts">
/**
 * 📌 CardapioCarrinhoFlutuante
 *
 * Botão flutuante do carrinho que mostra quantidade e total.
 * Abre o bottom sheet/drawer do carrinho ao clicar.
 * Oculta quando o bottom sheet de produto está aberto.
 */

import { useCarrinhoStore } from "~/stores/carrinho";
import { useProdutoDrawer } from "../composables/useProdutoDrawer";
import { useCarrinhoDrawer } from "../composables/useCarrinhoDrawer";
import { formatCurrency } from "~/lib/formatters/currency";

// Store do carrinho
const carrinhoStore = useCarrinhoStore();

// Estado do bottom sheet de produto
const { bottomSheetAberto: produtoBottomSheetAberto } = useProdutoDrawer();

// Estado do carrinho drawer/bottom sheet
const { abrir: abrirCarrinho } = useCarrinhoDrawer();

// Só mostra o botão se o carrinho não estiver vazio E o bottom sheet de produto não estiver aberto
const mostrarBotao = computed(() => !carrinhoStore.estaVazio && !produtoBottomSheetAberto.value);

// Handler de clique
const handleClick = () => {
	abrirCarrinho();
};
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
			v-if="mostrarBotao"
			class="fixed bottom-0 left-0 right-0 z-50 p-3 sm:p-4 bg-[var(--cardapio-background)] border-t border-[var(--cardapio-border)] shadow-lg cardapio-theme-bridge"
		>
			<div class="max-w-3xl mx-auto">
				<button
					type="button"
					class="w-full flex items-center justify-between gap-3 px-4 py-3 sm:py-3.5 bg-[var(--cardapio-primary)] text-white rounded-2xl font-semibold shadow-lg hover:opacity-90 transition-opacity"
					@click="handleClick"
				>
					<span
						class="flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 bg-white/20 rounded-full text-sm font-bold"
					>
						{{ carrinhoStore.quantidadeTotal }}
					</span>

					<span class="flex-1 text-left text-sm sm:text-base">Ver carrinho</span>

					<span class="text-sm sm:text-base font-bold">{{
						formatCurrency(carrinhoStore.total)
					}}</span>
				</button>
			</div>
		</div>
	</Transition>
</template>

<style scoped></style>
