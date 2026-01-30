<script setup lang="ts">
/**
 * 📌 CardapioCarrinhoBottomSheet
 * Bottom Sheet do carrinho otimizado para mobile - compacto e eficiente
 */

import { useCarrinhoStore } from "~/stores/carrinho";
import { formatCurrency } from "~/lib/formatters/currency";

interface Props {
	modelValue: boolean;
	estaAberto: boolean;
}

interface Emits {
	(e: "update:modelValue", value: boolean): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const carrinhoStore = useCarrinhoStore();

const isOpen = computed({
	get: () => props.modelValue,
	set: (value: boolean) => emit("update:modelValue", value),
});

const fechar = (): void => {
	isOpen.value = false;
};

const route = useRoute();
const slug = computed(() => route.params.slug as string);

const finalizarPedido = async (): Promise<void> => {
	if (!slug.value || !props.estaAberto) return;
	fechar();
	await navigateTo(`/${slug.value}/checkout`);
};

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
</script>

<template>
	<UiBottomSheet v-model="isOpen" :snap-points="[85]" :show-handle="true">
		<!-- Header Simples -->
		<template #header>
			<div class="px-3 py-2 border-b border-[var(--cardapio-border)]">
				<div class="flex items-center gap-2">
					<h2 class="text-base font-bold text-[var(--cardapio-text)]">Carrinho</h2>
					<span class="text-xs text-[var(--cardapio-text-muted)]">
						({{ carrinhoStore.quantidadeTotal }}
						{{ carrinhoStore.quantidadeTotal === 1 ? "item" : "itens" }})
					</span>
				</div>
			</div>
		</template>

		<!-- Estado Vazio -->
		<div
			v-if="carrinhoStore.estaVazio"
			class="flex flex-col items-center justify-center py-16 px-6 text-center"
		>
			<div
				class="size-20 rounded-full bg-[var(--cardapio-secondary)] flex items-center justify-center mb-4"
			>
				<Icon name="lucide:shopping-bag" class="w-10 h-10 text-[var(--cardapio-text-muted)]" />
			</div>
			<h3 class="text-base font-semibold text-[var(--cardapio-text)] mb-2">Carrinho vazio</h3>
			<p class="text-sm text-[var(--cardapio-text-muted)]">Adicione produtos para começar</p>
		</div>

		<!-- Lista de Itens (mais espaço) -->
		<div v-else class="px-2 pb-2 space-y-2.5 max-h-[60vh] overflow-y-auto">
			<TransitionGroup name="list">
				<div
					v-for="item in carrinhoStore.itens"
					:key="item.id"
					class="bg-[var(--cardapio-background)] rounded-xl p-2.5 border border-[var(--cardapio-border)]"
				>
					<!-- Linha 1: Imagem + Info + Remover -->
					<div class="flex gap-2.5 mb-2">
						<div class="size-14 rounded-lg bg-[var(--cardapio-secondary)] overflow-hidden shrink-0">
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

						<div class="flex-1 min-w-0">
							<h4 class="text-sm font-semibold text-[var(--cardapio-text)] leading-tight mb-0.5">
								{{ item.nome }}
							</h4>
							<p v-if="item.variacao" class="text-xs text-[var(--cardapio-text-muted)] mb-0.5">
								{{ item.variacao.nome }}
							</p>
							<p class="text-xs text-[var(--cardapio-text-muted)]">
								{{ formatCurrency(item.preco_unitario) }} cada
							</p>
						</div>

						<button
							type="button"
							class="shrink-0 size-7 rounded-lg flex items-center justify-center text-[var(--cardapio-text-muted)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
							@click="carrinhoStore.removerItem(item.id)"
						>
							<Icon name="lucide:trash-2" class="w-3.5 h-3.5" />
						</button>
					</div>

					<!-- Linha 2: Controles + Preço -->
					<div class="flex items-center justify-between">
						<!-- Controles +/- (se permitido) -->
						<div
							v-if="podeAlterarQuantidade(item)"
							class="flex items-center gap-1.5 bg-[var(--cardapio-secondary)] rounded-lg p-1"
						>
							<button
								type="button"
								class="size-7 rounded-md flex items-center justify-center bg-[var(--cardapio-background)] text-[var(--cardapio-text)] hover:bg-[var(--cardapio-hover)] transition-all disabled:opacity-40"
								:disabled="item.quantidade <= 1"
								@click="carrinhoStore.decrementar(item.id)"
							>
								<Icon name="lucide:minus" class="w-3.5 h-3.5" />
							</button>
							<span
								class="min-w-[1.75rem] text-center text-sm font-bold text-[var(--cardapio-text)]"
							>
								{{ item.quantidade }}
							</span>
							<button
								type="button"
								class="size-7 rounded-md flex items-center justify-center bg-[var(--cardapio-background)] text-[var(--cardapio-text)] hover:bg-[var(--cardapio-hover)] transition-all"
								@click="carrinhoStore.incrementar(item.id)"
							>
								<Icon name="lucide:plus" class="w-3.5 h-3.5" />
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

