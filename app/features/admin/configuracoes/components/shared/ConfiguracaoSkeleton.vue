<script setup lang="ts">
/**
 * 📌 ConfiguracaoSkeleton
 *
 * Loading state para cards de configuração.
 * Simula a estrutura de um ConfiguracaoCard durante carregamento.
 */

interface Props {
	/** Número de campos a exibir no skeleton */
	fields?: number;
}

withDefaults(defineProps<Props>(), {
	fields: 3,
});
</script>

<template>
	<UiCard class="p-6">
		<!-- Cabeçalho Skeleton -->
		<div class="flex items-start justify-between mb-6">
			<div class="flex-1">
				<div class="flex items-center gap-2 mb-2">
					<UiSkeleton class="w-5 h-5 rounded" />
					<UiSkeleton class="w-48 h-6 rounded" />
				</div>
				<UiSkeleton class="w-full max-w-md h-4 rounded" />
			</div>
		</div>

		<!-- Conteúdo Skeleton -->
		<div class="space-y-4">
			<div v-for="i in fields" :key="i" class="space-y-2">
				<UiSkeleton class="w-32 h-4 rounded" />
				<UiSkeleton class="w-full h-10 rounded" />
			</div>
		</div>

		<!-- Rodapé Skeleton -->
		<div
			class="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-[var(--border-muted)]"
		>
			<UiSkeleton class="w-32 h-10 rounded" />
		</div>
	</UiCard>
</template>
