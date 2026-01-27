<script setup lang="ts">
/**
 * 📌 CardapioSkeleton
 *
 * Skeleton loader para o cardápio público.
 * Replica a estrutura visual da página enquanto os dados carregam.
 */
</script>

<template>
	<div class="min-h-screen bg-[var(--cardapio-background)]">
		<!-- Header Skeleton -->
		<div class="sticky top-0 z-40 px-4 pt-4 pb-2 bg-[var(--cardapio-background)]">
			<div class="max-w-3xl mx-auto bg-[var(--cardapio-surface)] rounded-xl shadow-md p-4">
				<div class="flex items-center gap-4">
					<!-- Logo -->
					<UiSkeleton class="w-16 h-16 rounded-full flex-shrink-0" />

					<!-- Info -->
					<div class="flex-1 min-w-0">
						<UiSkeleton class="h-6 w-48 mb-2" />
						<UiSkeleton class="h-4 w-32 mb-2" />
						<UiSkeleton class="h-6 w-24 rounded-full" />
					</div>
				</div>
			</div>
		</div>

		<!-- Banners Skeleton -->
		<div class="px-4 py-3 bg-[var(--cardapio-background)]">
			<div class="max-w-3xl mx-auto">
				<UiSkeleton class="h-28 w-full rounded-xl" />
			</div>
		</div>

		<!-- Categorias Skeleton -->
		<div class="sticky top-[72px] z-30 px-4 py-3 bg-[var(--cardapio-background)]">
			<div class="max-w-3xl mx-auto">
				<div class="flex gap-2 overflow-x-auto custom-scrollbar">
					<UiSkeleton v-for="i in 6" :key="i" class="h-10 w-32 rounded-full flex-shrink-0" />
				</div>
			</div>
		</div>

		<!-- Busca Skeleton -->
		<div class="px-4 py-3 bg-[var(--cardapio-background)]">
			<div class="max-w-3xl mx-auto flex gap-2">
				<UiSkeleton class="h-12 flex-1 rounded-lg" />
				<UiSkeleton class="h-12 w-12 rounded-lg flex-shrink-0" />
				<UiSkeleton class="h-12 w-12 rounded-lg flex-shrink-0" />
			</div>
		</div>

		<!-- Produtos Skeleton -->
		<div class="max-w-7xl mx-auto px-4 pb-24">
			<!-- Categoria 1 -->
			<div class="mb-8">
				<UiSkeleton class="h-7 w-40 mb-4" />
				<div class="space-y-4">
					<div
						v-for="i in 3"
						:key="i"
						class="flex gap-4 p-4 bg-[var(--cardapio-surface)] rounded-lg border border-[var(--cardapio-muted)]"
					>
						<!-- Imagem -->
						<UiSkeleton class="w-24 h-24 rounded-lg flex-shrink-0" />

						<!-- Info -->
						<div class="flex-1 min-w-0">
							<UiSkeleton class="h-5 w-3/4 mb-2" />
							<UiSkeleton class="h-4 w-full mb-2" />
							<UiSkeleton class="h-4 w-2/3 mb-3" />
							<UiSkeleton class="h-6 w-24" />
						</div>
					</div>
				</div>
			</div>

			<!-- Categoria 2 -->
			<div class="mb-8">
				<UiSkeleton class="h-7 w-40 mb-4" />
				<div class="space-y-4">
					<div
						v-for="i in 2"
						:key="i"
						class="flex gap-4 p-4 bg-[var(--bg-surface)] rounded-lg border border-[var(--border-default)]"
					>
						<!-- Imagem -->
						<UiSkeleton class="w-24 h-24 rounded-lg flex-shrink-0" />

						<!-- Info -->
						<div class="flex-1 min-w-0">
							<UiSkeleton class="h-5 w-3/4 mb-2" />
							<UiSkeleton class="h-4 w-full mb-2" />
							<UiSkeleton class="h-4 w-2/3 mb-3" />
							<UiSkeleton class="h-6 w-24" />
						</div>
					</div>
				</div>
			</div>

			<!-- Categoria 3 -->
			<div class="mb-8">
				<UiSkeleton class="h-7 w-40 mb-4" />
				<div class="space-y-4">
					<div
						v-for="i in 3"
						:key="i"
						class="flex gap-4 p-4 bg-[var(--bg-surface)] rounded-lg border border-[var(--border-default)]"
					>
						<!-- Imagem -->
						<UiSkeleton class="w-24 h-24 rounded-lg flex-shrink-0" />

						<!-- Info -->
						<div class="flex-1 min-w-0">
							<UiSkeleton class="h-5 w-3/4 mb-2" />
							<UiSkeleton class="h-4 w-full mb-2" />
							<UiSkeleton class="h-4 w-2/3 mb-3" />
							<UiSkeleton class="h-6 w-24" />
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>
