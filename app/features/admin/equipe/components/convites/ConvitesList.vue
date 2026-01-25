<script setup lang="ts">
/**
 * 📌 ConvitesList
 *
 * Lista de convites pendentes e expirados.
 * Exibe cards de convites de forma responsiva com separação por status.
 */

import type { Convite } from "../../types/equipe";
import ConviteCard from "./ConviteCard.vue";

interface Props {
	convites: Convite[];
	convitesExpirados: Convite[];
	loading?: boolean;
	error?: string | null;
}

interface Emits {
	cancelar: [conviteId: string];
}

const props = withDefaults(defineProps<Props>(), {
	loading: false,
	error: null,
});

const emit = defineEmits<Emits>();

// Handler para cancelar convite
const handleCancelar = (conviteId: string) => {
	emit("cancelar", conviteId);
};

// Computed properties
const temConvitesAtivos = computed(() => props.convites.length > 0);
const temConvitesExpirados = computed(() => props.convitesExpirados.length > 0);
const temConvites = computed(() => temConvitesAtivos.value || temConvitesExpirados.value);
</script>

<template>
	<div class="space-y-6">
		<!-- Estado de Loading -->
		<div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 gap-4">
			<UiSkeleton v-for="i in 4" :key="i" class="h-40" />
		</div>

		<!-- Estado de Erro -->
		<UiEmptyState
			v-else-if="error"
			icon="lucide:alert-triangle"
			title="Erro ao carregar convites"
			:description="error"
		/>

		<!-- Estado Vazio -->
		<UiEmptyState
			v-else-if="!temConvites"
			icon="lucide:mail"
			title="Nenhum convite encontrado"
			description="Não há convites pendentes ou expirados no momento."
		/>

		<!-- Lista de Convites -->
		<div v-else class="space-y-6">
			<!-- Convites Ativos -->
			<div v-if="temConvitesAtivos">
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					<ConviteCard
						v-for="convite in convites"
						:key="convite.id"
						:convite="convite"
						@cancelar="handleCancelar"
					/>
				</div>
			</div>

			<!-- Convites Expirados -->
			<div v-if="temConvitesExpirados">
				<div class="flex items-center gap-2 mb-4">
					<Icon name="lucide:clock" class="w-5 h-5 text-orange-600 dark:text-orange-400" />
					<h3 class="text-lg font-semibold text-gray-900 dark:text-white">Convites Expirados</h3>
					<UiBadge color="warning">{{ convitesExpirados.length }}</UiBadge>
				</div>

				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					<ConviteCard
						v-for="convite in convitesExpirados"
						:key="convite.id"
						:convite="convite"
						:expirado="true"
						@cancelar="handleCancelar"
					/>
				</div>
			</div>
		</div>
	</div>
</template>
