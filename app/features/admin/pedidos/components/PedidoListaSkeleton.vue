<script setup lang="ts">
/**
 * 📌 PedidoListaSkeleton
 *
 * Skeleton loader para o item de pedido no modo lista.
 */
</script>

<template>
	<div
		class="flex items-center gap-4 p-4 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg"
	>
		<!-- Número -->
		<div class="flex-shrink-0 w-16">
			<UiSkeleton class="h-6 w-12" />
		</div>

		<!-- Cliente com Badge -->
		<div class="flex items-center gap-3 flex-shrink-0">
			<div>
				<UiSkeleton class="h-4 w-32 mb-1" />
				<UiSkeleton class="h-3 w-28" />
			</div>
			<UiSkeleton class="h-6 w-20" />
		</div>

		<!-- Spacer -->
		<div class="flex-1"></div>

		<!-- Informações -->
		<div class="hidden md:flex items-center gap-4 flex-shrink-0">
			<UiSkeleton class="h-3 w-16" />
			<UiSkeleton class="h-3 w-12" />
			<UiSkeleton class="h-3 w-8" />
		</div>

		<!-- Total e Tempo -->
		<div class="flex-shrink-0 w-32 text-right">
			<UiSkeleton class="h-5 w-20 ml-auto mb-1" />
			<UiSkeleton class="h-3 w-16 ml-auto" />
		</div>

		<!-- Botão -->
		<div class="flex-shrink-0">
			<UiSkeleton class="h-8 w-24" />
		</div>
	</div>
</template>
