<script setup lang="ts">
/**
 * 📌 CardapioCarrinhoBotaoFlutuante
 *
 * Botão flutuante fixo na parte inferior (mobile/tablet) que mostra quantidade e total.
 * Abre o CardapioCarrinhoBottomSheet ao clicar.
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
const { abrir: abrirCarrinho, bottomSheetAberto: carrinhoBottomSheetAberto } = useCarrinhoDrawer();

// Só mostra o botão se o carrinho não estiver vazio E nenhum bottom sheet estiver aberto
const mostrarBotao = computed(
	() =>
		!carrinhoStore.estaVazio && !produtoBottomSheetAberto.value && !carrinhoBottomSheetAberto.value,
);

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
			class="fixed bottom-0 left-0 right-0 z-50 cardapio-theme-bridge pointer-events-none"
		>
			<!-- Safe area padding + visual padding -->
			<div class="p-3 sm:p-4 pb-safe pointer-events-auto">
				<div class="max-w-3xl mx-auto">
					<button
						type="button"
						class="w-full flex items-center justify-between gap-3 px-4 py-3 sm:py-3.5 bg-[var(--cardapio-primary)] text-white rounded-2xl font-semibold shadow-[0_-2px_16px_rgba(0,0,0,0.12)] hover:shadow-[0_-4px_20px_rgba(0,0,0,0.16)] active:scale-[0.98] transition-all duration-200"
						@click="handleClick"
						aria-label="Ver carrinho com itens"
					>
						<!-- Badge de quantidade -->
						<span
							class="flex items-center justify-center min-w-[24px] h-6 sm:min-w-[28px] sm:h-7 px-1.5 bg-white/20 rounded-full text-xs sm:text-sm font-bold"
							aria-label="Quantidade de itens"
						>
							{{ carrinhoStore.quantidadeTotal }}
						</span>

						<!-- Texto principal -->
						<span class="flex-1 text-left text-sm sm:text-base font-semibold">Ver carrinho</span>

						<!-- Preço total -->
						<span class="text-sm sm:text-base font-bold whitespace-nowrap">{{
							formatCurrency(carrinhoStore.total)
						}}</span>
					</button>
				</div>
			</div>
		</div>
	</Transition>
</template>

<style scoped>
/* Safe area bottom padding para dispositivos com notch/home indicator */
.pb-safe {
	padding-bottom: max(0.75rem, env(safe-area-inset-bottom));
}

@media (min-width: 640px) {
	.pb-safe {
		padding-bottom: max(1rem, env(safe-area-inset-bottom));
	}
}
</style>
