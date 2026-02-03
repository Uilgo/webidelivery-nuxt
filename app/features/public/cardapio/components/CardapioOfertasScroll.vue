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
	<section v-if="ofertas.length" class="mb-5 sm:mb-6 md:mb-8">
		<!-- Header com estilo premium -->
		<div class="flex items-center justify-between mb-3 sm:mb-4 md:mb-5">
			<div class="flex items-center gap-2 sm:gap-2.5 md:gap-3">
				<!-- Ícone com background gradiente -->
				<div
					class="size-10 sm:size-11 md:size-12 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center shadow-lg shadow-rose-500/25"
				>
					<Icon name="lucide:flame" class="w-5 h-5 sm:w-5.5 sm:h-5.5 md:w-6 md:h-6 text-white" />
				</div>
				<div>
					<h3
						class="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-[var(--cardapio-text)] leading-tight"
					>
						Ofertas Imperdíveis
					</h3>
					<p class="text-xs sm:text-sm text-[var(--cardapio-text-muted)] mt-0.5">
						Promoções por tempo limitado
					</p>
				</div>
			</div>
			<NuxtLink
				to="#"
				class="text-xs sm:text-sm font-semibold text-[var(--cardapio-primary)] hover:text-[var(--cardapio-primary)] hover:opacity-80 transition-colors flex items-center gap-0.5 sm:gap-1"
			>
				<span class="hidden sm:inline">Ver tudo</span>
				<span class="sm:hidden">Ver</span>
				<Icon name="lucide:chevron-right" class="w-4 h-4" />
			</NuxtLink>
		</div>

		<div class="flex overflow-x-auto gap-3 sm:gap-4 pb-4 hide-scroll snap-x snap-mandatory">
			<CardapioOfertaCard
				v-for="oferta in ofertas"
				:key="oferta.id"
				:produto="oferta"
				class="snap-start"
			/>
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
