<script setup lang="ts">
/**
 * 📌 CardapioProdutoCardVertical
 *
 * Card vertical padrão para produtos (16:10).
 * Usado em: Mais Vendidos e Cardápio Completo.
 */

import type { ProdutoPublico } from "~/features/public/cardapio/types/cardapio-publico";

interface Props {
	produto: ProdutoPublico;
}

const props = defineProps<Props>();

// Estado do favorito
const favorito = ref(false);

/**
 * Calcula o preço mínimo do produto
 */
const precoMinimo = computed(() => {
	if (!props.produto.variacoes.length) return 0;

	const precos = props.produto.variacoes.map((v) => v.preco_promocional || v.preco);
	return Math.min(...precos);
});

/**
 * Rating mockado (TODO: implementar rating real)
 */
const rating = computed(() => {
	// Mock: gera rating entre 4.0 e 5.0
	return (4.0 + Math.random()).toFixed(1);
});

/**
 * Toggle favorito
 */
const toggleFavorito = () => {
	favorito.value = !favorito.value;
};

/**
 * Abre modal do produto
 */
const abrirModal = () => {
	// TODO: Implementar abertura do modal
	console.log("Abrir modal:", props.produto.id);
};

/**
 * Adiciona ao carrinho
 */
const adicionarAoCarrinho = () => {
	// TODO: Implementar lógica de adicionar ao carrinho
	console.log("Adicionar ao carrinho:", props.produto.id);
};
</script>

<template>
	<div
		class="flex flex-col bg-[var(--bg-surface)] rounded-xl overflow-hidden hover:shadow-lg transition-all group cursor-pointer"
		@click="abrirModal"
	>
		<!-- Imagem -->
		<div class="aspect-[16/10] overflow-hidden relative">
			<!-- Botão Favoritar -->
			<button
				type="button"
				class="absolute top-3 right-3 z-10 size-8 rounded-full bg-black/40 text-white backdrop-blur-sm flex items-center justify-center hover:bg-primary transition-colors"
				@click.stop="toggleFavorito"
			>
				<Icon
					:name="favorito ? 'lucide:heart' : 'lucide:heart'"
					:class="['w-5 h-5', favorito ? 'fill-current' : '']"
				/>
			</button>

			<img
				v-if="produto.imagem_url"
				:src="produto.imagem_url"
				:alt="produto.nome"
				class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
				loading="lazy"
			/>
			<div
				v-else
				class="w-full h-full flex items-center justify-center bg-[var(--bg-muted)] text-[var(--text-muted)]"
			>
				<Icon name="lucide:image" class="w-16 h-16" />
			</div>
		</div>

		<!-- Informações -->
		<div class="p-5 flex flex-col flex-1">
			<!-- Nome + Rating -->
			<div class="flex justify-between items-start mb-2">
				<h4 class="text-lg font-bold text-[var(--text-primary)] flex-1 line-clamp-1">
					{{ produto.nome }}
				</h4>
				<div
					class="flex items-center gap-1 text-xs font-semibold text-[var(--text-muted)] bg-[var(--bg-muted)] px-2 py-1 rounded ml-2"
				>
					<Icon name="lucide:star" class="w-[14px] h-[14px] text-primary fill-current" />
					<span>{{ rating }}</span>
				</div>
			</div>

			<!-- Descrição -->
			<p class="text-sm text-[var(--text-muted)] mb-4 line-clamp-2 flex-1">
				{{ produto.descricao || "Produto delicioso e de qualidade." }}
			</p>

			<!-- Preço + Botão -->
			<div class="mt-auto flex items-center justify-between">
				<span class="text-xl font-bold text-primary"> R$ {{ precoMinimo.toFixed(2) }} </span>
				<UiButton variant="solid" color="primary" size="sm" @click.stop="adicionarAoCarrinho">
					Adicionar ao Carrinho
				</UiButton>
			</div>
		</div>
	</div>
</template>
