<script setup lang="ts">
/**
 * 📌 CardapioProdutoLista
 *
 * Lista vertical de produtos agrupados por categoria.
 * Cada categoria tem seu título e lista de produtos.
 * Aplica filtros e ordenação aos produtos.
 */

import type { CategoriaPublica, ProdutoPublico } from "../types/cardapio-publico";
import CardapioProdutoItem from "./CardapioProdutoItem.vue";

interface Props {
	categorias: CategoriaPublica[];
	termoBusca: string;
	ordenacao: string;
	filtros: { destaque: boolean; promocao: boolean };
}

interface Emits {
	(e: "selecionarProduto", produto: ProdutoPublico): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

/**
 * Filtra e ordena produtos
 */
const categoriasFiltradas = computed(() => {
	let categorias = props.categorias;

	// 1. Filtrar por termo de busca
	if (props.termoBusca.trim()) {
		const termo = props.termoBusca.toLowerCase().trim();
		categorias = categorias
			.map((cat) => ({
				...cat,
				produtos: cat.produtos.filter(
					(p) => p.nome.toLowerCase().includes(termo) || p.descricao?.toLowerCase().includes(termo),
				),
			}))
			.filter((cat) => cat.produtos.length > 0);
	}

	// 2. Aplicar filtros
	if (props.filtros.destaque || props.filtros.promocao) {
		categorias = categorias
			.map((cat) => ({
				...cat,
				produtos: cat.produtos.filter((p) => {
					if (props.filtros.destaque && !p.destaque) return false;
					if (props.filtros.promocao && !p.em_promocao) return false;
					return true;
				}),
			}))
			.filter((cat) => cat.produtos.length > 0);
	}

	// 3. Aplicar ordenação
	categorias = categorias.map((cat) => {
		const produtosOrdenados = [...cat.produtos];

		switch (props.ordenacao) {
			case "menor-preco":
				produtosOrdenados.sort((a, b) => {
					const precoA = a.variacoes[0]?.preco_promocional ?? a.variacoes[0]?.preco ?? 0;
					const precoB = b.variacoes[0]?.preco_promocional ?? b.variacoes[0]?.preco ?? 0;
					return precoA - precoB;
				});
				break;

			case "maior-preco":
				produtosOrdenados.sort((a, b) => {
					const precoA = a.variacoes[0]?.preco_promocional ?? a.variacoes[0]?.preco ?? 0;
					const precoB = b.variacoes[0]?.preco_promocional ?? b.variacoes[0]?.preco ?? 0;
					return precoB - precoA;
				});
				break;

			case "a-z":
				produtosOrdenados.sort((a, b) => a.nome.localeCompare(b.nome));
				break;

			case "z-a":
				produtosOrdenados.sort((a, b) => b.nome.localeCompare(a.nome));
				break;

			// "padrao" mantém a ordem original
		}

		return {
			...cat,
			produtos: produtosOrdenados,
		};
	});

	return categorias;
});

/**
 * Verifica se não há resultados
 */
const semResultados = computed(() => {
	return categoriasFiltradas.value.length === 0;
});

/**
 * Mensagem de estado vazio
 */
const mensagemVazio = computed(() => {
	if (props.termoBusca.trim()) {
		return `Não encontramos produtos para "${props.termoBusca}"`;
	}
	if (props.filtros.destaque || props.filtros.promocao) {
		return "Nenhum produto encontrado com os filtros selecionados";
	}
	return "Nenhum produto disponível";
});
</script>

<template>
	<div class="max-w-3xl mx-auto pb-24">
		<!-- Estado vazio (busca sem resultados) -->
		<UiEmptyState
			v-if="semResultados"
			icon="lucide:search-x"
			title="Nenhum produto encontrado"
			:description="mensagemVazio"
		/>

		<!-- Lista de categorias com produtos -->
		<div v-else>
			<section
				v-for="categoria in categoriasFiltradas"
				:key="categoria.id"
				:id="`categoria-${categoria.id}`"
				class="scroll-mt-36"
			>
				<!-- Título da categoria -->
				<div
					class="px-4 py-3 bg-[var(--bg-muted)] border-b border-[var(--border-default)] sticky top-[124px] z-20"
				>
					<h2 class="font-semibold text-[var(--text-primary)]">{{ categoria.nome }}</h2>
					<p v-if="categoria.descricao" class="text-sm text-[var(--text-muted)]">
						{{ categoria.descricao }}
					</p>
				</div>

				<!-- Lista de produtos -->
				<div class="bg-[var(--bg-surface)]">
					<CardapioProdutoItem
						v-for="produto in categoria.produtos"
						:key="produto.id"
						:produto="produto"
						@click="emit('selecionarProduto', produto)"
					/>
				</div>
			</section>
		</div>
	</div>
</template>
