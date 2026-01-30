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
 * Verifica se o item pode ter quantidade alterada
 * Bloqueia se tiver adicionais selecionados (evita cobrar adicionais não solicitados)
 */
const podeAlterarQuantidade = (item: (typeof carrinhoStore.itens)[0]): boolean => {
	return !item.adicionais || item.adicionais.length === 0;
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
							<p v-if="carrinhoStore.quantidadeTotal > 0" class="text-sm text-white/80">
								{{ carrinhoStore.quantidadeTotal }}
								{{ carrinhoStore.quantidadeTotal === 1 ? "item" : "itens" }}
							</p>
						</div>
					</div>
					<!-- Badge de quantidade -->
					<div
						v-if="carrinhoStore.quantidadeTotal > 0"
						class="size-8 rounded-full bg-white text-[var(--cardapio-primary)] font-bold flex items-center justify-center shadow-lg"
					>
						{{ carrinhoStore.quantidadeTotal }}
					</div>
				</div>
			</div>

			<!-- Carrinho Vazio -->
			<div
				v-if="carrinhoStore.itens.length === 0"
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
				v-if="carrinhoStore.itens.length > 0"
				class="p-4 space-y-3 max-h-[400px] overflow-y-auto"
			>
				<TransitionGroup name="list">
					<div
						v-for="item in carrinhoStore.itens"
						:key="item.id"
						class="group bg-[var(--cardapio-secondary)] border border-[var(--cardapio-border)] rounded-xl overflow-hidden hover:border-[var(--cardapio-primary)]/30 transition-all duration-200"
					>
						<!-- Conteúdo Principal: Imagem + Info -->
						<div class="flex gap-3 p-3 pb-0">
							<!-- Imagem -->
							<div
								class="size-16 rounded-lg bg-[var(--cardapio-background)] overflow-hidden shrink-0 shadow-sm ring-1 ring-[var(--cardapio-border)]"
							>
								<img
									v-if="item.imagem_url"
									:src="item.imagem_url"
									:alt="item.nome"
									class="w-full h-full object-cover"
								/>
								<div v-else class="w-full h-full flex items-center justify-center">
									<Icon name="lucide:image" class="w-6 h-6 text-[var(--cardapio-text-muted)]" />
								</div>
							</div>

							<!-- Info e Botão Remover -->
							<div class="flex-1 min-w-0 flex items-start justify-between gap-2">
								<div class="flex-1 min-w-0">
									<h4 class="text-sm font-semibold text-[var(--cardapio-text)] leading-tight">
										{{ item.nome }}
									</h4>
									<p v-if="item.variacao" class="text-xs text-[var(--cardapio-text-muted)] mt-0.5">
										{{ item.variacao.nome }}
									</p>
									<p class="text-xs text-[var(--cardapio-text-muted)] mt-0.5">
										{{ formatCurrency(item.preco_unitario) }} cada
									</p>
								</div>
								<!-- Botão Remover -->
								<button
									type="button"
									class="shrink-0 p-1.5 rounded-md text-[var(--cardapio-text-muted)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all flex items-center justify-center"
									title="Remover item"
									@click="removerItem(item.id)"
								>
									<Icon name="lucide:trash-2" class="w-4 h-4" />
								</button>
							</div>
						</div>

						<!-- Linha de Controles: Seletor + Preço Total (largura total) -->
						<div class="flex items-center justify-between px-3 pb-3 pt-3">
							<!-- Controles +/- (se permitido) -->
							<div
								v-if="podeAlterarQuantidade(item)"
								class="flex items-center gap-1.5 bg-[var(--cardapio-background)] rounded-lg p-1 ring-1 ring-[var(--cardapio-border)]"
							>
								<button
									type="button"
									class="size-7 flex items-center justify-center rounded-md text-[var(--cardapio-text)] hover:bg-[var(--cardapio-hover)] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
									:disabled="item.quantidade <= 1"
									@click="carrinhoStore.decrementar(item.id)"
								>
									<Icon name="lucide:minus" class="w-4 h-4" />
								</button>
								<span
									class="min-w-[1.75rem] text-center text-sm font-semibold text-[var(--cardapio-text)]"
								>
									{{ item.quantidade }}
								</span>
								<button
									type="button"
									class="size-7 flex items-center justify-center rounded-md text-[var(--cardapio-text)] hover:bg-[var(--cardapio-hover)] active:scale-95 transition-all"
									@click="carrinhoStore.incrementar(item.id)"
								>
									<Icon name="lucide:plus" class="w-4 h-4" />
								</button>
							</div>

							<!-- Quantidade fixa + texto explicativo (se bloqueado) -->
							<div v-else class="flex items-start gap-3">
								<div
									class="flex items-center gap-2 px-3 py-1.5 bg-[var(--cardapio-secondary)] rounded-lg ring-1 ring-[var(--cardapio-border)]"
								>
									<Icon name="lucide:lock" class="w-3.5 h-3.5 text-[var(--cardapio-text-muted)]" />
									<span class="text-sm font-semibold text-[var(--cardapio-text)]">
										{{ item.quantidade }}x
									</span>
								</div>
								<p class="text-xs text-[var(--cardapio-text-muted)] leading-tight mt-1.5">
									Item personalizado
								</p>
							</div>

							<!-- Preço Total -->
							<span class="text-base font-bold text-[var(--cardapio-primary)]">
								{{ formatCurrency(item.preco_total) }}
							</span>
						</div>

						<!-- Adicionais (se houver) -->
						<div
							v-if="item.adicionais && item.adicionais.length > 0"
							class="px-3 pb-3 pt-0 border-t border-[var(--cardapio-border)]/50"
						>
							<div class="flex flex-wrap gap-1 mt-2">
								<span
									v-for="adicional in item.adicionais"
									:key="adicional.id"
									class="text-xs px-2 py-0.5 rounded-full bg-[var(--cardapio-background)] text-[var(--cardapio-text-muted)] border border-[var(--cardapio-border)]"
								>
									+ {{ adicional.nome }}
								</span>
							</div>
						</div>

						<!-- Observações (se houver) -->
						<div
							v-if="item.observacao"
							class="px-3 pb-3 pt-0 border-t border-[var(--cardapio-border)]/50"
						>
							<p class="text-xs text-[var(--cardapio-text-muted)] italic mt-2">
								<Icon name="lucide:message-square" class="w-3 h-3 inline mr-1" />
								{{ item.observacao }}
							</p>
						</div>
					</div>
				</TransitionGroup>
			</div>

			<!-- Resumo e Ações -->
			<div
				v-if="carrinhoStore.itens.length > 0"
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
						class="w-full py-2.5 px-4 rounded-xl text-sm font-medium text-[var(--cardapio-text-muted)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors flex items-center justify-center gap-2"
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
