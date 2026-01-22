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
import type { DashboardPeriodo } from "~/features/admin/dashboard/types/filters";

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
	loadingKpis,
	error,

	// Filtros
	periodoKpis,
	periodoCharts,

	// Métodos
	recarregarTudo,
	setPeriodoKpis,
	setPeriodoCharts,
} = useDashboard();

/**
 * Força recarregamento de todos os dados
 */
const handleRefresh = async () => {
	await recarregarTudo();
};

/**
 * Handler para mudança de período dos KPIs (via cabeçalho)
 */
const handlePeriodoKpisChange = async (novoPeriodo: DashboardPeriodo) => {
	setPeriodoKpis(novoPeriodo);
};

/**
 * Handler para mudança de período dos Gráficos
 */
const handlePeriodoChartsChange = async (novoPeriodo: DashboardPeriodo) => {
	setPeriodoCharts(novoPeriodo);
};
</script>

<template>
	<div class="space-y-6">
		<!-- Cabeçalho -->
		<DashboardHeader
			:loading="loading"
			:periodo="periodoKpis"
			@refresh="handleRefresh"
			@update:periodo="handlePeriodoKpisChange"
		/>

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

		<!-- Conteúdo Principal - Mostra imediatamente se houver dados (SSR) -->
		<div v-if="kpis" class="space-y-6">
			<!-- Grid de KPIs (Top Cards) -->
			<DashboardCardsKpi
				:kpis="kpis"
				:loading="loadingKpis"
				:periodo="periodoKpis"
				@update:periodo="handlePeriodoKpisChange"
			/>

			<!-- Linha 1: Gráficos (2/3) + Ranking (1/3) -->
			<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<DashboardCharts
					:charts="charts"
					:periodo="periodoCharts"
					:loading="!charts"
					@update:periodo="handlePeriodoChartsChange"
				/>

				<DashboardRankingList :items="kpis.produtos.mais_vendidos" :loading="loadingKpis" />
			</div>

			<!-- Linha 2: Feed e Eficiência -->
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">
				<DashboardLiveFeed :orders="realtime?.pedidos_recentes ?? []" :loading="loading" />

				<DashboardEfficiency :performance="kpis.performance" :loading="!kpis.performance" />
			</div>
		</div>
	</div>
</template>
