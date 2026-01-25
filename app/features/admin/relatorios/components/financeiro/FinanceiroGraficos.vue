<script setup lang="ts">
/**
 * 📈 FinanceiroGraficos
 *
 * Exibe gráficos do relatório financeiro:
 * - Fluxo de caixa (linha)
 * - Receita por método (pizza)
 * - Evolução do lucro (linha)
 */

import type { GraficosFinanceiro } from "../../types/financeiro";

interface Props {
	graficos: GraficosFinanceiro;
	loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	loading: false,
});

/**
 * Converte dados de gráfico readonly para mutável (compatível com Chart.js)
 */
const dadosFluxoCaixa = computed(() => ({
	labels: [...props.graficos.fluxo_caixa.labels],
	datasets: props.graficos.fluxo_caixa.datasets.map((ds) => ({
		label: ds.label,
		data: [...ds.data],
		borderColor: ds.borderColor,
		backgroundColor: typeof ds.backgroundColor === "string" ? ds.backgroundColor : undefined,
		fill: ds.fill,
		tension: ds.tension,
	})),
}));

/**
 * Converte dados de gráfico de linha para gráfico de pizza
 * Extrai o primeiro dataset e suas cores de backgroundColor
 */
const dadosGraficoPizza = computed(() => {
	const grafico = props.graficos.receita_por_metodo;
	const primeiroDataset = grafico.datasets[0];

	// Se não houver dataset, retorna estrutura vazia
	if (!primeiroDataset) {
		return {
			labels: [],
			data: [],
			colors: undefined,
		};
	}

	return {
		labels: [...grafico.labels],
		data: [...primeiroDataset.data],
		colors: Array.isArray(primeiroDataset.backgroundColor)
			? [...primeiroDataset.backgroundColor]
			: undefined,
	};
});

/**
 * Converte dados de evolução do lucro para formato mutável
 */
const dadosEvolucaoLucro = computed(() => ({
	labels: [...props.graficos.evolucao_lucro.labels],
	datasets: props.graficos.evolucao_lucro.datasets.map((ds) => ({
		label: ds.label,
		data: [...ds.data],
		borderColor: ds.borderColor,
		backgroundColor: typeof ds.backgroundColor === "string" ? ds.backgroundColor : undefined,
		fill: ds.fill,
		tension: ds.tension,
	})),
}));
</script>

<template>
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
		<!-- Fluxo de Caixa -->
		<UiCard class="lg:col-span-2">
			<template #header>
				<div class="flex items-center gap-2">
					<Icon name="lucide:trending-up" class="w-5 h-5 text-green-500" />
					<h3 class="text-lg font-semibold">Fluxo de Caixa</h3>
				</div>
			</template>

			<div v-if="loading">
				<UiSkeleton class="h-64 w-full" />
			</div>

			<div v-else-if="graficos.fluxo_caixa.labels.length === 0" class="py-8">
				<UiEmptyState
					title="Sem dados"
					description="Não há dados de fluxo de caixa."
					icon="lucide:trending-up"
					size="sm"
				/>
			</div>

			<UiChartLine v-else v-bind="dadosFluxoCaixa" />
		</UiCard>

		<!-- Receita por Método -->
		<UiCard>
			<template #header>
				<div class="flex items-center gap-2">
					<Icon name="lucide:pie-chart" class="w-5 h-5 text-blue-500" />
					<h3 class="text-lg font-semibold">Receita por Método</h3>
				</div>
			</template>

			<div v-if="loading">
				<UiSkeleton class="h-64 w-full" />
			</div>

			<div v-else-if="graficos.receita_por_metodo.labels.length === 0" class="py-8">
				<UiEmptyState
					title="Sem dados"
					description="Não há dados de receita por método."
					icon="lucide:pie-chart"
					size="sm"
				/>
			</div>

			<UiChartPie v-else v-bind="dadosGraficoPizza" />
		</UiCard>

		<!-- Evolução do Lucro -->
		<UiCard>
			<template #header>
				<div class="flex items-center gap-2">
					<Icon name="lucide:piggy-bank" class="w-5 h-5 text-purple-500" />
					<h3 class="text-lg font-semibold">Evolução do Lucro</h3>
				</div>
			</template>

			<div v-if="loading">
				<UiSkeleton class="h-64 w-full" />
			</div>

			<div v-else-if="graficos.evolucao_lucro.labels.length === 0" class="py-8">
				<UiEmptyState
					title="Sem dados"
					description="Não há dados de evolução do lucro."
					icon="lucide:piggy-bank"
					size="sm"
				/>
			</div>

			<UiChartLine v-else v-bind="dadosEvolucaoLucro" />
		</UiCard>
	</div>
</template>
