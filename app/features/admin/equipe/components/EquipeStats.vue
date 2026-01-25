<script setup lang="ts">
/**
 * 📌 EquipeStats
 *
 * Cards de estatísticas da equipe (total, ativos, inativos, convites pendentes).
 * Exibe métricas importantes de forma visual e responsiva.
 */

import type { EstatisticasEquipe } from "../types/equipe";

interface Props {
	estatisticas: EstatisticasEquipe;
	loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	loading: false,
});

// Cards de estatísticas com ícones e cores
const cards = computed(() => [
	{
		title: "Total de Membros",
		value: props.estatisticas.total_membros,
		icon: "lucide:users",
		color: "blue",
		description: "Membros cadastrados",
	},
	{
		title: "Membros Ativos",
		value: props.estatisticas.membros_ativos,
		icon: "lucide:user-check",
		color: "green",
		description: "Ativos no sistema",
	},
	{
		title: "Membros Inativos",
		value: props.estatisticas.membros_inativos,
		icon: "lucide:user-x",
		color: "orange",
		description: "Desativados",
	},
	{
		title: "Convites Pendentes",
		value: props.estatisticas.convites_pendentes,
		icon: "lucide:mail",
		color: "purple",
		description: "Aguardando uso",
	},
]);

// Classes de cores para cada card
const getCardClasses = (color: string) => {
	const classes = {
		blue: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
		green: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
		orange: "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800",
		purple: "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800",
	};
	return classes[color as keyof typeof classes] || classes.blue;
};

const getIconClasses = (color: string) => {
	const classes = {
		blue: "text-blue-600 dark:text-blue-400",
		green: "text-green-600 dark:text-green-400",
		orange: "text-orange-600 dark:text-orange-400",
		purple: "text-purple-600 dark:text-purple-400",
	};
	return classes[color as keyof typeof classes] || classes.blue;
};

const getValueClasses = (color: string) => {
	const classes = {
		blue: "text-blue-900 dark:text-blue-100",
		green: "text-green-900 dark:text-green-100",
		orange: "text-orange-900 dark:text-orange-100",
		purple: "text-purple-900 dark:text-purple-100",
	};
	return classes[color as keyof typeof classes] || classes.blue;
};
</script>

<template>
	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
		<UiCard v-for="card in cards" :key="card.title" size="sm" :class="getCardClasses(card.color)">
			<!-- Loading skeleton -->
			<div v-if="loading" class="animate-pulse">
				<div class="flex items-center justify-between mb-2">
					<div class="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded"></div>
					<div class="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
				</div>
				<div class="w-16 h-8 bg-gray-300 dark:bg-gray-600 rounded mb-1"></div>
				<div class="w-20 h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
			</div>

			<!-- Conteúdo real -->
			<div v-else>
				<div class="flex items-center justify-between mb-2">
					<h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">
						{{ card.title }}
					</h3>
					<Icon :name="card.icon" :class="['w-5 h-5', getIconClasses(card.color)]" />
				</div>

				<div class="flex items-baseline gap-2">
					<span :class="['text-2xl font-bold', getValueClasses(card.color)]">
						{{ card.value }}
					</span>
				</div>

				<p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
					{{ card.description }}
				</p>
			</div>
		</UiCard>
	</div>
</template>
