<script setup lang="ts">
/**
 * 📌 GruposAdicionaisView - Orquestrador de Visualização de Grupos de Adicionais
 *
 * Alterna entre visualização em cards (grid) e lista (horizontal)
 * baseado no viewMode recebido do CardapioManager.
 */

import type { GrupoAdicionalComputado } from "../../../types/adicional";
import GruposAdicionaisCard from "./GruposAdicionaisCard.vue";
import GruposAdicionaisList from "./GruposAdicionaisList.vue";

interface Props {
	gruposAdicionais: GrupoAdicionalComputado[];
	viewMode: "card" | "list";
	loading?: boolean;
	expandedId?: string | null;
}

interface Emits {
	select: [grupoAdicional: GrupoAdicionalComputado];
	viewMore: [grupoAdicional: GrupoAdicionalComputado];
	edit: [grupoAdicional: GrupoAdicionalComputado];
	delete: [grupoAdicional: GrupoAdicionalComputado];
	toggleStatus: [grupoAdicional: GrupoAdicionalComputado];
	// Eventos para adicionais
	createAdicional: [grupoId: string];
	editAdicional: [adicionalId: string, grupoId: string];
	deleteAdicional: [adicionalId: string, grupoId: string];
	toggleAdicionalStatus: [adicionalId: string, ativo: boolean, grupoId: string];
	// Evento para controlar expansão
	"update:expandedId": [id: string | null];
}

withDefaults(defineProps<Props>(), {
	loading: false,
	expandedId: null,
});

const emit = defineEmits<Emits>();

/**
 * Handler para seleção de grupo
 */
const handleSelect = (grupoAdicional: GrupoAdicionalComputado): void => {
	emit("select", grupoAdicional);
};

/**
 * Handler para ver mais detalhes
 */
const handleViewMore = (grupoAdicional: GrupoAdicionalComputado): void => {
	emit("viewMore", grupoAdicional);
};

/**
 * Handler para editar
 */
const handleEdit = (grupoAdicional: GrupoAdicionalComputado): void => {
	emit("edit", grupoAdicional);
};

/**
 * Handler para excluir
 */
const handleDelete = (grupoAdicional: GrupoAdicionalComputado): void => {
	emit("delete", grupoAdicional);
};

/**
 * Handler para toggle status
 */
const handleToggleStatus = (grupoAdicional: GrupoAdicionalComputado): void => {
	emit("toggleStatus", grupoAdicional);
};

/**
 * Handlers para adicionais
 */
const handleCreateAdicional = (grupoId: string): void => {
	emit("createAdicional", grupoId);
};

const handleEditAdicional = (adicionalId: string, grupoId: string): void => {
	emit("editAdicional", adicionalId, grupoId);
};

const handleDeleteAdicional = (adicionalId: string, grupoId: string): void => {
	emit("deleteAdicional", adicionalId, grupoId);
};

const handleToggleAdicionalStatus = (
	adicionalId: string,
	ativo: boolean,
	grupoId: string,
): void => {
	emit("toggleAdicionalStatus", adicionalId, ativo, grupoId);
};

/**
 * Handler para expansão de card
 */
const handleToggleExpansion = (grupoId: string | null): void => {
	emit("update:expandedId", grupoId);
};
</script>

<template>
	<div class="grupos-adicionais-view h-full flex flex-col overflow-x-hidden">
		<!-- Modo Card (Grid) -->
		<div
			v-if="viewMode === 'card'"
			class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 py-4 overflow-y-auto overflow-x-hidden flex-1 min-h-0 content-start"
		>
			<GruposAdicionaisCard
				v-for="grupoAdicional in gruposAdicionais"
				:key="grupoAdicional.id"
				:grupo-adicional="grupoAdicional"
				@click="handleSelect"
				@view-more="handleViewMore"
			/>
		</div>

		<!-- Modo Lista (Horizontal) -->
		<div v-else class="space-y-3 py-4 overflow-y-auto overflow-x-hidden flex-1 min-h-0">
			<GruposAdicionaisList
				v-for="grupoAdicional in gruposAdicionais"
				:key="grupoAdicional.id"
				:grupo-adicional="grupoAdicional"
				:is-expanded="expandedId === grupoAdicional.id"
				@click="handleSelect"
				@view-more="handleViewMore"
				@edit="handleEdit"
				@delete="handleDelete"
				@toggle-status="handleToggleStatus"
				@create-adicional="handleCreateAdicional"
				@edit-adicional="handleEditAdicional"
				@delete-adicional="handleDeleteAdicional"
				@toggle-adicional-status="handleToggleAdicionalStatus"
				@toggle-expansion="handleToggleExpansion"
			/>
		</div>
	</div>
</template>
