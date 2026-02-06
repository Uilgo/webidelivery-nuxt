<script setup lang="ts">
/**
 * 📌 CombosCard - Card de Combo
 *
 * Wrapper que usa o CardapioCard genérico com configuração específica para combos.
 */

import type { Combo } from "../../../types/combo";
import CardapioCard from "../../components/shared/CardapioCard.vue";

interface Props {
	combo: Combo;
	isSelected?: boolean;
}

interface Emits {
	"view-more": [combo: Combo];
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
 * Configuração do card para combos
 */
const cardConfig = computed(() => ({
	nameField: "nome",
	imageField: "imagem_url",
	statusField: "ativo",
	priceField: "preco_combo",
	secondaryInfo: {
		field: "economia_display",
		label: "",
		icon: "lucide:tag",
		format: () => economiaPercentual.value,
	},
	statusConfig: {
		activeValue: true,
		activeText: "Ativo",
		inactiveText: "Inativo",
		activeVariant: "success" as const,
		inactiveVariant: "warning" as const,
	},
}));

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
const handleClick = (item: Record<string, unknown>): void => {
	emit("view-more", item as unknown as Combo);
};

const handleViewMore = (item: Record<string, unknown>): void => {
	emit("view-more", item as unknown as Combo);
};
</script>

<template>
	<CardapioCard
		:item="comboWithEconomia as unknown as Record<string, unknown>"
		:config="cardConfig"
		:is-selected="isSelected"
		@click="handleClick"
		@view-more="handleViewMore"
	/>
</template>
