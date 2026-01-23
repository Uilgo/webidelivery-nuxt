<script setup lang="ts">
/**
 * 📌 CardapioCategorias
 *
 * Menu horizontal de categorias com scroll.
 * Permite navegação rápida entre seções do cardápio.
 */

import type { CategoriaPublica } from "../types/cardapio-publico";

interface Props {
	categorias: readonly CategoriaPublica[] | CategoriaPublica[];
	categoriaSelecionada: string | null;
}

interface Emits {
	(e: "selecionar", categoriaId: string | null): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Ref do container de scroll
const scrollContainer = ref<HTMLElement | null>(null);
const mostrarBotaoEsquerda = ref(false);
const mostrarBotaoDireita = ref(false);

/**
 * Seleciona uma categoria
 */
const selecionarCategoria = (categoriaId: string | null) => {
	emit("selecionar", categoriaId);
};

/**
 * Rola o menu para a esquerda
 */
const rolarEsquerda = () => {
	if (scrollContainer.value) {
		scrollContainer.value.scrollBy({ left: -200, behavior: "smooth" });
	}
};

/**
 * Rola o menu para a direita
 */
const rolarDireita = () => {
	if (scrollContainer.value) {
		scrollContainer.value.scrollBy({ left: 200, behavior: "smooth" });
	}
};

/**
 * Atualiza a visibilidade dos botões de navegação
 */
const atualizarBotoes = () => {
	if (!scrollContainer.value) return;

	const { scrollLeft, scrollWidth, clientWidth } = scrollContainer.value;

	mostrarBotaoEsquerda.value = scrollLeft > 0;
	mostrarBotaoDireita.value = scrollLeft < scrollWidth - clientWidth - 10;
};

// Observa mudanças no scroll
onMounted(() => {
	if (scrollContainer.value) {
		scrollContainer.value.addEventListener("scroll", atualizarBotoes);
		// Verifica inicialmente
		atualizarBotoes();
	}
});

onUnmounted(() => {
	if (scrollContainer.value) {
		scrollContainer.value.removeEventListener("scroll", atualizarBotoes);
	}
});

// Atualiza quando as categorias mudam
watch(
	() => props.categorias,
	() => {
		nextTick(() => {
			atualizarBotoes();
		});
	},
);
</script>

<template>
	<nav
		class="sticky top-[72px] z-30 py-3 bg-[var(--bg-page)] -mx-2 sm:-mx-3 md:-mx-4 px-2 sm:px-3 md:px-4"
	>
		<div class="w-full relative">
			<!-- Botão Esquerda (Desktop) -->
			<Transition
				enter-active-class="transition-opacity duration-200"
				enter-from-class="opacity-0"
				enter-to-class="opacity-100"
				leave-active-class="transition-opacity duration-200"
				leave-from-class="opacity-100"
				leave-to-class="opacity-0"
			>
				<button
					v-if="mostrarBotaoEsquerda"
					type="button"
					class="hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 items-center justify-center rounded-full bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] shadow-md border border-[var(--border-default)] transition-colors"
					@click="rolarEsquerda"
				>
					<Icon name="lucide:chevron-left" class="w-5 h-5 text-[var(--text-primary)]" />
				</button>
			</Transition>

			<!-- Container de Categorias -->
			<div
				ref="scrollContainer"
				class="flex gap-2 overflow-x-auto scrollbar-hide"
				style="scrollbar-width: none; -ms-overflow-style: none"
			>
				<!-- Botão "Todos" -->
				<button
					type="button"
					class="flex-shrink-0 whitespace-nowrap px-4 py-2 text-sm font-medium transition-all cardapio-rounded"
					:class="[
						categoriaSelecionada === null
							? 'cardapio-bg-primary text-white shadow-sm'
							: 'cardapio-bg-surface cardapio-text-content hover:bg-[var(--bg-hover)] border cardapio-border-primary border-opacity-20',
					]"
					@click="selecionarCategoria(null)"
				>
					Todos
				</button>

				<!-- Botões de Categorias -->
				<button
					v-for="categoria in categorias"
					:key="categoria.id"
					type="button"
					class="flex-shrink-0 whitespace-nowrap px-4 py-2 text-sm font-medium transition-all cardapio-rounded"
					:class="[
						categoriaSelecionada === categoria.id
							? 'cardapio-bg-primary text-white shadow-sm'
							: 'cardapio-bg-surface cardapio-text-content hover:bg-[var(--bg-hover)] border cardapio-border-primary border-opacity-20',
					]"
					@click="selecionarCategoria(categoria.id)"
				>
					{{ categoria.nome }}
				</button>
			</div>

			<!-- Botão Direita (Desktop) -->
			<Transition
				enter-active-class="transition-opacity duration-200"
				enter-from-class="opacity-0"
				enter-to-class="opacity-100"
				leave-active-class="transition-opacity duration-200"
				leave-from-class="opacity-100"
				leave-to-class="opacity-0"
			>
				<button
					v-if="mostrarBotaoDireita"
					type="button"
					class="hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 items-center justify-center rounded-full bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] shadow-md border border-[var(--border-default)] transition-colors"
					@click="rolarDireita"
				>
					<Icon name="lucide:chevron-right" class="w-5 h-5 text-[var(--text-primary)]" />
				</button>
			</Transition>
		</div>
	</nav>
</template>

<style scoped>
/* Esconde scrollbar em webkit browsers */
.scrollbar-hide::-webkit-scrollbar {
	display: none;
}
</style>
