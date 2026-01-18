<script setup lang="ts">
/**
 * 📌 ProdutosList - Item de Lista de Produto
 *
 * Wrapper que usa o CardapioList genérico com configuração específica para produtos.
 */

import type { ProdutoComputado } from "../../../types/produto";
import CardapioList from "../../components/shared/CardapioList.vue";

interface Props {
	produto: ProdutoComputado;
	isSelected?: boolean;
}

interface Emits {
	click: [produto: ProdutoComputado];
	viewMore: [produto: ProdutoComputado];
	edit: [produto: ProdutoComputado];
	delete: [produto: ProdutoComputado];
	toggleStatus: [produto: ProdutoComputado];
}

withDefaults(defineProps<Props>(), {
	isSelected: false,
});

const emit = defineEmits<Emits>();

/**
 * Configuração da lista para produtos
 */
const listConfig = {
	nameField: "nome",
	descriptionField: "descricao",
	imageField: "imagem_url",
	statusField: "ativo",
	categoryField: "categoria_nome",
	primaryInfo: {
		field: "total_vendas",
		label: "vendas",
		icon: "lucide:shopping-cart",
	},
	secondaryInfo: {
		field: "variacoes_count",
		label: "variações",
		icon: "lucide:layers",
	},
	statusConfig: {
		activeValue: true,
		activeText: "Ativo",
		inactiveText: "Inativo",
		activeVariant: "success" as const,
		inactiveVariant: "warning" as const,
	},
};

/**
 * Handlers
 */
const handleClick = (item: Record<string, unknown>): void => {
	emit("click", item as unknown as ProdutoComputado);
};

const handleViewMore = (item: Record<string, unknown>): void => {
	emit("viewMore", item as unknown as ProdutoComputado);
};

const handleEdit = (item: Record<string, unknown>): void => {
	emit("edit", item as unknown as ProdutoComputado);
};

const handleDelete = (item: Record<string, unknown>): void => {
	emit("delete", item as unknown as ProdutoComputado);
};

const handleToggleStatus = (item: Record<string, unknown>): void => {
	emit("toggleStatus", item as unknown as ProdutoComputado);
};
</script>

<template>
	<div class="produto-list-wrapper">
		<CardapioList
			:item="produto as unknown as Record<string, unknown>"
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
