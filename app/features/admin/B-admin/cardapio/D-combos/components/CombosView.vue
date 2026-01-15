<script setup lang="ts">
/**
 * 📌 CombosView - Orquestrador de Visualização de Combos
 *
 * Alterna entre visualização em cards (grid) e lista (horizontal)
 * baseado no viewMode recebido do CardapioManager.
 */

import type { Combo } from "../../../types/combo";
import CombosCard from "./CombosCard.vue";
import CombosList from "./CombosList.vue";

interface Props {
	combos: Combo[];
	viewMode: "card" | "list";
	loading?: boolean;
}

interface Emits {
	"toggle-status": [id: string, ativo: boolean];
	edit: [combo: Combo];
	delete: [id: string];
	"view-more": [combo: Combo];
}

withDefaults(defineProps<Props>(), {
	loading: false,
});

const emit = defineEmits<Emits>();

/**
 * Handler para toggle de status
 */
const handleToggleStatus = (id: string, ativo: boolean): void => {
	emit("toggle-status", id, ativo);
};

/**
 * Handler para editar
 */
const handleEdit = (combo: Combo): void => {
	emit("edit", combo);
};

/**
 * Handler para ver mais detalhes
 */
const handleViewMore = (combo: Combo): void => {
	emit("view-more", combo);
};

/**
 * Handler para excluir
 */
const handleDelete = (id: string): void => {
	emit("delete", id);
};
</script>

<template>
	<div class="combos-view h-full flex flex-col overflow-x-hidden">
		<!-- Modo Card (Grid) -->
		<div
			v-if="viewMode === 'card'"
			class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 py-4 overflow-y-auto overflow-x-hidden flex-1 min-h-0 content-start"
		>
			<CombosCard
				v-for="combo in combos"
				:key="combo.id"
				:combo="combo"
				@view-more="handleViewMore"
			/>
		</div>

		<!-- Modo Lista (Horizontal) -->
		<div v-else class="space-y-3 py-4 overflow-y-auto overflow-x-hidden flex-1 min-h-0">
			<CombosList
				v-for="combo in combos"
				:key="combo.id"
				:combo="combo"
				@toggle-status="handleToggleStatus"
				@edit="handleEdit"
				@delete="handleDelete"
			/>
		</div>
	</div>
</template>
