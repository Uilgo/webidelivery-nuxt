<script setup lang="ts">
/**
 * 📌 CardapioProdutoItem
 *
 * Item de produto na listagem vertical do cardápio.
 * Estilo similar ao iFood/Rappi com imagem à direita.
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
 * Preço original (maior preço sem promoção)
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
 * Verifica se tem múltiplas variações (mostra "A partir de")
 */
const temMultiplasVariacoes = computed(() => {
	return props.produto.variacoes.length > 1;
});
</script>

<template>
	<button
		type="button"
		class="w-full flex gap-3 p-4 bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] transition-colors text-left border-b border-[var(--border-muted)] last:border-b-0"
		@click="emit('click', produto)"
	>
		<!-- Conteúdo (esquerda) -->
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
			<div class="mt-2 flex items-center gap-2">
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
			</div>
		</div>

		<!-- Imagem (direita) -->
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
	</button>
</template>
