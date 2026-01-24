<script setup lang="ts">
/**
 * 📌 MarketingStats
 *
 * Componente que exibe estatísticas gerais do marketing.
 * Mostra contadores de cupons e banners.
 */

interface Props {
	cuponsCount?: number;
	bannersCount?: number;
}

const props = withDefaults(defineProps<Props>(), {
	cuponsCount: 0,
	bannersCount: 0,
});

// Usar props para evitar warning de variável não utilizada
const { cuponsCount, bannersCount } = toRefs(props);
</script>

<template>
	<div class="w-full">
		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			<!-- Card Cupons -->
			<UiCard class="cupons-card">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm font-medium text-gray-600 dark:text-gray-400">Cupons</p>
						<p class="text-2xl font-bold text-gray-900 dark:text-white">{{ cuponsCount }}</p>
					</div>
					<div class="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
						<Icon name="lucide:ticket" class="w-6 h-6 text-blue-600 dark:text-blue-400" />
					</div>
				</div>
			</UiCard>

			<!-- Card Banners -->
			<UiCard class="banners-card">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm font-medium text-gray-600 dark:text-gray-400">Banners</p>
						<p class="text-2xl font-bold text-gray-900 dark:text-white">{{ bannersCount }}</p>
					</div>
					<div class="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-full">
						<Icon name="lucide:image" class="w-6 h-6 text-purple-600 dark:text-purple-400" />
					</div>
				</div>
			</UiCard>
		</div>
	</div>
</template>
