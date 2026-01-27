<script setup lang="ts">
/**
 * 📌 CardapioCategorias
 *
 * Menu premium de categorias com glassmorphism e animações.
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
	<nav class="sticky top-0 z-30 py-3 -mx-2 sm:-mx-3 md:-mx-4 px-2 sm:px-3 md:px-4">
		<!-- Container com Glassmorphism -->
		<div
			class="relative bg-[var(--bg-surface)]/80 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-lg border border-white/10 dark:border-white/5 p-2"
		>
			<!-- Fade gradient esquerda -->
			<div
				v-if="mostrarBotaoEsquerda"
				class="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-[var(--bg-surface)] to-transparent z-10 pointer-events-none rounded-l-xl sm:rounded-l-2xl"
			/>

			<!-- Botão Esquerda (Desktop) -->
			<Transition
				enter-active-class="transition-all duration-200"
				enter-from-class="opacity-0 -translate-x-2"
				enter-to-class="opacity-100 translate-x-0"
				leave-active-class="transition-all duration-200"
				leave-from-class="opacity-100 translate-x-0"
				leave-to-class="opacity-0 -translate-x-2"
			>
				<button
					v-if="mostrarBotaoEsquerda"
					type="button"
					class="hidden lg:flex absolute left-2 top-1/2 -translate-y-1/2 z-20 size-8 items-center justify-center rounded-full bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] shadow-lg border border-[var(--border-default)] transition-all hover:scale-110"
					@click="rolarEsquerda"
				>
					<Icon name="lucide:chevron-left" class="w-5 h-5 text-[var(--text-primary)]" />
				</button>
			</Transition>

			<!-- Container de Categorias -->
			<div
				ref="scrollContainer"
				class="flex gap-2 overflow-x-auto scrollbar-hide px-1"
				style="scrollbar-width: none; -ms-overflow-style: none"
			>
				<!-- Botão "Todos" -->
				<button
					type="button"
					class="flex-shrink-0 whitespace-nowrap px-4 py-2.5 text-sm font-medium transition-all duration-300 rounded-lg sm:rounded-xl relative overflow-hidden group"
					:class="[
						categoriaSelecionada === null
							? 'bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/25'
							: 'bg-[var(--bg-muted)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)]',
					]"
					@click="selecionarCategoria(null)"
				>
					<span class="relative z-10 flex items-center gap-2">
						<Icon name="lucide:grid-2x2" class="w-4 h-4" />
						Todos
					</span>
					<!-- Brilho no hover (quando não selecionado) -->
					<span
						v-if="categoriaSelecionada !== null"
						class="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"
					/>
				</button>

				<!-- Botões de Categorias -->
				<button
					v-for="categoria in categorias"
					:key="categoria.id"
					type="button"
					class="flex-shrink-0 whitespace-nowrap px-4 py-2.5 text-sm font-medium transition-all duration-300 rounded-lg sm:rounded-xl relative overflow-hidden group"
					:class="[
						categoriaSelecionada === categoria.id
							? 'bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/25'
							: 'bg-[var(--bg-muted)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)]',
					]"
					@click="selecionarCategoria(categoria.id)"
				>
					<span class="relative z-10">{{ categoria.nome }}</span>
					<!-- Brilho no hover (quando não selecionado) -->
					<span
						v-if="categoriaSelecionada !== categoria.id"
						class="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"
					/>
				</button>
			</div>

			<!-- Fade gradient direita -->
			<div
				v-if="mostrarBotaoDireita"
				class="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[var(--bg-surface)] to-transparent z-10 pointer-events-none rounded-r-xl sm:rounded-r-2xl"
			/>

			<!-- Botão Direita (Desktop) -->
			<Transition
				enter-active-class="transition-all duration-200"
				enter-from-class="opacity-0 translate-x-2"
				enter-to-class="opacity-100 translate-x-0"
				leave-active-class="transition-all duration-200"
				leave-from-class="opacity-100 translate-x-0"
				leave-to-class="opacity-0 translate-x-2"
			>
				<button
					v-if="mostrarBotaoDireita"
					type="button"
					class="hidden lg:flex absolute right-2 top-1/2 -translate-y-1/2 z-20 size-8 items-center justify-center rounded-full bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] shadow-lg border border-[var(--border-default)] transition-all hover:scale-110"
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
