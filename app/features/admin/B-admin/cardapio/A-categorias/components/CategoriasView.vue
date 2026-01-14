<script setup lang="ts">
/**
 * 📌 CategoriasView - Orquestrador de Visualização de Categorias
 *
 * Alterna entre visualização em cards (grid) e lista (horizontal)
 * baseado no viewMode recebido do CardapioManager.
 */

import type { CategoriaComputada } from "../../../types/categoria";
import CategoriasCard from "./CategoriasCard.vue";
import CategoriasList from "./CategoriasList.vue";

interface Props {
	categorias: CategoriaComputada[];
	viewMode: "card" | "list";
	loading?: boolean;
}

interface Emits {
	select: [categoria: CategoriaComputada];
	viewMore: [categoria: CategoriaComputada];
	edit: [categoria: CategoriaComputada];
	delete: [categoria: CategoriaComputada];
	toggleStatus: [categoria: CategoriaComputada];
}

withDefaults(defineProps<Props>(), {
	loading: false,
});

const emit = defineEmits<Emits>();

/**
 * Handler para seleção de categoria
 */
const handleSelect = (categoria: CategoriaComputada): void => {
	emit("select", categoria);
};

/**
 * Handler para ver mais detalhes
 */
const handleViewMore = (categoria: CategoriaComputada): void => {
	emit("viewMore", categoria);
};

/**
 * Handler para editar
 */
const handleEdit = (categoria: CategoriaComputada): void => {
	emit("edit", categoria);
};

/**
 * Handler para excluir
 */
const handleDelete = (categoria: CategoriaComputada): void => {
	emit("delete", categoria);
};

/**
 * Handler para toggle status
 */
const handleToggleStatus = (categoria: CategoriaComputada): void => {
	emit("toggleStatus", categoria);
};
</script>

<template>
	<div class="categorias-view h-full flex flex-col">
		<!-- Modo Card (Grid) -->
		<div
			v-if="viewMode === 'card'"
			class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 py-4 overflow-y-auto flex-1 min-h-0 content-start"
		>
			<CategoriasCard
				v-for="categoria in categorias"
				:key="categoria.id"
				:categoria="categoria"
				@click="handleSelect"
				@view-more="handleViewMore"
			/>
		</div>

		<!-- Modo Lista (Horizontal) -->
		<div v-else class="space-y-3 py-4 overflow-y-auto flex-1 min-h-0">
			<CategoriasList
				v-for="categoria in categorias"
				:key="categoria.id"
				:categoria="categoria"
				@click="handleSelect"
				@view-more="handleViewMore"
				@edit="handleEdit"
				@delete="handleDelete"
				@toggle-status="handleToggleStatus"
			/>
		</div>
	</div>
</template>
