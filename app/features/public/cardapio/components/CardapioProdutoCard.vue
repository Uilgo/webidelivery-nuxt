<script setup lang="ts">
/**
 * 📌 CardapioProdutoCard
 *
 * Card horizontal de produto (estilo iFood/Rappi).
 * Imagem à esquerda, informações à direita.
 */

import { useProdutoDrawer } from "../composables/useProdutoDrawer";
import type { ProdutoPublico } from "../types/cardapio-publico";
import { formatCurrency } from "~/lib/formatters/currency";

interface Props {
	produto: ProdutoPublico;
}

interface Emits {
	"produto-click": [produto: ProdutoPublico];
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Usar composable global para abrir drawer
const { abrir: abrirDrawer } = useProdutoDrawer();

/**
 * Retorna o menor preço entre as variações
 */
const menorPreco = computed(() => {
	if (!props.produto.variacoes.length) return 0;

	return props.produto.variacoes.reduce((menor, v) => {
		const preco = v.preco_promocional ?? v.preco;
		return preco < menor ? preco : menor;
	}, props.produto.variacoes[0]?.preco ?? 0);
});

/**
 * Verifica se tem preço promocional
 */
const temPromocao = computed(() => {
	return props.produto.variacoes.some((v) => v.preco_promocional !== null);
});

/**
 * Preço original (se tiver promoção)
 */
const precoOriginal = computed(() => {
	if (!temPromocao.value) return null;

	const variacaoComPromocao = props.produto.variacoes.find((v) => v.preco_promocional !== null);
	return variacaoComPromocao?.preco ?? null;
});

/**
 * Verifica se tem múltiplas variações
 */
const temMultiplasVariacoes = computed(() => {
	return props.produto.variacoes.length > 1;
});
</script>

<template>
	<button
		type="button"
		class="w-full flex gap-2 sm:gap-2.5 md:gap-3 p-2 sm:p-2.5 md:p-3 lg:p-4 cardapio-bg-surface hover:bg-[var(--bg-hover)] transition-colors text-left cardapio-rounded"
		@click="abrirDrawer(produto)"
	>
		<!-- Imagem (esquerda - muito menor no mobile) -->
		<div
			class="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 cardapio-rounded bg-[var(--bg-muted)] flex-shrink-0 overflow-hidden flex items-center justify-center"
		>
			<img
				v-if="produto.imagem_url"
				:src="produto.imagem_url"
				:alt="produto.nome"
				class="w-full h-full object-cover"
			/>
			<Icon
				v-else
				name="lucide:image"
				class="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-[var(--text-muted)]"
			/>
		</div>

		<!-- Conteúdo (direita) -->
		<div class="flex-1 min-w-0">
			<!-- Nome -->
			<h3
				class="text-xs sm:text-sm md:text-base font-medium cardapio-text-content line-clamp-2 leading-tight"
			>
				{{ produto.nome }}
			</h3>

			<!-- Descrição -->
			<p
				v-if="produto.descricao"
				class="mt-0.5 sm:mt-1 text-[10px] sm:text-xs md:text-sm text-[var(--text-muted)] line-clamp-2"
			>
				{{ produto.descricao }}
			</p>

			<!-- Preço -->
			<div class="mt-1 sm:mt-1.5 md:mt-2 flex items-center gap-1 sm:gap-1.5 md:gap-2 flex-wrap">
				<!-- Preço promocional ou normal -->
				<span class="text-xs sm:text-sm md:text-base font-semibold cardapio-text-primary">
					<span
						v-if="temMultiplasVariacoes"
						class="text-[var(--text-muted)] font-normal text-[10px] sm:text-xs md:text-sm"
						>A partir de
					</span>
					{{ formatCurrency(menorPreco) }}
				</span>

				<!-- Preço original riscado (se em promoção) -->
				<span
					v-if="precoOriginal"
					class="text-[10px] sm:text-xs text-[var(--text-muted)] line-through"
				>
					{{ formatCurrency(precoOriginal) }}
				</span>

				<!-- Badge de promoção -->
				<UiBadge
					v-if="produto.em_promocao"
					variant="error"
					size="sm"
					class="text-[9px] sm:text-[10px] md:text-xs scale-90 sm:scale-100"
				>
					Promoção
				</UiBadge>

				<!-- Badge de destaque -->
				<UiBadge
					v-if="produto.destaque"
					variant="warning"
					size="sm"
					class="text-[9px] sm:text-[10px] md:text-xs scale-90 sm:scale-100"
				>
					Destaque
				</UiBadge>
			</div>
		</div>
	</button>
</template>
