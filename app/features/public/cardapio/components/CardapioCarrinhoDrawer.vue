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
		<div v-else class="divide-y divide-[var(--cardapio-muted)]">
			<div v-for="item in carrinhoStore.itens" :key="item.id" class="py-4">
				<div class="flex gap-3">
					<!-- Imagem -->
					<div
						class="w-16 h-16 rounded-lg bg-[var(--cardapio-muted)] flex-shrink-0 overflow-hidden flex items-center justify-center"
					>
						<img
							v-if="item.imagem_url"
							:src="item.imagem_url"
							:alt="item.nome"
							class="w-full h-full object-cover"
						/>
						<Icon v-else name="lucide:image" class="w-6 h-6 text-[var(--cardapio-text-muted)]" />
					</div>

					<!-- Info -->
					<div class="flex-1 min-w-0">
						<h3 class="font-medium text-[var(--cardapio-text)] truncate">{{ item.nome }}</h3>

						<!-- Variação -->
						<p v-if="item.variacao" class="text-sm text-[var(--cardapio-text-muted)]">
							{{ item.variacao.nome }}
						</p>

						<!-- Adicionais -->
						<p v-if="item.adicionais.length > 0" class="text-xs text-[var(--cardapio-text-muted)]">
							+ {{ item.adicionais.map((a) => `${a.quantidade}x ${a.nome}`).join(", ") }}
						</p>

						<!-- Observação -->
						<p v-if="item.observacao" class="text-xs text-[var(--cardapio-text-muted)] italic mt-1">
							"{{ item.observacao }}"
						</p>

						<!-- Preço e controles -->
						<div class="flex items-center justify-between mt-2">
							<span class="font-medium text-[var(--cardapio-text)]">
								{{ formatCurrency(item.preco_total) }}
							</span>

							<!-- Controles de quantidade -->
							<div class="flex items-center gap-2">
								<UiButton
									variant="outline"
									color="neutral"
									size="sm"
									@click="carrinhoStore.decrementar(item.id)"
								>
									<Icon name="lucide:minus" class="w-3 h-3" />
								</UiButton>

								<span class="w-5 text-center text-sm font-medium text-[var(--cardapio-text)]">
									{{ item.quantidade }}
								</span>

								<UiButton
									variant="outline"
									color="neutral"
									size="sm"
									@click="carrinhoStore.incrementar(item.id)"
								>
									<Icon name="lucide:plus" class="w-3 h-3" />
								</UiButton>

								<!-- Remover -->
								<UiButton
									variant="ghost"
									color="error"
									size="sm"
									class="ml-2"
									@click="carrinhoStore.removerItem(item.id)"
								>
									<Icon name="lucide:trash-2" class="w-4 h-4" />
								</UiButton>
							</div>
						</div>
					</div>
				</div>
			</div>
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
						class="flex justify-between font-semibold text-[var(--cardapio-text)] text-base pt-2 border-t border-[var(--cardapio-muted)]"
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
