<script setup lang="ts">
/**
 * 📌 ProdutosCard - Card de Produto para Grid View
 *
 * Wrapper que usa o CardapioCard genérico com configuração específica para produtos.
 */

import type { ProdutoComputado } from "../../../types/produto";
import CardapioCard from "../../components/shared/CardapioCard.vue";

interface Props {
	produto: ProdutoComputado;
}

interface Emits {
	click: [produto: ProdutoComputado];
	viewMore: [produto: ProdutoComputado];
}

defineProps<Props>();
const emit = defineEmits<Emits>();

/**
 * Configuração do card para produtos
 */
const cardConfig = {
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
	badges: [] as Array<{ condition: (item: unknown) => boolean; text: string; variant: string }>,
};

// Adicionar badges condicionais
cardConfig.badges.push(
	{
		condition: (item: unknown) => (item as ProdutoComputado).destaque === true,
		text: "Destaque",
		variant: "primary",
	},
	{
		condition: (item: unknown) => (item as ProdutoComputado).em_promocao === true,
		text: "Promoção",
		variant: "warning",
	},
);

/**
 * Handlers
 */
const handleClick = (item: Record<string, unknown>): void => {
	emit("click", item as unknown as ProdutoComputado);
};

const handleViewMore = (item: Record<string, unknown>): void => {
	emit("viewMore", item as unknown as ProdutoComputado);
};
</script>

<template>
	<CardapioCard
		:item="produto as unknown as Record<string, unknown>"
		:config="cardConfig"
		@click="handleClick"
		@view-more="handleViewMore"
	/>
</template>
