<script setup lang="ts">
/**
 * 📈 MarketingGraficos
 *
 * Exibe gráficos do relatório de marketing:
 * - Cupons por tipo (pizza)
 * - Uso ao longo do tempo (linha)
 * - Economia gerada (linha)
 */

import type { GraficosMarketing } from "../../types/marketing";

interface Props {
	graficos?: GraficosMarketing;
	loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	graficos: undefined,
	loading: false,
});

// Transformar dados para ChartPie (precisa de data: number[] ao invés de datasets)
const dadosCuponsPorTipo = computed(() => {
	if (!props.graficos) return null;

	const grafico = props.graficos.cupons_por_tipo;
	return {
		labels: [...grafico.labels] as string[],
		data: grafico.datasets[0]?.data ? ([...grafico.datasets[0].data] as number[]) : [],
		colors: grafico.datasets[0]?.backgroundColor
			? Array.isArray(grafico.datasets[0].backgroundColor)
				? ([...grafico.datasets[0].backgroundColor] as string[])
				: [grafico.datasets[0].backgroundColor as string]
			: undefined,
	};
});

// Transformar dados para ChartLine (remover readonly)
const dadosUsoAoLongoTempo = computed(() => {
	if (!props.graficos) return null;

	const grafico = props.graficos.uso_ao_longo_tempo;
	return {
		labels: [...grafico.labels] as string[],
		datasets: grafico.datasets.map((dataset) => ({
			label: dataset.label,
			data: [...dataset.data] as number[],
			backgroundColor:
				typeof dataset.backgroundColor === "string" ? dataset.backgroundColor : undefined,
			borderColor: dataset.borderColor,
			fill: dataset.fill,
			tension: dataset.tension,
		})),
	};
});

// Transformar dados para ChartLine (remover readonly)
const dadosEconomiaGerada = computed(() => {
	if (!props.graficos) return null;

	const grafico = props.graficos.economia_gerada;
	return {
		labels: [...grafico.labels] as string[],
		datasets: grafico.datasets.map((dataset) => ({
			label: dataset.label,
			data: [...dataset.data] as number[],
			backgroundColor:
				typeof dataset.backgroundColor === "string" ? dataset.backgroundColor : undefined,
			borderColor: dataset.borderColor,
			fill: dataset.fill,
			tension: dataset.tension,
		})),
	};
});
</script>

<template>
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
		<!-- Cupons por Tipo -->
		<UiCard>
			<template #header>
				<div class="flex items-center gap-2">
					<Icon name="lucide:pie-chart" class="w-5 h-5 text-blue-500" />
					<h3 class="text-lg font-semibold">Cupons por Tipo</h3>
				</div>
			</template>

			<div v-if="loading">
				<UiSkeleton class="h-64 w-full" />
			</div>

			<div v-else-if="!graficos || graficos.cupons_por_tipo.labels.length === 0" class="py-8">
				<UiEmptyState
					title="Sem dados"
					description="Não há dados de cupons por tipo."
					icon="lucide:pie-chart"
					size="sm"
				/>
			</div>

			<UiChartPie v-else-if="dadosCuponsPorTipo" v-bind="dadosCuponsPorTipo" />
		</UiCard>

		<!-- Uso ao Longo do Tempo -->
		<UiCard>
			<template #header>
				<div class="flex items-center gap-2">
					<Icon name="lucide:trending-up" class="w-5 h-5 text-green-500" />
					<h3 class="text-lg font-semibold">Uso ao Longo do Tempo</h3>
				</div>
			</template>

			<div v-if="loading">
				<UiSkeleton class="h-64 w-full" />
			</div>

			<div v-else-if="!graficos || graficos.uso_ao_longo_tempo.labels.length === 0" class="py-8">
				<UiEmptyState
					title="Sem dados"
					description="Não há dados de uso ao longo do tempo."
					icon="lucide:trending-up"
					size="sm"
				/>
			</div>

			<UiChartLine v-else-if="dadosUsoAoLongoTempo" v-bind="dadosUsoAoLongoTempo" />
		</UiCard>

		<!-- Economia Gerada -->
		<UiCard class="lg:col-span-2">
			<template #header>
				<div class="flex items-center gap-2">
					<Icon name="lucide:piggy-bank" class="w-5 h-5 text-purple-500" />
					<h3 class="text-lg font-semibold">Economia Gerada ao Longo do Tempo</h3>
				</div>
			</template>

			<div v-if="loading">
				<UiSkeleton class="h-64 w-full" />
			</div>

			<div v-else-if="!graficos || graficos.economia_gerada.labels.length === 0" class="py-8">
				<UiEmptyState
					title="Sem dados"
					description="Não há dados de economia gerada."
					icon="lucide:piggy-bank"
					size="sm"
				/>
			</div>

			<UiChartLine v-else-if="dadosEconomiaGerada" v-bind="dadosEconomiaGerada" />
		</UiCard>
	</div>
</template>
