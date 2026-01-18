<script setup lang="ts">
/**
 * 📌 CategoriasList - Item de Lista de Categoria
 *
 * Wrapper que usa o CardapioList genérico com configuração específica para categorias.
 */

import type { CategoriaComputada } from "../../../types/categoria";
import CardapioList from "../../components/shared/CardapioList.vue";

interface Props {
	categoria: CategoriaComputada;
	isSelected?: boolean;
}

interface Emits {
	click: [categoria: CategoriaComputada];
	viewMore: [categoria: CategoriaComputada];
	edit: [categoria: CategoriaComputada];
	delete: [categoria: CategoriaComputada];
	toggleStatus: [categoria: CategoriaComputada];
}

withDefaults(defineProps<Props>(), {
	isSelected: false,
});

const emit = defineEmits<Emits>();

/**
 * Configuração da lista para categorias
 */
const listConfig = {
	nameField: "nome",
	descriptionField: "descricao",
	imageField: "imagem_url",
	statusField: "ativo",
	primaryInfo: {
		field: "produtos_count",
		label: "produtos",
		icon: "lucide:package",
	},
	secondaryInfo: {
		field: "ordem",
		label: "",
		icon: "lucide:arrow-up-down",
	},
	statusConfig: {
		activeValue: true,
		activeText: "Ativa",
		inactiveText: "Inativa",
		activeVariant: "success" as const,
		inactiveVariant: "warning" as const,
	},
};

/**
 * Handlers
 */
const handleClick = (item: Record<string, unknown>): void => {
	emit("click", item as unknown as CategoriaComputada);
};

const handleViewMore = (item: Record<string, unknown>): void => {
	emit("viewMore", item as unknown as CategoriaComputada);
};

const handleEdit = (item: Record<string, unknown>): void => {
	emit("edit", item as unknown as CategoriaComputada);
};

const handleDelete = (item: Record<string, unknown>): void => {
	emit("delete", item as unknown as CategoriaComputada);
};

const handleToggleStatus = (item: Record<string, unknown>): void => {
	emit("toggleStatus", item as unknown as CategoriaComputada);
};
</script>

<template>
	<div class="categoria-list-wrapper">
		<CardapioList
			:item="categoria as unknown as Record<string, unknown>"
			:config="listConfig"
			:is-selected="isSelected"
			@click="handleClick"
			@view-more="handleViewMore"
			@edit="handleEdit"
			@delete="handleDelete"
			@toggle-status="handleToggleStatus"
		/>
	</div>
</template>
