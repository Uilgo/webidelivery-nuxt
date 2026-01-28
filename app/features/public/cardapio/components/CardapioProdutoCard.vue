<script setup lang="ts">
/**
 * 📌 CardapioProdutoCard
 *
 * Card de produto premium com visual moderno.
 * Inclui: hover effects, zoom na imagem, shadow elevation,
 * badges estilizados e micro-animações.
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
 * Calcula percentual de desconto
 */
const percentualDesconto = computed(() => {
	if (!precoOriginal.value || menorPreco.value >= precoOriginal.value) return null;
	const desconto = ((precoOriginal.value - menorPreco.value) / precoOriginal.value) * 100;
	return Math.round(desconto);
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
		class="group w-full flex gap-3 sm:gap-4 p-3 sm:p-4 bg-[var(--cardapio-secondary)] rounded-xl sm:rounded-2xl shadow-[var(--cardapio-card-shadow)] hover:shadow-[var(--cardapio-card-shadow-hover)] transition-all duration-300 text-left border border-transparent"
		:style="{
			'--tw-border-opacity': 'var(--cardapio-card-hover-border-opacity)',
		}"
		:class="{
			'hover:!border-[var(--cardapio-primary)]': true,
		}"
		@click="abrirDrawer(produto)"
	>
		<!-- Imagem com Zoom Effect -->
		<div class="relative shrink-0 overflow-hidden rounded-lg sm:rounded-xl">
			<!-- Container da imagem -->
			<div
				class="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 bg-[var(--cardapio-secondary)] overflow-hidden rounded-lg sm:rounded-xl"
			>
				<img
					v-if="produto.imagem_url"
					:src="produto.imagem_url"
					:alt="produto.nome"
					class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
					loading="lazy"
				/>
				<div
					v-else
					class="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700"
				>
					<Icon
						name="lucide:image"
						class="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 dark:text-gray-500"
					/>
				</div>
			</div>

			<!-- Badge de Desconto (se houver) -->
			<div
				v-if="percentualDesconto"
				class="absolute top-1.5 left-1.5 px-1.5 py-0.5 cardapio-rounded bg-gradient-to-r from-[var(--cardapio-promo-from)] to-[var(--cardapio-promo-to)] text-[var(--cardapio-promo-text)] text-[10px] sm:text-xs font-bold shadow-lg"
			>
				-{{ percentualDesconto }}%
			</div>
		</div>

		<!-- Conteúdo -->
		<div class="flex-1 min-w-0 flex flex-col justify-between py-0.5">
			<!-- Nome + Descrição -->
			<div>
				<h3
					class="text-sm sm:text-base font-semibold text-[var(--cardapio-text)] line-clamp-2 leading-snug group-hover:text-[var(--cardapio-primary)] transition-colors"
				>
					{{ produto.nome }}
				</h3>

				<p
					v-if="produto.descricao"
					class="mt-1 text-xs sm:text-sm text-[var(--cardapio-text-muted)] line-clamp-2 leading-relaxed"
				>
					{{ produto.descricao }}
				</p>
			</div>

			<!-- Preço + Badges -->
			<div class="mt-2 sm:mt-3 flex items-end justify-between gap-2">
				<div class="flex flex-col gap-1">
					<!-- Preço Original Riscado -->
					<span
						v-if="precoOriginal"
						class="text-[11px] sm:text-xs text-[var(--cardapio-text-muted)] line-through"
					>
						{{ formatCurrency(precoOriginal) }}
					</span>

					<!-- Preço Atual -->
					<div class="flex items-baseline gap-1.5">
						<span
							v-if="temMultiplasVariacoes"
							class="text-[10px] sm:text-xs text-[var(--cardapio-text-muted)]"
						>
							A partir de
						</span>
						<span
							class="text-base sm:text-lg font-bold"
							:class="
								temPromocao
									? 'text-[var(--cardapio-success)] dark:text-[var(--cardapio-success)]'
									: 'text-[var(--cardapio-primary)]'
							"
						>
							{{ formatCurrency(menorPreco) }}
						</span>
					</div>
				</div>

				<!-- Badges + Botão Add -->
				<div class="flex items-center gap-2">
					<!-- Badge de Destaque -->
					<span
						v-if="produto.destaque && !produto.em_promocao"
						class="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 cardapio-rounded bg-gradient-to-r from-[var(--cardapio-highlight-from)] to-[var(--cardapio-highlight-to)] text-[var(--cardapio-highlight-text)] text-[10px] sm:text-xs font-medium shadow-sm"
					>
						<Icon name="lucide:star" class="w-3 h-3 fill-current" />
						Destaque
					</span>

					<!-- Badge de Promoção -->
					<span
						v-if="produto.em_promocao"
						class="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 cardapio-rounded bg-gradient-to-r from-[var(--cardapio-promo-from)] to-[var(--cardapio-promo-to)] text-[var(--cardapio-promo-text)] text-[10px] sm:text-xs font-medium shadow-sm"
					>
						<Icon name="lucide:flame" class="w-3 h-3" />
						Promoção
					</span>

					<!-- Botão Adicionar -->
					<div
						class="size-8 sm:size-9 cardapio-rounded bg-[var(--cardapio-primary)] text-white flex items-center justify-center shadow-[var(--cardapio-button-shadow)] group-hover:scale-110 group-hover:shadow-[var(--cardapio-button-shadow-hover)] transition-all duration-300"
					>
						<Icon name="lucide:plus" class="w-4 h-4 sm:w-5 sm:h-5" />
					</div>
				</div>
			</div>
		</div>
	</button>
</template>
