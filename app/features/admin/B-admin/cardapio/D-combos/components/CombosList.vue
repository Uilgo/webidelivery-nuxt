<script setup lang="ts">
/**
 * 📌 CombosList - Item de Lista de Combo
 *
 * Wrapper que usa o CardapioList genérico com configuração específica para combos.
 */

import type { Combo } from "../../../types/combo";
import CardapioList from "../../components/shared/CardapioList.vue";

interface Props {
	combo: Combo;
	isSelected?: boolean;
}

interface Emits {
	"toggle-status": [id: string, ativo: boolean];
	edit: [combo: Combo];
	delete: [id: string];
}

const props = withDefaults(defineProps<Props>(), {
	isSelected: false,
});

const emit = defineEmits<Emits>();

/**
 * Calcular economia do combo em percentual
 */
const economiaPercentual = computed(() => {
	const economiaValor = props.combo.preco_original - props.combo.preco_combo;
	const percentual = (economiaValor / props.combo.preco_original) * 100;
	return `${percentual.toFixed(0)}% OFF`;
});

/**
 * Configuração da lista para combos
 */
const listConfig = {
	nameField: "nome",
	descriptionField: "descricao",
	imageField: "imagem_url",
	statusField: "ativo",
	priceField: "preco_combo",
	primaryInfo: {
		field: "preco_display",
		label: "",
		icon: "lucide:tag",
		format: () => {
			const precoOriginal = Number(props.combo.preco_original).toFixed(2).replace(".", ",");
			const precoCombo = Number(props.combo.preco_combo).toFixed(2).replace(".", ",");
			return `De R$ ${precoOriginal} por R$ ${precoCombo}`;
		},
	},
	secondaryInfo: {
		field: "economia_display",
		label: "",
		icon: "lucide:sparkles",
		format: () => economiaPercentual.value,
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
 * Item com campo de economia calculado
 */
const comboWithEconomia = computed(() => ({
	...props.combo,
	economia_display: economiaPercentual.value,
}));

/**
 * Handlers
 */
const handleClick = (_item: Record<string, unknown>): void => {
	// No modo lista, o click não faz nada
};

const handleViewMore = (_item: Record<string, unknown>): void => {
	// Não usado no modo lista
};

const handleEdit = (item: Record<string, unknown>): void => {
	emit("edit", item as unknown as Combo);
};

const handleDelete = (item: Record<string, unknown>): void => {
	const combo = item as unknown as Combo;
	emit("delete", combo.id);
};

const handleToggleStatus = (item: Record<string, unknown>): void => {
	const combo = item as unknown as Combo;
	emit("toggle-status", combo.id, !combo.ativo);
};
</script>

<template>
	<div class="combo-list-wrapper">
		<CardapioList
			:item="comboWithEconomia as unknown as Record<string, unknown>"
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
