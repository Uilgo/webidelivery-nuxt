<script setup lang="ts">
/**
 * 📌 CardapioListSkeleton - Skeleton para CardapioList
 *
 * Skeleton loader para o modo lista (list view).
 * Simula a estrutura visual do CardapioList usando UiSkeleton.
 */
</script>

<template>
	<div class="px-1">
		<div
			class="flex items-center gap-4 p-3.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)]"
		>
			<!-- Imagem Skeleton -->
			<UiSkeleton class="w-16 h-16 shrink-0" />

			<!-- Conteúdo Skeleton -->
			<div class="flex-1 min-w-0 flex flex-col gap-2">
				<!-- Nome -->
				<UiSkeleton class="h-5 w-2/3" />

				<!-- Descrição -->
				<UiSkeleton class="h-4 w-full" />

				<!-- Infos -->
				<div class="flex items-center gap-3">
					<UiSkeleton class="h-4 w-24" />
					<UiSkeleton class="h-4 w-20" />
				</div>
			</div>

			<!-- Ações Skeleton -->
			<div class="flex items-center gap-4 shrink-0">
				<!-- Preço -->
				<UiSkeleton class="h-5 w-20" />

				<!-- Toggle + Badge -->
				<div class="flex items-center gap-3">
					<UiSkeleton class="h-6 w-11 rounded-full" />
					<UiSkeleton class="h-8 w-[70px]" />
				</div>

				<!-- Separador -->
				<div class="h-8 w-px bg-[var(--border-default)]"></div>

				<!-- Botões -->
				<div class="flex items-center gap-0.5">
					<UiSkeleton class="h-8 w-8" />
					<UiSkeleton class="h-8 w-8" />
				</div>
			</div>
		</div>
	</div>
</template>
