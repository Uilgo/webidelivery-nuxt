<script setup lang="ts">
/**
 * 📌 CardapioOfertasScroll
 *
 * Container de scroll horizontal para ofertas imperdíveis.
 * Exibe combos e produtos em promoção.
 */

import type { ProdutoPublico } from "~/features/public/cardapio/types/cardapio-publico";
import CardapioOfertaCard from "~/features/public/cardapio/components/CardapioOfertaCard.vue";

interface Props {
	ofertas: readonly ProdutoPublico[] | ProdutoPublico[];
}

const props = defineProps<Props>();
</script>

<template>
	<section v-if="ofertas.length" class="mb-4">
		<!-- Header -->
		<div class="flex items-center justify-between mb-4">
			<h3 class="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
				<Icon name="lucide:flame" class="w-5 h-5 text-primary" />
				Ofertas Imperdíveis
			</h3>
			<NuxtLink to="#" class="text-primary text-sm font-bold hover:underline"> Ver tudo </NuxtLink>
		</div>

		<!-- Scroll Horizontal -->
		<div class="relative">
			<div class="flex overflow-x-auto gap-4 pb-4 hide-scroll snap-x snap-mandatory">
				<CardapioOfertaCard
					v-for="oferta in ofertas"
					:key="oferta.id"
					:produto="oferta"
					class="snap-start"
				/>
			</div>
		</div>
	</section>
</template>

<style scoped>
.hide-scroll::-webkit-scrollbar {
	display: none;
}

.hide-scroll {
	-ms-overflow-style: none;
	scrollbar-width: none;
}
</style>
