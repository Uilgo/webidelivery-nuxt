<script setup lang="ts">
/**
 * 📌 CategoriasView - Orquestrador de Visualização de Categorias
 *
 * Alterna entre visualização em cards (grid) e lista (horizontal)
 * baseado no viewMode recebido do CardapioManager.
 */

import type { CategoriaComputada } from "../../../types/categoria";
import CategoriasCard from "./CategoriasCard.vue";
import CategoriasListHierarchy from "./CategoriasListHierarchy.vue";

interface Props {
	categorias: CategoriaComputada[];
	categoriasRaw: CategoriaComputada[]; // Array sem filtros para subcategorias
	viewMode: "card" | "list";
	loading?: boolean;
}

interface Emits {
	select: [categoria: CategoriaComputada];
	viewMore: [categoria: CategoriaComputada];
	edit: [categoria: CategoriaComputada];
	delete: [categoria: CategoriaComputada];
	toggleStatus: [categoria: CategoriaComputada];
	// Eventos para subcategorias
	createSubcategoria: [categoriaPaiId: string];
	editSubcategoria: [subcategoriaId: string, categoriaPaiId: string];
	deleteSubcategoria: [subcategoriaId: string, categoriaPaiId: string];
	toggleSubcategoriaStatus: [subcategoriaId: string, ativo: boolean, categoriaPaiId: string];
}

const props = withDefaults(defineProps<Props>(), {
	loading: false,
});

const emit = defineEmits<Emits>();

// Estado de expansão (apenas para modo lista)
const expandedId = ref<string | null>(null);

/**
 * Handler para toggle de expansão
 */
const handleToggleExpansion = (categoriaId: string | null): void => {
	expandedId.value = categoriaId;
};

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

/**
 * Handlers para subcategorias
 */
const handleCreateSubcategoria = (categoriaPaiId: string): void => {
	emit("createSubcategoria", categoriaPaiId);
};

const handleEditSubcategoria = (subcategoriaId: string, categoriaPaiId: string): void => {
	emit("editSubcategoria", subcategoriaId, categoriaPaiId);
};

const handleDeleteSubcategoria = (subcategoriaId: string, categoriaPaiId: string): void => {
	emit("deleteSubcategoria", subcategoriaId, categoriaPaiId);
};

const handleToggleSubcategoriaStatus = (
	subcategoriaId: string,
	ativo: boolean,
	categoriaPaiId: string,
): void => {
	emit("toggleSubcategoriaStatus", subcategoriaId, ativo, categoriaPaiId);
};

/**
 * Filtra apenas categorias pai (sem categoria_pai_id) e adiciona suas subcategorias
 * IMPORTANTE: Usa categoriasRaw para subcategorias (sem filtro de ativo),
 * mas usa categorias filtradas para as categorias pai
 */
const categoriasPai = computed(() => {
	// Categorias pai já vêm filtradas (respeitam filtro de ativo)
	const pais = props.categorias.filter((cat) => !cat.categoria_pai_id);

	// Subcategorias vêm do array RAW (sem filtro) para sempre exibir todas
	const subcategorias = props.categoriasRaw.filter((cat) => cat.categoria_pai_id);

	// Monta hierarquia: cada pai recebe TODAS suas subcategorias (ativas e inativas)
	return pais.map((pai) => ({
		...pai,
		subcategorias: subcategorias.filter((sub) => sub.categoria_pai_id === pai.id),
	}));
});
</script>

<template>
	<div class="categorias-view h-full flex flex-col overflow-x-hidden">
		<!-- Modo Card (Grid) -->
		<div
			v-if="viewMode === 'card'"
			class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 py-4 overflow-y-auto overflow-x-hidden flex-1 min-h-0 content-start"
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
		<div v-else class="space-y-3 py-4 overflow-y-auto overflow-x-hidden flex-1 min-h-0">
			<CategoriasListHierarchy
				v-for="categoria in categoriasPai"
				:key="categoria.id"
				:categoria="categoria"
				:is-expanded="expandedId === categoria.id"
				@click="handleSelect"
				@view-more="handleViewMore"
				@edit="handleEdit"
				@delete="handleDelete"
				@toggle-status="handleToggleStatus"
				@create-subcategoria="handleCreateSubcategoria"
				@edit-subcategoria="handleEditSubcategoria"
				@delete-subcategoria="handleDeleteSubcategoria"
				@toggle-subcategoria-status="handleToggleSubcategoriaStatus"
				@toggle-expansion="handleToggleExpansion"
			/>
		</div>
	</div>
</template>
