<script setup lang="ts">
/**
 * 📌 CardapioDestaquesLista
 *
 * Lista vertical de produtos em destaque (mais vendidos).
 */

import type { ProdutoPublico } from "~/features/public/cardapio/types/cardapio-publico";
import CardapioProdutoCard from "~/features/public/cardapio/components/CardapioProdutoCard.vue";

interface Props {
	destaques: readonly ProdutoPublico[] | ProdutoPublico[];
}

const props = defineProps<Props>();
</script>

<template>
	<section v-if="destaques.length" class="mb-4">
		<!-- Header -->
		<h3 class="text-2xl font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
			<Icon name="lucide:star" class="w-6 h-6 text-primary fill-current" />
			Mais Vendidos
		</h3>

		<!-- Lista vertical (cards separados) -->
		<div class="space-y-3">
			<div
				v-for="produto in destaques"
				:key="produto.id"
				class="bg-[var(--bg-surface)] rounded-xl shadow-sm overflow-hidden"
			>
				<CardapioProdutoCard :produto="produto" />
			</div>
		</div>
	</section>
</template>
