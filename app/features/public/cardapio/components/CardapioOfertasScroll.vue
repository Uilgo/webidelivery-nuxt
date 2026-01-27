<script setup lang="ts">
/**
 * 📌 CardapioOfertasScroll
 *
 * Seção premium de ofertas imperdíveis.
 * Scroll horizontal com visual impactante.
 */

import type { ProdutoPublico } from "~/features/public/cardapio/types/cardapio-publico";
import CardapioOfertaCard from "~/features/public/cardapio/components/CardapioOfertaCard.vue";

interface Props {
	ofertas: readonly ProdutoPublico[] | ProdutoPublico[];
}

const props = defineProps<Props>();
</script>

<template>
	<section v-if="ofertas.length" class="mb-6 sm:mb-8">
		<!-- Header com estilo premium -->
		<div class="flex items-center justify-between mb-4 sm:mb-5">
			<div class="flex items-center gap-2 sm:gap-3">
				<!-- Ícone com background gradiente -->
				<div
					class="size-8 sm:size-10 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center shadow-lg shadow-rose-500/25"
				>
					<Icon name="lucide:flame" class="w-4 h-4 sm:w-5 sm:h-5 text-white" />
				</div>
				<div>
					<h3 class="text-lg sm:text-xl font-bold text-[var(--text-primary)]">
						Ofertas Imperdíveis
					</h3>
					<p class="text-xs sm:text-sm text-[var(--text-muted)]">Promoções por tempo limitado</p>
				</div>
			</div>
			<NuxtLink
				to="#"
				class="text-sm font-semibold text-[var(--primary)] hover:text-[var(--primary-dark,var(--primary))] transition-colors flex items-center gap-1"
			>
				Ver tudo
				<Icon name="lucide:chevron-right" class="w-4 h-4" />
			</NuxtLink>
		</div>

		<!-- Scroll Horizontal com fade -->
		<div class="relative -mx-2 sm:-mx-3 md:-mx-4">
			<div
				class="flex overflow-x-auto gap-3 sm:gap-4 pb-4 px-2 sm:px-3 md:px-4 hide-scroll snap-x snap-mandatory"
			>
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
