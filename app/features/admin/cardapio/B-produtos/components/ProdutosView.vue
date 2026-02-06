<script setup lang="ts">
/**
 * 📌 ProdutosView - Orquestrador de Visualização de Produtos
 *
 * Alterna entre visualização em cards (grid) e lista (horizontal)
 * baseado no viewMode recebido do CardapioManager.
 */

import type { ProdutoComputado } from "../../../types/produto";
import ProdutosCard from "./ProdutosCard.vue";
import ProdutosList from "./ProdutosList.vue";

interface Props {
	produtos: ProdutoComputado[];
	viewMode: "card" | "list";
	loading?: boolean;
}

interface Emits {
	select: [produto: ProdutoComputado];
	viewMore: [produto: ProdutoComputado];
	edit: [produto: ProdutoComputado];
	delete: [produto: ProdutoComputado];
	toggleStatus: [produto: ProdutoComputado];
}

withDefaults(defineProps<Props>(), {
	loading: false,
});

const emit = defineEmits<Emits>();

/**
 * Handler para seleção de produto
 */
const handleSelect = (produto: ProdutoComputado): void => {
	emit("select", produto);
};

/**
 * Handler para ver mais detalhes
 */
const handleViewMore = (produto: ProdutoComputado): void => {
	emit("viewMore", produto);
};

/**
 * Handler para editar
 */
const handleEdit = (produto: ProdutoComputado): void => {
	emit("edit", produto);
};

/**
 * Handler para excluir
 */
const handleDelete = (produto: ProdutoComputado): void => {
	emit("delete", produto);
};

/**
 * Handler para toggle status
 */
const handleToggleStatus = (produto: ProdutoComputado): void => {
	emit("toggleStatus", produto);
};
</script>

<template>
	<div class="produtos-view h-full flex flex-col overflow-x-hidden">
		<!-- Modo Card (Grid) -->
		<div
			v-if="viewMode === 'card'"
			class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 py-4 overflow-y-auto overflow-x-hidden flex-1 min-h-0 content-start"
		>
			<ProdutosCard
				v-for="produto in produtos"
				:key="produto.id"
				:produto="produto"
				@click="handleSelect"
				@view-more="handleViewMore"
			/>
		</div>

		<!-- Modo Lista (Horizontal) -->
		<div v-else class="space-y-3 py-4 overflow-y-auto overflow-x-hidden flex-1 min-h-0">
			<ProdutosList
				v-for="produto in produtos"
				:key="produto.id"
				:produto="produto"
				@click="handleSelect"
				@view-more="handleViewMore"
				@edit="handleEdit"
				@delete="handleDelete"
				@toggle-status="handleToggleStatus"
			/>
		</div>
	</div>
</template>
