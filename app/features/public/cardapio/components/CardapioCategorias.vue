<script setup lang="ts">
/**
 * 📌 CardapioCategorias
 *
 * Menu horizontal de categorias com scroll.
 * Permite navegação rápida entre seções do cardápio.
 */

import type { CategoriaPublica } from "../types/cardapio-publico";

interface Props {
	categorias: CategoriaPublica[];
	categoriaSelecionada: string | null;
}

interface Emits {
	(e: "selecionar", categoriaId: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Ref do container de scroll
const scrollContainer = ref<HTMLElement | null>(null);
const mostrarBotaoEsquerda = ref(false);
const mostrarBotaoDireita = ref(false);

/**
 * Seleciona uma categoria e faz scroll suave até ela
 */
const selecionarCategoria = (categoriaId: string) => {
	emit("selecionar", categoriaId);

	// Scroll para a seção da categoria na página
	const elemento = document.getElementById(`categoria-${categoriaId}`);
	if (elemento) {
		elemento.scrollIntoView({ behavior: "smooth", block: "start" });
	}
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
	<nav class="sticky top-[72px] z-30 px-4 py-3 bg-[var(--bg-page)]">
		<div class="max-w-3xl mx-auto relative">
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
				<UiButton
					v-for="categoria in categorias"
					:key="categoria.id"
					:variant="categoriaSelecionada === categoria.id ? 'solid' : 'ghost'"
					:color="categoriaSelecionada === categoria.id ? 'primary' : 'neutral'"
					size="sm"
					class="flex-shrink-0 whitespace-nowrap"
					@click="selecionarCategoria(categoria.id)"
				>
					{{ categoria.nome }}
				</UiButton>
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
