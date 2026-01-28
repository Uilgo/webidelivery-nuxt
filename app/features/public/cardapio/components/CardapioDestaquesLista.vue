<script setup lang="ts">
/**
 * 📌 CardapioDestaquesLista
 *
 * Seção premium de produtos mais vendidos/destaque.
 * Visual diferenciado com ícone animado.
 */

import type { ProdutoPublico } from "~/features/public/cardapio/types/cardapio-publico";
import CardapioProdutoCard from "~/features/public/cardapio/components/CardapioProdutoCard.vue";

interface Props {
	destaques: readonly ProdutoPublico[] | ProdutoPublico[];
}

const props = defineProps<Props>();
</script>

<template>
	<section v-if="destaques.length" class="mb-6 sm:mb-8">
		<!-- Header Premium -->
		<div class="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-5">
			<!-- Ícone com animação de brilho -->
			<div
				class="relative size-8 sm:size-10 rounded-xl bg-gradient-to-br from-[var(--cardapio-highlight-from)] to-[var(--cardapio-highlight-to)] flex items-center justify-center shadow-lg shadow-[var(--cardapio-warning)]/25"
			>
				<Icon
					name="lucide:star"
					class="w-4 h-4 sm:w-5 sm:h-5 fill-current"
					:style="{ color: 'var(--cardapio-highlight-text)' }"
				/>
				<!-- Brilho animado -->
				<div
					class="absolute inset-0 rounded-xl bg-white/30 animate-ping opacity-0"
					style="animation-duration: 2s"
				/>
			</div>
			<div>
				<h3 class="text-xl sm:text-2xl font-bold text-[var(--cardapio-text)]">Mais Vendidos</h3>
				<p class="text-xs sm:text-sm text-[var(--cardapio-text-muted)]">
					Os favoritos dos clientes
				</p>
			</div>
		</div>

		<!-- Lista de produtos -->
		<div class="space-y-3">
			<CardapioProdutoCard v-for="produto in destaques" :key="produto.id" :produto="produto" />
		</div>
	</section>
</template>
