<script setup lang="ts">
/**
 * 📌 CardapioCardSkeleton - Skeleton para CardapioCard
 *
 * Skeleton loader para o modo card (grid view).
 * Simula a estrutura visual do CardapioCard usando UiSkeleton.
 */
</script>

<template>
	<div
		class="flex flex-col gap-3 p-4 bg-[var(--card-bg)] rounded-lg border border-[var(--card-border)] shadow-[var(--card-shadow)]"
	>
		<!-- Imagem Skeleton -->
		<UiSkeleton class="aspect-[4/3] w-full" />

		<!-- Conteúdo Skeleton -->
		<div class="flex-1 flex flex-col justify-between gap-3">
			<!-- Cabeçalho -->
			<div class="space-y-2">
				<!-- Nome e Badge -->
				<div class="flex items-start justify-between gap-2">
					<UiSkeleton class="h-5 w-3/4" />
					<UiSkeleton class="h-6 w-16" />
				</div>

				<!-- Infos -->
				<div class="flex items-center justify-between gap-2">
					<UiSkeleton class="h-4 w-1/2" />
					<UiSkeleton class="h-5 w-20" />
				</div>
			</div>

			<!-- Botão -->
			<UiSkeleton class="h-9 w-full" />
		</div>
	</div>
</template>
