<script setup lang="ts">
/**
 * 📌 CardapioOfertaCard
 *
 * Card compacto para ofertas (scroll horizontal).
 * Formato: Square (1:1), ~140px de largura.
 */

import type { ProdutoPublico } from "~/features/public/cardapio/types/cardapio-publico";

interface Props {
	produto: ProdutoPublico;
}

const props = defineProps<Props>();

/**
 * Calcula o preço mínimo do produto
 */
const precoMinimo = computed(() => {
	if (!props.produto.variacoes.length) return 0;

	const precos = props.produto.variacoes.map((v) => v.preco_promocional || v.preco);
	return Math.min(...precos);
});

/**
 * Calcula o desconto percentual
 */
const descontoPercentual = computed(() => {
	if (!props.produto.variacoes.length) return null;

	const variacao = props.produto.variacoes[0];
	if (!variacao?.preco_promocional) return null;

	const desconto = ((variacao.preco - variacao.preco_promocional) / variacao.preco) * 100;
	return Math.round(desconto);
});

/**
 * Adiciona produto ao carrinho
 */
const adicionarAoCarrinho = () => {
	// TODO: Implementar lógica de adicionar ao carrinho
	console.log("Adicionar ao carrinho:", props.produto.id);
};
</script>

<template>
	<div
		class="shrink-0 w-[140px] bg-[var(--bg-surface)] rounded-xl overflow-hidden hover:ring-1 hover:ring-primary/50 transition-all cursor-pointer group"
	>
		<!-- Imagem -->
		<div class="aspect-square bg-[var(--bg-muted)] overflow-hidden relative">
			<!-- Badge de Desconto -->
			<div
				v-if="descontoPercentual"
				class="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10"
			>
				-{{ descontoPercentual }}%
			</div>

			<img
				v-if="produto.imagem_url"
				:src="produto.imagem_url"
				:alt="produto.nome"
				class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
				loading="lazy"
			/>
			<div v-else class="w-full h-full flex items-center justify-center text-[var(--text-muted)]">
				<Icon name="lucide:image" class="w-12 h-12" />
			</div>
		</div>

		<!-- Informações -->
		<div class="p-3">
			<h4 class="font-bold text-sm text-[var(--text-primary)] truncate mb-1">
				{{ produto.nome }}
			</h4>

			<div class="flex items-center justify-between">
				<span class="text-primary font-bold text-sm"> R$ {{ precoMinimo.toFixed(2) }} </span>

				<button
					type="button"
					class="size-6 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-colors"
					@click.stop="adicionarAoCarrinho"
				>
					<Icon name="lucide:plus" class="w-4 h-4" />
				</button>
			</div>
		</div>
	</div>
</template>
