<script setup lang="ts">
/**
 * 📌 PedidoViewToggle
 *
 * Toggle entre visualização em cards e lista usando UiButton.
 */

import type { ModoVisualizacao } from "~/features/admin/pedidos/types/pedidos-admin";

interface Props {
	modelValue: ModoVisualizacao;
}

interface Emits {
	"update:modelValue": [value: ModoVisualizacao];
}

defineProps<Props>();
const emit = defineEmits<Emits>();

/**
 * Alterna modo de visualização
 */
const alternarModo = (modo: ModoVisualizacao) => {
	emit("update:modelValue", modo);
};
</script>

<template>
	<div class="flex items-center gap-1 p-1 rounded-lg bg-[var(--bg-muted)]">
		<UiButton
			:variant="modelValue === 'cards' ? 'soft' : 'ghost'"
			:color="modelValue === 'cards' ? 'primary' : 'neutral'"
			size="sm"
			icon="lucide:layout-grid"
			@click="alternarModo('cards')"
		/>
		<UiButton
			:variant="modelValue === 'lista' ? 'soft' : 'ghost'"
			:color="modelValue === 'lista' ? 'primary' : 'neutral'"
			size="sm"
			icon="lucide:list"
			@click="alternarModo('lista')"
		/>
	</div>
</template>
