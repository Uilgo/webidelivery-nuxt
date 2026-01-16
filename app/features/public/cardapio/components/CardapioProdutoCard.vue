<script setup lang="ts">
/**
 * 📌 CardapioProdutoCardHorizontal
 *
 * Card horizontal de produto (estilo iFood/Rappi).
 * Imagem à direita, informações à esquerda.
 */

import type { ProdutoPublico } from "../types/cardapio-publico";

interface Props {
	produto: ProdutoPublico;
}

interface Emits {
	(e: "click", produto: ProdutoPublico): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

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
 * Formata preço para exibição
 */
const formatarPreco = (valor: number): string => {
	return valor.toLocaleString("pt-BR", {
		style: "currency",
		currency: "BRL",
	});
};

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
		class="w-full flex gap-3 p-4 bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] transition-colors text-left"
		@click="emit('click', produto)"
	>
		<!-- Imagem (esquerda) -->
		<div
			class="w-24 h-24 rounded-lg bg-[var(--bg-muted)] flex-shrink-0 overflow-hidden flex items-center justify-center"
		>
			<img
				v-if="produto.imagem_url"
				:src="produto.imagem_url"
				:alt="produto.nome"
				class="w-full h-full object-cover"
			/>
			<Icon v-else name="lucide:image" class="w-8 h-8 text-[var(--text-muted)]" />
		</div>

		<!-- Conteúdo (direita) -->
		<div class="flex-1 min-w-0">
			<!-- Nome -->
			<h3 class="font-medium text-[var(--text-primary)] line-clamp-2">
				{{ produto.nome }}
			</h3>

			<!-- Descrição -->
			<p v-if="produto.descricao" class="mt-1 text-sm text-[var(--text-muted)] line-clamp-2">
				{{ produto.descricao }}
			</p>

			<!-- Preço -->
			<div class="mt-2 flex items-center gap-2 flex-wrap">
				<!-- Preço promocional ou normal -->
				<span class="text-sm font-semibold text-[var(--text-primary)]">
					<span v-if="temMultiplasVariacoes" class="text-[var(--text-muted)] font-normal"
						>A partir de
					</span>
					{{ formatarPreco(menorPreco) }}
				</span>

				<!-- Preço original riscado (se em promoção) -->
				<span v-if="precoOriginal" class="text-xs text-[var(--text-muted)] line-through">
					{{ formatarPreco(precoOriginal) }}
				</span>

				<!-- Badge de promoção -->
				<UiBadge v-if="produto.em_promocao" color="error" size="sm"> Promoção </UiBadge>

				<!-- Badge de destaque -->
				<UiBadge v-if="produto.destaque" color="warning" size="sm"> Destaque da Casa </UiBadge>
			</div>
		</div>
	</button>
</template>
