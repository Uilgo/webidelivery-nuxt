<script setup lang="ts">
/**
 * 📌 GruposAdicionaisCard - Card de Grupo de Adicionais
 *
 * Wrapper que usa o CardapioCard genérico com configuração específica para grupos de adicionais.
 */

import type { GrupoAdicionalComputado } from "../../../types/adicional";
import CardapioCard from "../../components/shared/CardapioCard.vue";

interface Props {
	grupoAdicional: GrupoAdicionalComputado;
	isSelected?: boolean;
}

interface Emits {
	click: [grupoAdicional: GrupoAdicionalComputado];
	viewMore: [grupoAdicional: GrupoAdicionalComputado];
}

withDefaults(defineProps<Props>(), {
	isSelected: false,
});

const emit = defineEmits<Emits>();

/**
 * Configuração do card para grupos de adicionais
 */
const cardConfig = {
	nameField: "nome",
	descriptionField: "descricao",
	imageField: "imagem_url",
	statusField: "ativo",
	primaryInfo: {
		field: "adicionais_count",
		label: "itens",
		icon: "lucide:list",
	},
	secondaryInfo: {
		field: "selecao_display",
		label: "",
		icon: "lucide:check-square",
	},
	statusConfig: {
		activeValue: true,
		activeText: "Ativo",
		inactiveText: "Inativo",
		activeVariant: "success" as const,
		inactiveVariant: "warning" as const,
	},
	badges: [
		{
			field: "obrigatorio_display",
			variant: "default" as const,
			condition: (item: Record<string, unknown>) => item.obrigatorio === true,
		},
	],
};

/**
 * Handlers
 */
const handleClick = (item: Record<string, unknown>): void => {
	emit("click", item as unknown as GrupoAdicionalComputado);
};

const handleViewMore = (item: Record<string, unknown>): void => {
	emit("viewMore", item as unknown as GrupoAdicionalComputado);
};
</script>

<template>
	<div class="grupo-adicional-card-wrapper">
		<CardapioCard
			:item="grupoAdicional as unknown as Record<string, unknown>"
			:config="cardConfig"
			:is-selected="isSelected"
			@click="handleClick"
			@view-more="handleViewMore"
		/>
	</div>
</template>
