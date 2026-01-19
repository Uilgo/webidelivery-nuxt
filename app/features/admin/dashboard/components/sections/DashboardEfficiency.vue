<script setup lang="ts">
/**
 * 📊 DashboardEfficiency - Cards de Eficiência Operacional
 *
 * Exibe métricas de operação: Preparo, Entrega, Avaliação e Cancelamentos.
 */

import type { KpiPerformance } from "../../types/dashboard";

interface Props {
	performance: KpiPerformance;
	loading?: boolean;
}

defineProps<Props>();
</script>

<template>
	<UiCard class="p-5 h-full flex flex-col">
		<div class="flex items-center justify-between mb-6">
			<h3 class="text-lg font-bold text-[var(--text-primary)]">Eficiência Operacional</h3>
			<span
				class="text-xs font-medium px-2 py-1 bg-green-100 text-green-700 rounded-full border border-green-200"
			>
				Hoje
			</span>
		</div>

		<div v-if="loading" class="grid grid-cols-2 gap-4 flex-1">
			<UiSkeleton v-for="i in 4" :key="i" class="h-24 rounded-xl" />
		</div>

		<div v-else class="grid grid-cols-2 gap-4 flex-1">
			<!-- Card 1: Tempo Preparo -->
			<div
				class="bg-[var(--bg-muted)]/50 rounded-xl p-4 border border-[var(--border-default)] flex flex-col justify-between hover:border-[var(--primary-light)] transition-colors"
			>
				<div class="flex items-start justify-between">
					<div
						class="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400"
					>
						<Icon name="lucide:chef-hat" class="w-5 h-5" />
					</div>
					<span
						class="text-xs font-bold text-green-600 flex items-center gap-1 bg-green-100 px-1.5 py-0.5 rounded"
					>
						<Icon name="lucide:check-circle-2" class="w-3 h-3" />
						Meta: 30'
					</span>
				</div>
				<div class="mt-3">
					<p class="text-2xl font-bold text-[var(--text-primary)]">
						{{ performance.tempo_medio_preparo }} min
					</p>
					<p class="text-xs text-[var(--text-muted)]">Tempo Médio de Preparo</p>
				</div>
			</div>

			<!-- Card 2: Tempo Entrega -->
			<div
				class="bg-[var(--bg-muted)]/50 rounded-xl p-4 border border-[var(--border-default)] flex flex-col justify-between hover:border-[var(--primary-light)] transition-colors"
			>
				<div class="flex items-start justify-between">
					<div
						class="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg text-orange-600 dark:text-orange-400"
					>
						<Icon name="lucide:bike" class="w-5 h-5" />
					</div>
					<span
						class="text-xs font-bold text-green-600 flex items-center gap-1 bg-green-100 px-1.5 py-0.5 rounded"
					>
						<Icon name="lucide:check-circle-2" class="w-3 h-3" />
						Meta: 45'
					</span>
				</div>
				<div class="mt-3">
					<p class="text-2xl font-bold text-[var(--text-primary)]">
						{{ performance.tempo_medio_entrega }} min
					</p>
					<p class="text-xs text-[var(--text-muted)]">Tempo Médio de Entrega</p>
				</div>
			</div>

			<!-- Card 3: Avaliação -->
			<div
				class="bg-[var(--bg-muted)]/50 rounded-xl p-4 border border-[var(--border-default)] flex flex-col justify-between hover:border-[var(--primary-light)] transition-colors"
			>
				<div class="flex items-start justify-between">
					<div
						class="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg text-yellow-600 dark:text-yellow-400"
					>
						<Icon name="lucide:star" class="w-5 h-5" />
					</div>
					<!-- Placeholder para contagem de avaliações, idealmente viria da API -->
					<!-- <span class="text-xs font-medium text-[var(--text-muted)]"> 12 avaliações </span> -->
				</div>
				<div class="mt-3">
					<div class="flex items-end gap-2">
						<p class="text-2xl font-bold text-[var(--text-primary)]">
							{{ performance.satisfacao_media }}
						</p>
						<div class="flex pb-1.5">
							<Icon
								v-for="i in 5"
								:key="i"
								name="lucide:star"
								class="w-3 h-3"
								:class="
									i <= Math.round(performance.satisfacao_media)
										? 'text-yellow-400 fill-yellow-400'
										: 'text-gray-300'
								"
							/>
						</div>
					</div>
					<p class="text-xs text-[var(--text-muted)]">Satisfação do Cliente</p>
				</div>
			</div>

			<!-- Card 4: Cancelamentos -->
			<div
				class="bg-[var(--bg-muted)]/50 rounded-xl p-4 border border-[var(--border-default)] flex flex-col justify-between hover:border-red-200 dark:hover:border-red-900 transition-colors"
			>
				<div class="flex items-start justify-between">
					<div class="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-600 dark:text-red-400">
						<Icon name="lucide:alert-octagon" class="w-5 h-5" />
					</div>
					<span
						class="text-xs font-bold text-red-600 flex items-center gap-1 bg-red-100 px-1.5 py-0.5 rounded"
					>
						Atenção
					</span>
				</div>
				<div class="mt-3">
					<p class="text-2xl font-bold text-[var(--text-primary)]">
						{{ performance.total_cancelamentos }}
					</p>
					<p class="text-xs text-[var(--text-muted)]">Pedidos Cancelados</p>
				</div>
			</div>
		</div>
	</UiCard>
</template>
