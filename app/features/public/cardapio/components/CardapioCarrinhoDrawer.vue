<script setup lang="ts">
/**
 * 📌 CardapioCarrinhoDrawer
 *
 * Drawer lateral com os itens do carrinho.
 * Permite editar quantidades e ir para checkout.
 */

import { useCarrinhoStore } from "~/stores/carrinho";
import { formatCurrency } from "~/lib/formatters/currency";

interface Props {
	modelValue: boolean;
	estaAberto: boolean;
}

interface Emits {
	(e: "update:modelValue", value: boolean): void;
	(e: "checkout"): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Store do carrinho
const carrinhoStore = useCarrinhoStore();

// Computed para controle do drawer
const isOpen = computed({
	get: () => props.modelValue,
	set: (value: boolean) => emit("update:modelValue", value),
});

/**
 * Fecha o drawer
 */
const fechar = (): void => {
	isOpen.value = false;
};

/**
 * Slug do estabelecimento
 */
const route = useRoute();
const slug = computed(() => route.params.slug as string);

/**
 * Vai para checkout
 */
const irParaCheckout = async (): Promise<void> => {
	if (!slug.value) {
		console.error("Slug não encontrado");
		return;
	}

	fechar();
	await navigateTo(`/${slug.value}/checkout`);
};
</script>

<template>
	<UiDrawer
		v-model="isOpen"
		title="Seu pedido"
		position="right"
		size="md"
		class="cardapio-theme-bridge"
	>
		<!-- Estado vazio -->
		<UiEmptyState
			v-if="carrinhoStore.estaVazio"
			icon="lucide:shopping-bag"
			title="Carrinho vazio"
			description="Adicione produtos ao seu carrinho"
			class="cardapio-theme-bridge"
		>
			<template #actions>
				<UiButton variant="outline" color="primary" @click="fechar"> Continuar comprando </UiButton>
			</template>
		</UiEmptyState>

		<!-- Lista de itens -->
		<div v-else class="space-y-3">
			<TransitionGroup name="list">
				<div
					v-for="item in carrinhoStore.itens"
					:key="item.id"
					class="bg-[var(--cardapio-secondary)] border border-[var(--cardapio-border)] rounded-xl overflow-hidden hover:border-[var(--cardapio-primary)]/30 transition-all duration-200"
				>
					<!-- Conteúdo Principal -->
					<div class="flex gap-3 p-3">
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

						<!-- Info e Ações -->
						<div class="flex-1 min-w-0 flex flex-col">
							<!-- Cabeçalho: Nome + Botão Remover -->
							<div class="flex items-start justify-between gap-2 mb-1">
								<div class="flex-1 min-w-0">
									<h4 class="text-sm font-semibold text-[var(--cardapio-text)] leading-tight">
										{{ item.nome }}
									</h4>
									<p
										v-if="item.variacao"
										class="text-xs text-[var(--cardapio-text-muted)] mt-0.5 truncate"
									>
										{{ item.variacao.nome }}
									</p>
								</div>
								<!-- Botão Remover - Sempre visível mas discreto -->
								<button
									type="button"
									class="shrink-0 p-1 rounded-md text-[var(--cardapio-text-muted)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
									title="Remover item"
									@click="carrinhoStore.removerItem(item.id)"
								>
									<Icon name="lucide:trash-2" class="w-4 h-4" />
								</button>
							</div>

							<!-- Preço Unitário -->
							<div class="text-xs text-[var(--cardapio-text-muted)] mb-2">
								{{ formatCurrency(item.preco_unitario) }} cada
							</div>

							<!-- Controles de Quantidade -->
							<div class="flex items-center justify-between mt-auto">
								<!-- Controles +/- (à esquerda) -->
								<div
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

								<!-- Preço Total do Item (à direita) -->
								<span class="text-base font-bold text-[var(--cardapio-primary)]">
									{{ formatCurrency(item.preco_total) }}
								</span>
							</div>
						</div>
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

		<!-- Footer com totais -->
		<template v-if="!carrinhoStore.estaVazio" #footer>
			<div class="space-y-4">
				<!-- Resumo -->
				<div class="space-y-2 text-sm">
					<div class="flex justify-between text-[var(--cardapio-text-muted)]">
						<span>Subtotal</span>
						<span>{{ formatCurrency(carrinhoStore.subtotal) }}</span>
					</div>

					<div
						v-if="carrinhoStore.taxa_entrega > 0"
						class="flex justify-between text-[var(--cardapio-text-muted)]"
					>
						<span>Taxa de entrega</span>
						<span>{{ formatCurrency(carrinhoStore.taxa_entrega) }}</span>
					</div>

					<div v-if="carrinhoStore.desconto > 0" class="flex justify-between text-[var(--success)]">
						<span>Desconto</span>
						<span>- {{ formatCurrency(carrinhoStore.desconto) }}</span>
					</div>

					<div
						class="flex justify-between font-semibold text-[var(--cardapio-text)] text-base pt-2 border-t border-[var(--cardapio-border)]"
					>
						<span>Total</span>
						<span>{{ formatCurrency(carrinhoStore.total) }}</span>
					</div>
				</div>

				<!-- Botão checkout -->
				<UiButton
					variant="solid"
					color="primary"
					size="lg"
					class="w-full"
					:disabled="!estaAberto"
					@click="irParaCheckout"
				>
					{{ estaAberto ? "Finalizar pedido" : "Estabelecimento fechado" }}
				</UiButton>

				<!-- Aviso se fechado -->
				<p v-if="!estaAberto" class="text-xs text-center text-[var(--error)]">
					O estabelecimento está fechado no momento
				</p>
			</div>
		</template>
	</UiDrawer>
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
