<script setup lang="ts">
/**
 * 📌 CardapioCapa
 *
 * Banner de capa do cardápio público.
 * Exibe a imagem de capa em largura total com toggle dark/light no canto.
 */

import type { Estabelecimento } from "~/features/public/cardapio/types/cardapio-publico";

interface Props {
	estabelecimento: Estabelecimento;
}

const props = defineProps<Props>();
</script>

<template>
	<div class="relative w-full overflow-hidden">
		<!-- Imagem de Capa (Largura Total) -->
		<div class="relative w-full h-[120px] sm:h-[180px] bg-[var(--bg-muted)] overflow-hidden">
			<img
				v-if="estabelecimento.capa"
				:src="estabelecimento.capa"
				:alt="`Capa de ${estabelecimento.nome}`"
				class="w-full h-full object-cover"
				loading="eager"
			/>
			<div v-else class="w-full h-full flex items-center justify-center text-[var(--text-muted)]">
				<Icon name="lucide:image" class="w-24 h-24" />
			</div>
			<div
				class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"
			></div>
		</div>
	</div>
</template>
