<script setup lang="ts">
/**
 * 📌 CardapioOfertaCard
 *
 * Card premium de ofertas para scroll horizontal.
 * Visual impactante com animações e badge de desconto.
 */

import type { ProdutoPublico } from "~/features/public/cardapio/types/cardapio-publico";
import { useProdutoDrawer } from "~/features/public/cardapio/composables/useProdutoDrawer";
import { formatCurrency } from "~/lib/formatters/currency";

interface Props {
	produto: ProdutoPublico;
}

const props = defineProps<Props>();

/**
 * Calcula o preço mínimo do produto
 */
const precoMinimo = computed(() => {
	if (!props.produto.variacoes?.length) return 0;

	const precos = props.produto.variacoes
		.map((v) => v.preco_promocional || v.preco)
		.filter((preco) => typeof preco === "number" && !isNaN(preco));

	return precos.length > 0 ? Math.min(...precos) : 0;
});

/**
 * Preço original (sem desconto)
 */
const precoOriginal = computed(() => {
	if (!props.produto.variacoes?.length) return null;
	const variacao = props.produto.variacoes[0];
	if (!variacao?.preco_promocional || !variacao?.preco) return null;
	return variacao.preco;
});

/**
 * Calcula o desconto percentual
 */
const descontoPercentual = computed(() => {
	if (!props.produto.variacoes?.length) return null;

	const variacao = props.produto.variacoes[0];
	if (!variacao?.preco_promocional || !variacao?.preco) return null;

	const desconto = ((variacao.preco - variacao.preco_promocional) / variacao.preco) * 100;
	return Math.round(desconto);
});

/**
 * Composable para abrir o drawer do produto
 */
const { abrir } = useProdutoDrawer();

/**
 * Abre o drawer do produto ao clicar no card
 */
const abrirProduto = () => {
	abrir(props.produto);
};
</script>

<template>
	<div
		class="group shrink-0 w-[160px] sm:w-[180px] bg-[var(--bg-surface)] rounded-xl sm:rounded-2xl overflow-hidden shadow-md hover:shadow-xl hover:shadow-[var(--primary)]/10 transition-all duration-300 cursor-pointer border border-transparent hover:border-[var(--primary)]/20"
		@click="abrirProduto"
	>
		<!-- Imagem -->
		<div class="relative aspect-square bg-[var(--bg-muted)] overflow-hidden">
			<!-- Badge de Desconto (animado) -->
			<div
				v-if="descontoPercentual"
				class="absolute top-2 left-2 z-10 px-2 py-1 cardapio-rounded bg-gradient-to-r from-[var(--cardapio-promo-from)] to-[var(--cardapio-promo-to)] text-white text-xs font-bold shadow-lg animate-pulse"
			>
				<span class="flex items-center gap-1">
					<Icon name="lucide:percent" class="w-3 h-3" />
					-{{ descontoPercentual }}%
				</span>
			</div>

			<!-- Imagem do produto com zoom -->
			<img
				v-if="produto.imagem_url"
				:src="produto.imagem_url"
				:alt="produto.nome"
				class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
				loading="lazy"
			/>
			<div
				v-else
				class="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700"
			>
				<Icon name="lucide:image" class="w-10 h-10 text-gray-400 dark:text-gray-500" />
			</div>

			<!-- Overlay gradiente no hover -->
			<div
				class="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
			/>
		</div>

		<!-- Informações -->
		<div class="p-3">
			<h4
				class="font-semibold text-sm text-[var(--text-primary)] line-clamp-2 leading-snug group-hover:text-[var(--cardapio-primary)] transition-colors"
			>
				{{ produto.nome }}
			</h4>

			<div class="mt-2 flex items-center justify-between">
				<div class="flex flex-col">
					<!-- Preço Original Riscado -->
					<span v-if="precoOriginal" class="text-[10px] text-[var(--text-muted)] line-through">
						{{ formatCurrency(precoOriginal) }}
					</span>
					<!-- Preço Atual -->
					<span
						class="text-sm sm:text-base font-bold text-[var(--cardapio-success)] dark:text-[var(--cardapio-success)]"
					>
						{{ formatCurrency(precoMinimo) }}
					</span>
				</div>

				<!-- Botão Add -->
				<button
					type="button"
					class="size-8 cardapio-rounded bg-[var(--cardapio-primary)] text-white flex items-center justify-center shadow-lg shadow-[var(--cardapio-primary)]/25 group-hover:scale-110 transition-all duration-300"
					@click.stop="abrirProduto"
				>
					<Icon name="lucide:plus" class="w-4 h-4" />
				</button>
			</div>
		</div>
	</div>
</template>