						<span class="text-base font-bold text-[var(--cardapio-primary)]">
							{{ formatCurrency(item.preco_total) }}
						</span>
					</div>

					<!-- Adicionais -->
					<div
						v-if="item.adicionais && item.adicionais.length > 0"
						class="mt-2 pt-2 border-t border-[var(--cardapio-border)]"
					>
						<div class="flex flex-wrap gap-1">
							<span
								v-for="adicional in item.adicionais"
								:key="adicional.id"
								class="text-xs px-2 py-0.5 rounded-full bg-[var(--cardapio-secondary)] text-[var(--cardapio-text-muted)]"
							>
								+ {{ adicional.nome }}
							</span>
						</div>
					</div>

					<!-- Observações -->
					<div v-if="item.observacao" class="mt-2 pt-2 border-t border-[var(--cardapio-border)]">
						<p class="text-xs text-[var(--cardapio-text-muted)] italic flex items-start gap-1">
							<Icon name="lucide:message-square" class="w-3 h-3 mt-0.5 shrink-0" />
							<span>{{ item.observacao }}</span>
						</p>
					</div>
				</div>
			</TransitionGroup>
		</div>

		<!-- Footer Compacto -->
		<template v-if="!carrinhoStore.estaVazio" #footer>
			<div
				class="px-4 pt-3 pb-4 space-y-3 bg-[var(--cardapio-background)] border-t border-[var(--cardapio-border)]"
			>
				<!-- Resumo Financeiro -->
				<div class="space-y-1.5">
					<div class="flex items-center justify-between text-xs">
						<span class="text-[var(--cardapio-text-muted)]">Subtotal</span>
						<span class="font-medium text-[var(--cardapio-text)]">
							{{ formatCurrency(carrinhoStore.subtotal) }}
						</span>
					</div>

					<div class="flex items-center justify-between text-xs">
						<span class="text-[var(--cardapio-text-muted)]">Taxa de entrega</span>
						<span class="font-medium text-[var(--cardapio-text)]">
							{{ formatCurrency(carrinhoStore.taxa_entrega) }}
						</span>
					</div>

					<div class="h-px bg-[var(--cardapio-border)] my-1.5" />

					<div class="flex items-center justify-between">
						<span class="text-base font-bold text-[var(--cardapio-text)]">Total</span>
						<span class="text-xl font-bold text-[var(--cardapio-primary)]">
							{{ formatCurrency(carrinhoStore.total) }}
						</span>
					</div>
				</div>

				<!-- Botões lado a lado -->
				<div class="flex gap-2">
					<button
						type="button"
						class="flex-1 py-3 px-4 rounded-xl font-semibold text-sm shadow-lg transition-all flex items-center justify-center gap-2"
						:class="
							estaAberto
								? 'bg-gradient-to-r from-[var(--cardapio-primary)] to-[var(--cardapio-primary)]/90 text-white hover:shadow-xl active:scale-[0.98]'
								: 'bg-[var(--cardapio-secondary)] text-[var(--cardapio-text-muted)] cursor-not-allowed opacity-60'
						"
						:disabled="!estaAberto"
						@click="finalizarPedido"
					>
						<Icon name="lucide:check-circle" class="w-4 h-4" />
						{{ estaAberto ? "Finalizar" : "Fechado" }}
					</button>

					<button
						type="button"
						class="px-4 py-3 rounded-xl text-sm font-medium text-[var(--cardapio-text-muted)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all flex items-center justify-center gap-1.5 border border-[var(--cardapio-border)]"
						@click="limparCarrinho"
					>
						<Icon name="lucide:trash-2" class="w-4 h-4" />
						Limpar
					</button>
				</div>
			</div>
		</template>
	</UiBottomSheet>
</template>

<style scoped>
.list-enter-active,
.list-leave-active {
	transition: all 0.3s ease;
}
.list-enter-from {
	opacity: 0;
	transform: translateY(-10px);
}
.list-leave-to {
	opacity: 0;
	transform: translateX(20px);
}
</style>
