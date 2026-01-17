<script setup lang="ts">
/**
 * 📌 CardapioCarrinhoLateral
 *
 * Carrinho de compras lateral fixo (desktop only).
 * Exibe itens do carrinho, subtotal e botão de finalizar pedido.
 */

import { useCarrinhoStore } from "~/stores/carrinho";

const carrinhoStore = useCarrinhoStore();

/**
 * Estado de hidratação - evita mismatch SSR
 */
const montado = ref(false);

onMounted(() => {
	montado.value = true;
});

/**
 * Formata valor em reais
 */
const formatarPreco = (valor: number): string => {
	return valor.toFixed(2).replace(".", ",");
};

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
	<aside class="sticky top-4 h-fit">
		<div class="bg-[var(--bg-surface)] rounded-xl shadow-lg p-4">
			<!-- Header -->
			<div
				class="flex items-center justify-between mb-4 pb-3 border-b border-[var(--border-color)]"
			>
				<h3 class="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
					<Icon name="lucide:shopping-cart" class="w-5 h-5" />
					Seu Pedido
				</h3>
				<UiBadge v-if="montado && carrinhoStore.quantidadeTotal > 0" variant="primary" size="sm">
					{{ carrinhoStore.quantidadeTotal }}
				</UiBadge>
			</div>

			<!-- Carrinho Vazio -->
			<div
				v-if="!montado || carrinhoStore.itens.length === 0"
				class="flex flex-col items-center justify-center py-8 text-center"
			>
				<Icon name="lucide:shopping-bag" class="w-16 h-16 text-[var(--text-muted)] mb-3" />
				<p class="text-sm text-[var(--text-muted)]">Seu carrinho está vazio</p>
				<p class="text-xs text-[var(--text-muted)] mt-1">Adicione itens do cardápio para começar</p>
			</div>

			<!-- Itens do Carrinho -->
			<div
				v-if="montado && carrinhoStore.itens.length > 0"
				class="space-y-3 mb-4 max-h-[400px] overflow-y-auto"
			>
				<div
					v-for="item in carrinhoStore.itens"
					:key="item.id"
					class="flex gap-3 p-3 bg-[var(--bg-muted)] rounded-lg"
				>
					<!-- Imagem -->
					<div class="size-16 rounded-lg bg-[var(--bg-surface)] overflow-hidden shrink-0">
						<img
							v-if="item.imagem_url"
							:src="item.imagem_url"
							:alt="item.nome"
							class="w-full h-full object-cover"
						/>
						<div
							v-else
							class="w-full h-full flex items-center justify-center text-[var(--text-muted)]"
						>
							<Icon name="lucide:image" class="w-6 h-6" />
						</div>
					</div>

					<!-- Info -->
					<div class="flex-1 min-w-0">
						<h4 class="text-sm font-semibold text-[var(--text-primary)] truncate">
							{{ item.nome }}
						</h4>
						<p v-if="item.variacao" class="text-xs text-[var(--text-muted)]">
							{{ item.variacao.nome }}
						</p>
						<p class="text-xs font-medium text-primary mt-1">
							R$ {{ formatarPreco(item.preco_total) }}
						</p>
					</div>

					<!-- Quantidade + Remover -->
					<div class="flex flex-col items-end justify-between">
						<button
							type="button"
							class="text-[var(--text-muted)] hover:text-red-500 transition-colors"
							@click="removerItem(item.id)"
						>
							<Icon name="lucide:x" class="w-4 h-4" />
						</button>
						<span class="text-xs text-[var(--text-muted)]">{{ item.quantidade }}x</span>
					</div>
				</div>
			</div>

			<!-- Resumo -->
			<div v-if="montado && carrinhoStore.itens.length > 0" class="space-y-3">
				<!-- Subtotal -->
				<div class="flex items-center justify-between text-sm">
					<span class="text-[var(--text-muted)]">Subtotal</span>
					<span class="font-semibold text-[var(--text-primary)]">
						R$ {{ formatarPreco(carrinhoStore.subtotal) }}
					</span>
				</div>

				<!-- Taxa de Entrega -->
				<div class="flex items-center justify-between text-sm">
					<span class="text-[var(--text-muted)]">Taxa de entrega</span>
					<span class="font-semibold text-[var(--text-primary)]">
						R$ {{ formatarPreco(carrinhoStore.taxa_entrega) }}
					</span>
				</div>

				<!-- Total -->
				<div
					class="flex items-center justify-between text-base pt-3 border-t border-[var(--border-color)]"
				>
					<span class="font-bold text-[var(--text-primary)]">Total</span>
					<span class="font-bold text-primary text-lg">
						R$ {{ formatarPreco(carrinhoStore.total) }}
					</span>
				</div>

				<!-- Botões -->
				<div class="space-y-2 pt-2">
					<UiButton
						variant="solid"
						color="primary"
						size="md"
						class="w-full"
						@click="
							() => {
								console.log('Botão clicado!', slug);
								finalizarPedido();
							}
						"
					>
						<template #iconLeft>
							<Icon name="lucide:check" class="w-4 h-4" />
						</template>
						Finalizar Pedido
					</UiButton>

					<UiButton variant="ghost" size="sm" class="w-full" @click="limparCarrinho">
						Limpar Carrinho
					</UiButton>
				</div>
			</div>
		</div>
	</aside>
</template>
