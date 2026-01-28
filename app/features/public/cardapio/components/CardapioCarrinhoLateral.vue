<script setup lang="ts">
/**
 * 📌 CardapioCarrinhoLateral
 *
 * Carrinho de compras premium (desktop only).
 * Visual moderno com micro-animações e hierarquia visual.
 */

import { useCarrinhoStore } from "~/stores/carrinho";
import { formatCurrency } from "~/lib/formatters/currency";

const carrinhoStore = useCarrinhoStore();

/**
 * Estado de hidratação - evita mismatch SSR
 */
const montado = ref(false);

onMounted(() => {
	montado.value = true;
});

/**
 * Remove item do carrinho
 */
const removerItem = (itemId: string) => {
	carrinhoStore.removerItem(itemId);
};

/**
 * Limpa o carrinho
 */
const limparCarrinho = () => {
	carrinhoStore.limpar();
};

/**
 * Slug do estabelecimento
 */
const route = useRoute();
const slug = computed(() => route.params.slug as string);

/**
 * Finalizar pedido - redireciona para checkout
 */
const finalizarPedido = () => {
	if (!slug.value) return;
	window.location.href = `/${slug.value}/checkout`;
};
</script>

<template>
	<aside class="sticky top-4 h-fit cardapio-theme-bridge">
		<div
			class="bg-[var(--cardapio-background)] rounded-2xl overflow-hidden shadow-[var(--cardapio-shadow)] ring-1 ring-[var(--cardapio-ring)]"
		>
			<!-- Header Premium com Gradiente -->
			<div
				class="bg-gradient-to-r from-[var(--cardapio-primary)] to-[var(--cardapio-primary)] p-4 sm:p-5"
			>
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-3">
						<div
							class="size-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center"
						>
							<Icon name="lucide:shopping-cart" class="w-5 h-5 text-white" />
						</div>
						<div>
							<h3 class="text-lg font-bold text-white">Seu Pedido</h3>
							<p v-if="montado && carrinhoStore.quantidadeTotal > 0" class="text-sm text-white/80">
								{{ carrinhoStore.quantidadeTotal }}
								{{ carrinhoStore.quantidadeTotal === 1 ? "item" : "itens" }}
							</p>
						</div>
					</div>
					<!-- Badge de quantidade -->
					<div
						v-if="montado && carrinhoStore.quantidadeTotal > 0"
						class="size-8 rounded-full bg-white text-[var(--cardapio-primary)] font-bold flex items-center justify-center shadow-lg"
					>
						{{ carrinhoStore.quantidadeTotal }}
					</div>
				</div>
			</div>

			<!-- Carrinho Vazio -->
			<div
				v-if="!montado || carrinhoStore.itens.length === 0"
				class="flex flex-col items-center justify-center py-12 px-4 text-center"
			>
				<div
					class="size-20 rounded-full bg-[var(--cardapio-secondary)] flex items-center justify-center mb-4"
				>
					<Icon name="lucide:shopping-bag" class="w-10 h-10 text-[var(--cardapio-text-muted)]" />
				</div>
				<p class="text-sm font-medium text-[var(--cardapio-text)] mb-1">Seu carrinho está vazio</p>
				<p class="text-xs text-[var(--cardapio-text-muted)]">
					Adicione itens do cardápio para começar
				</p>
			</div>

			<!-- Itens do Carrinho -->
			<div
				v-if="montado && carrinhoStore.itens.length > 0"
				class="p-4 space-y-3 max-h-[350px] overflow-y-auto"
			>
				<TransitionGroup name="list">
					<div
						v-for="item in carrinhoStore.itens"
						:key="item.id"
						class="group flex gap-3 p-3 bg-[var(--cardapio-secondary)] border border-[var(--cardapio-border)] rounded-xl hover:bg-[var(--cardapio-hover)] transition-colors"
					>
						<!-- Imagem -->
						<div
							class="size-14 rounded-lg bg-[var(--cardapio-background)] overflow-hidden shrink-0 shadow-sm"
						>
							<img
								v-if="item.imagem_url"
								:src="item.imagem_url"
								:alt="item.nome"
								class="w-full h-full object-cover"
							/>
							<div v-else class="w-full h-full flex items-center justify-center">
								<Icon name="lucide:image" class="w-5 h-5 text-[var(--cardapio-text-muted)]" />
							</div>
						</div>

						<!-- Info -->
						<div class="flex-1 min-w-0">
							<h4 class="text-sm font-semibold text-[var(--cardapio-text)] truncate">
								{{ item.nome }}
							</h4>
							<p v-if="item.variacao" class="text-xs text-[var(--cardapio-text-muted)] truncate">
								{{ item.variacao.nome }}
							</p>
							<div class="flex items-center justify-between mt-1.5">
								<span class="text-sm font-bold text-[var(--cardapio-primary)]">
									{{ formatCurrency(item.preco_total) }}
								</span>
								<span
									class="text-xs text-[var(--cardapio-text-muted)] bg-[var(--cardapio-background)] px-2 py-0.5 rounded-full"
								>
									{{ item.quantidade }}x
								</span>
							</div>
						</div>

						<!-- Botão Remover -->
						<button
							type="button"
							class="self-start opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-[var(--cardapio-text-muted)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
							title="Remover item"
							@click="removerItem(item.id)"
						>
							<Icon name="lucide:trash-2" class="w-4 h-4" />
						</button>
					</div>
				</TransitionGroup>
			</div>

			<!-- Resumo e Ações -->
			<div
				v-if="montado && carrinhoStore.itens.length > 0"
				class="p-4 border-t border-[var(--cardapio-border)] space-y-4"
			>
				<!-- Resumo de Valores -->
				<div class="space-y-2">
					<div class="flex items-center justify-between text-sm">
						<span class="text-[var(--cardapio-text-muted)]">Subtotal</span>
						<span class="font-medium text-[var(--cardapio-text)]">
							{{ formatCurrency(carrinhoStore.subtotal) }}
						</span>
					</div>

					<div class="flex items-center justify-between text-sm">
						<span class="text-[var(--cardapio-text-muted)]">Taxa de entrega</span>
						<span class="font-medium text-[var(--cardapio-text)]">
							{{ formatCurrency(carrinhoStore.taxa_entrega) }}
						</span>
					</div>

					<div class="h-px bg-[var(--cardapio-secondary)] my-2" />

					<div class="flex items-center justify-between">
						<span class="text-base font-bold text-[var(--cardapio-text)]">Total</span>
						<span class="text-xl font-bold text-[var(--cardapio-primary)]">
							{{ formatCurrency(carrinhoStore.total) }}
						</span>
					</div>
				</div>

				<!-- Botões de Ação -->
				<div class="space-y-2">
					<!-- Botão Finalizar com gradiente -->
					<button
						type="button"
						class="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[var(--cardapio-primary)] to-[var(--cardapio-primary)] text-white font-semibold shadow-lg shadow-[var(--cardapio-primary)]/25 hover:shadow-xl hover:shadow-[var(--cardapio-primary)]/30 transform hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-2"
						@click="finalizarPedido"
					>
						<Icon name="lucide:check" class="w-5 h-5" />
						Finalizar Pedido
					</button>

					<!-- Botão Limpar -->
					<button
						type="button"
						class="w-full py-2.5 px-4 rounded-xl text-sm font-medium text-[var(--cardapio-text-muted)] hover:text-red-500 hover:bg-white transition-colors flex items-center justify-center gap-2"
						@click="limparCarrinho"
					>
						<Icon name="lucide:trash-2" class="w-4 h-4" />
						Limpar Carrinho
					</button>
				</div>
			</div>
		</div>
	</aside>
</template>

<style scoped>
/* Animações de lista */
.list-enter-active,
.list-leave-active {
	transition: all 0.3s ease;
}
.list-enter-from {
	opacity: 0;
	transform: translateX(-20px);
}
.list-leave-to {
	opacity: 0;
	transform: translateX(20px);
}
</style>
