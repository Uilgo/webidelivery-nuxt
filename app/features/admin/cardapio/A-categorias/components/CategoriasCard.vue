<script setup lang="ts">
/**
 * 📌 CategoriasCard - Card de Categoria
 *
 * Wrapper que usa o CardapioCard genérico com configuração específica para categorias.
 */

import type { CategoriaComputada } from "../../../types/categoria";
import CardapioCard from "../../components/shared/CardapioCard.vue";

interface Props {
	categoria: CategoriaComputada;
	isSelected?: boolean;
}

interface Emits {
	click: [categoria: CategoriaComputada];
	viewMore: [categoria: CategoriaComputada];
}

withDefaults(defineProps<Props>(), {
	isSelected: false,
});

const emit = defineEmits<Emits>();

/**
 * Configuração do card para categorias
 */
const cardConfig = {
	nameField: "nome",
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
</script>

<template>
	<CardapioCard
		:item="categoria as unknown as Record<string, unknown>"
		:config="cardConfig"
		:is-selected="isSelected"
		@click="handleClick"
		@view-more="handleViewMore"
	/>
</template>
