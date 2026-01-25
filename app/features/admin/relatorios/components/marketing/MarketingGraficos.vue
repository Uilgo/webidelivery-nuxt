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
	graficos: GraficosMarketing;
	loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	loading: false,
});

// Usar props para evitar warning
const _ = props;
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

			<div v-else-if="graficos.cupons_por_tipo.labels.length === 0" class="py-8">
				<UiEmptyState
					title="Sem dados"
					description="Não há dados de cupons por tipo."
					icon="lucide:pie-chart"
					size="sm"
				/>
			</div>

			<UiChartPie v-else :data="graficos.cupons_por_tipo" />
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

			<div v-else-if="graficos.uso_ao_longo_tempo.labels.length === 0" class="py-8">
				<UiEmptyState
					title="Sem dados"
					description="Não há dados de uso ao longo do tempo."
					icon="lucide:trending-up"
					size="sm"
				/>
			</div>

			<UiChartLine v-else :data="graficos.uso_ao_longo_tempo" />
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

			<div v-else-if="graficos.economia_gerada.labels.length === 0" class="py-8">
				<UiEmptyState
					title="Sem dados"
					description="Não há dados de economia gerada."
					icon="lucide:piggy-bank"
					size="sm"
				/>
			</div>

			<UiChartLine v-else :data="graficos.economia_gerada" />
		</UiCard>
	</div>
</template>
