<script setup lang="ts">
/**
 * 📌 CardapioProdutosLista
 *
 * Lista vertical de produtos com infinite scroll.
 * Carrega produtos progressivamente conforme o usuário rola a página.
 */

import type { ProdutoPublico } from "~/features/public/cardapio/types/cardapio-publico";
import CardapioProdutoCard from "~/features/public/cardapio/components/CardapioProdutoCard.vue";
import { useInfiniteScroll } from "~/features/public/cardapio/composables/useInfiniteScroll";

interface Props {
	produtos: readonly ProdutoPublico[] | ProdutoPublico[];
	loading: boolean;
	hasMore: boolean;
}

interface Emits {
	(e: "loadMore"): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Refs para infinite scroll
const loadingRef = toRef(props, "loading");
const hasMoreRef = toRef(props, "hasMore");

// Configura infinite scroll apenas uma vez
onMounted(() => {
	useInfiniteScroll({
		offset: 300,
		onLoadMore: () => emit("loadMore"),
		hasMore: hasMoreRef,
		loading: loadingRef,
	});
});
</script>

<template>
	<div>
		<!-- Lista vertical de Produtos (cards separados) -->
		<div v-if="produtos.length > 0" class="space-y-3 mb-8">
			<div
				v-for="produto in produtos"
				:key="produto.id"
				class="bg-[var(--cardapio-surface)] rounded-xl shadow-sm overflow-hidden"
			>
				<CardapioProdutoCard :produto="produto" />
			</div>
		</div>

		<!-- Loading Skeleton -->
		<div v-if="loading" class="space-y-3">
			<div
				v-for="i in 3"
				:key="`skeleton-${i}`"
				class="bg-[var(--cardapio-surface)] rounded-xl shadow-sm overflow-hidden p-4 animate-pulse"
			>
				<div class="flex gap-3">
					<div class="flex-1">
						<div class="h-4 bg-[var(--cardapio-muted)] rounded w-3/4 mb-2"></div>
						<div class="h-3 bg-[var(--cardapio-muted)] rounded w-full mb-1"></div>
						<div class="h-3 bg-[var(--cardapio-muted)] rounded w-2/3"></div>
					</div>
					<div class="w-24 h-24 bg-[var(--cardapio-muted)] rounded-lg"></div>
				</div>
			</div>
		</div>

		<!-- Fim da Lista -->
		<div v-if="!hasMore && produtos.length > 0" class="text-center py-8">
			<p class="text-[var(--cardapio-text-muted)] flex items-center justify-center gap-2">
				<Icon name="lucide:check-circle" class="w-5 h-5 text-green-500" />
				Você viu todos os produtos!
			</p>
		</div>

		<!-- Estado Vazio -->
		<div v-if="!loading && produtos.length === 0" class="text-center py-12">
			<Icon
				name="lucide:package-x"
				class="w-16 h-16 text-[var(--cardapio-text-muted)] mx-auto mb-4"
			/>
			<p class="text-[var(--cardapio-text-muted)]">Nenhum produto encontrado.</p>
		</div>
	</div>
</template>
