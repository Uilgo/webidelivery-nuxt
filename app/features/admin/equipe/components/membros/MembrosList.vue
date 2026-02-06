<script setup lang="ts">
/**
 * 📌 MembrosList
 *
 * Lista de membros da equipe com estados de loading, erro e vazio.
 * Exibe cards de membros de forma responsiva.
 */

import type { Membro } from "../../types/equipe";
import type { Cargo } from "#shared/types/database";
import MembroCard from "./MembroCard.vue";

interface Props {
	membros: Membro[];
	loading?: boolean;
	error?: string | null;
}

interface Emits {
	editar: [membro: Membro];
	ativar: [membroId: string, cargoMembro: Cargo];
	desativar: [membroId: string, cargoMembro: Cargo];
	remover: [membroId: string, cargoMembro: Cargo];
}

const _props = withDefaults(defineProps<Props>(), {
	loading: false,
	error: null,
});

const emit = defineEmits<Emits>();

// Handlers para eventos dos cards
const handleEditar = (membro: Membro) => {
	emit("editar", membro);
};

const handleAtivar = (membroId: string, cargoMembro: Cargo) => {
	emit("ativar", membroId, cargoMembro);
};

const handleDesativar = (membroId: string, cargoMembro: Cargo) => {
	emit("desativar", membroId, cargoMembro);
};

const handleRemover = (membroId: string, cargoMembro: Cargo) => {
	emit("remover", membroId, cargoMembro);
};
</script>

<template>
	<div>
		<!-- Estado de Loading -->
		<div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			<UiSkeleton v-for="i in 6" :key="i" class="h-32" />
		</div>

		<!-- Estado de Erro -->
		<UiEmptyState
			v-else-if="error"
			icon="alert-triangle"
			title="Erro ao carregar membros"
			:description="error"
		/>

		<!-- Estado Vazio -->
		<UiEmptyState
			v-else-if="membros.length === 0"
			icon="lucide:users"
			title="Nenhum membro encontrado"
			description="Não há membros que correspondam aos filtros aplicados."
		/>

		<!-- Lista de Membros -->
		<div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			<MembroCard
				v-for="membro in membros"
				:key="membro.id"
				:membro="membro"
				@editar="handleEditar"
				@ativar="handleAtivar"
				@desativar="handleDesativar"
				@remover="handleRemover"
			/>
		</div>
	</div>
</template>
