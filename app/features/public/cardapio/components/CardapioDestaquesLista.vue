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
			<!-- Ícone com animação de brilho (Estilo Premium Igual Ofertas) -->
			<div
				class="size-10 sm:size-11 md:size-12 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center shadow-lg shadow-rose-500/25"
			>
				<Icon
					name="lucide:star"
					class="w-5 h-5 sm:w-5.5 sm:h-5.5 md:w-6 md:h-6 text-white fill-current"
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
