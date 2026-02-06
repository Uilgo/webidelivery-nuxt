<script setup lang="ts">
/**
 * 📌 PedidoCardSkeleton
 *
 * Skeleton loader para o card de pedido no modo grid.
 */
</script>

<template>
	<UiCard variant="outlined" size="sm" class="w-full">
		<!-- Header -->
		<template #header>
			<div class="flex items-center justify-between">
				<UiSkeleton class="h-6 w-12" />
				<UiSkeleton class="h-6 w-20" />
			</div>
		</template>

		<!-- Conteúdo -->
		<div class="space-y-2">
			<!-- Cliente -->
			<div>
				<UiSkeleton class="h-4 w-32 mb-1" />
				<UiSkeleton class="h-3 w-28" />
			</div>

			<!-- Informações -->
			<div class="flex items-center gap-3">
				<UiSkeleton class="h-3 w-16" />
				<UiSkeleton class="h-3 w-12" />
			</div>

			<!-- Itens -->
			<UiSkeleton class="h-3 w-14" />

			<!-- Tempo e Total -->
			<div class="pt-2 border-t border-[var(--border-muted)]">
				<div class="flex items-center justify-between">
					<UiSkeleton class="h-3 w-20" />
					<UiSkeleton class="h-5 w-20" />
				</div>
			</div>
		</div>

		<!-- Footer -->
		<template #footer>
			<UiSkeleton class="h-8 w-full" />
		</template>
	</UiCard>
</template>
