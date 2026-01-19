<script setup lang="ts">
/**
 * 📊 DashboardManager - Orquestrador Principal da Dashboard
 *
 * Componente responsável por:
 * - Gerenciar estado global da dashboard
 * - Coordenar todos os componentes filhos
 * - Controlar filtros e atualizações
 * - Exibir loading states e tratamento de erros
 */

import { useDashboard } from "~/features/admin/dashboard/composables/useDashboard";

// Componentes de Seções
import DashboardHeader from "./sections/DashboardHeader.vue";
import DashboardCardsKpi from "./sections/DashboardCardsKpi.vue";
import DashboardCharts from "./sections/DashboardCharts.vue";
import DashboardRankingList from "./sections/DashboardRankingList.vue";
import DashboardLiveFeed from "./sections/DashboardLiveFeed.vue";
import DashboardEfficiency from "./sections/DashboardEfficiency.vue";

/**
 * Composable principal da dashboard
 */
const {
	// Dados
	kpis,
	charts,
	realtime,

	// Estados
	loading,
	error,

	// Filtros
	periodo,

	// Métodos
	recarregarTudo,
	setPeriodo,
} = useDashboard();

/**
 * Força recarregamento de todos os dados
 */
const handleRefresh = async () => {
	await recarregarTudo();
};

/**
 * Handler para ações de relatório
 */
const handleReport = () => {
	// TODO: Implementar geração de relatório
	throw new Error("Gerar relatório: Funcionalidade em desenvolvimento");
};
</script>

<template>
	<div class="space-y-6">
		<!-- Cabeçalho -->
		<DashboardHeader :loading="loading" @refresh="handleRefresh" @report="handleReport" />

		<!-- Estado de Erro -->
		<UiCard
			v-if="error"
			class="mb-6 p-4 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20"
		>
			<div class="flex items-start space-x-3">
				<Icon name="lucide:alert-circle" class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
				<div class="flex-1">
					<h3 class="text-sm font-medium text-red-800 dark:text-red-200">Erro ao carregar dados</h3>
					<p class="text-sm text-red-700 dark:text-red-300 mt-1">
						{{ error }}
					</p>
					<UiButton variant="outline" size="sm" class="mt-3" @click="handleRefresh">
						Tentar novamente
					</UiButton>
				</div>
			</div>
		</UiCard>

		<!-- Loading State Inicial (Skeleton Global) -->
		<div v-if="loading && !kpis" class="space-y-6">
			<!-- KPIs Skeleton -->
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
				<UiSkeleton v-for="i in 4" :key="i" class="h-32 rounded-xl" />
			</div>
			<!-- Charts + Ranking Skeleton -->
			<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<UiSkeleton class="h-96 lg:col-span-2 rounded-xl" />
				<UiSkeleton class="h-96 rounded-xl" />
			</div>
			<!-- Feed + Efficiency Skeleton -->
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<UiSkeleton class="h-80 rounded-xl" />
				<UiSkeleton class="h-80 rounded-xl" />
			</div>
		</div>

		<!-- Conteúdo Principal -->
		<div v-else-if="kpis" class="space-y-6 animate-in fade-in duration-500">
			<!-- Grid de KPIs (Top Cards) -->
			<DashboardCardsKpi :kpis="kpis" :loading="loading" />

			<!-- Linha 1: Gráficos (2/3) + Ranking (1/3) -->
			<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<DashboardCharts
					:charts="charts"
					:periodo="periodo"
					:loading="loading"
					@update:periodo="setPeriodo"
				/>

				<DashboardRankingList :items="kpis.produtos.mais_vendidos" :loading="loading" />
			</div>

			<!-- Linha 2: Feed e Eficiência -->
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">
				<DashboardLiveFeed :orders="realtime?.pedidos_recentes ?? []" :loading="loading" />

				<DashboardEfficiency :performance="kpis.performance" :loading="loading" />
			</div>
		</div>
	</div>
</template>
