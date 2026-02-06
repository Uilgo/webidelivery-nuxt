<script setup lang="ts">
/**
 * 📊 DashboardGraficos - Container de Gráficos Dinâmicos
 *
 * Componente que renderiza diferentes tipos de gráficos baseado na tab ativa.
 * Usa Chart.js destruindo e recriando para evitar problemas de reatividade.
 */

import { Chart, registerables } from "chart.js";
import type {
	ChartPedidosPorHora,
	ChartFaturamentoSemanal,
	ChartStatusDistribuicao,
	ChartProdutosRanking,
} from "../../types/dashboard";

// Registra todos os componentes do Chart.js
Chart.register(...registerables);

// Configuração global - cor padrão para TODOS os textos
Chart.defaults.color = "#FFFFFF";
Chart.defaults.font = {
	family: "'Inter', sans-serif",
	size: 13,
	weight: "normal",
};
Chart.defaults.borderColor = "rgba(148, 163, 184, 0.1)";

interface Props {
	data:
		| ChartPedidosPorHora
		| ChartFaturamentoSemanal
		| ChartStatusDistribuicao
		| ChartProdutosRanking
		| null;
	type?: "line" | "bar" | "doughnut" | "pie";
}

const props = withDefaults(defineProps<Props>(), {
	type: "line",
});

const chartCanvas = ref<HTMLCanvasElement>();
const chartInstance = ref<Chart>();
const isReady = ref(false);

/**
 * Verifica se os dados estão vazios (apenas para pizza/doughnut)
 */
const isEmpty = computed(() => {
	if (!props.data) return false;

	if ((props.type === "pie" || props.type === "doughnut") && "data" in props.data) {
		const data = props.data as ChartStatusDistribuicao;
		const total = data.data.reduce((acc, val) => acc + val, 0);
		return total === 0;
	}

	return false;
});

/**
 * Configuração do gráfico baseado no tipo
 */
const getChartConfig = (data: typeof props.data) => {
	if (!data) return null;

	// Remove TODA reatividade
	const rawData = JSON.parse(JSON.stringify(toRaw(data)));

	// Linha
	if (props.type === "line" && "datasets" in rawData && "pedidos" in rawData.datasets) {
		const lineData = rawData as ChartPedidosPorHora;
		return {
			type: "line",
			data: {
				labels: lineData.labels,
				datasets: [
					{
						label: "Pedidos",
						data: lineData.datasets.pedidos,
						borderColor: "#3B82F6",
						backgroundColor: "#3B82F6",
						tension: 0.4,
						fill: false,
					},
					{
						label: "Faturamento (R$)",
						data: lineData.datasets.faturamento,
						borderColor: "#10B981",
						backgroundColor: "#10B981",
						tension: 0.4,
						fill: false,
						yAxisID: "y1",
					},
				],
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: {
						labels: {
							color: "#FFFFFF",
							font: {
								size: 13,
								weight: 500,
							},
						},
					},
				},
				scales: {
					x: {
						ticks: {
							color: "#FFFFFF",
							font: {
								size: 12,
							},
						},
						grid: {
							color: "rgba(148, 163, 184, 0.1)",
						},
					},
					y: {
						ticks: {
							color: "#FFFFFF",
							font: {
								size: 12,
							},
						},
						grid: {
							color: "rgba(148, 163, 184, 0.1)",
						},
					},
					y1: {
						position: "right",
						ticks: {
							color: "#FFFFFF",
							font: {
								size: 12,
							},
						},
						grid: {
							display: false,
						},
					},
				},
			},
		};
	}

	// Barras
	if (props.type === "bar") {
		if ("datasets" in rawData && "atual" in rawData.datasets) {
			const barData = rawData as ChartFaturamentoSemanal;
			return {
				type: "bar",
				data: {
					labels: barData.labels,
					datasets: [
						{
							label: "Esta Semana",
							data: barData.datasets.atual,
							backgroundColor: "#3B82F6",
						},
						{
							label: "Semana Anterior",
							data: barData.datasets.anterior,
							backgroundColor: "#94A3B8",
						},
					],
				},
				options: {
					responsive: true,
					maintainAspectRatio: false,
					plugins: {
						legend: {
							labels: {
								color: "#FFFFFF",
								font: {
									size: 13,
									weight: 500,
								},
							},
						},
					},
					scales: {
						x: {
							ticks: {
								color: "#FFFFFF",
								font: {
									size: 12,
								},
							},
							grid: {
								color: "rgba(148, 163, 184, 0.1)",
							},
						},
						y: {
							ticks: {
								color: "#FFFFFF",
								font: {
									size: 12,
								},
							},
							grid: {
								color: "rgba(148, 163, 184, 0.1)",
							},
						},
					},
				},
			};
		}

		if ("data" in rawData && Array.isArray(rawData.data)) {
			const produtoData = rawData as ChartProdutosRanking;
			return {
				type: "bar",
				data: {
					labels: produtoData.labels,
					datasets: [
						{
							label: "Quantidade Vendida",
							data: produtoData.data,
							backgroundColor: "#10B981",
						},
					],
				},
				options: {
					responsive: true,
					maintainAspectRatio: false,
					indexAxis: "y",
					plugins: {
						legend: {
							labels: {
								color: "#FFFFFF",
								font: {
									size: 13,
									weight: 500,
								},
							},
						},
					},
					scales: {
						x: {
							ticks: {
								color: "#FFFFFF",
								font: {
									size: 12,
								},
							},
							grid: {
								color: "rgba(148, 163, 184, 0.1)",
							},
						},
						y: {
							ticks: {
								color: "#FFFFFF",
								font: {
									size: 12,
								},
							},
							grid: {
								color: "rgba(148, 163, 184, 0.1)",
							},
						},
					},
				},
			};
		}
	}

	// Pizza/Doughnut
	if ((props.type === "pie" || props.type === "doughnut") && "data" in rawData) {
		const pieData = rawData as ChartStatusDistribuicao;
		return {
			type: props.type,
			data: {
				labels: pieData.labels,
				datasets: [
					{
						data: pieData.data,
						backgroundColor: pieData.colors || [
							"#F59E0B",
							"#06B6D4",
							"#8B5CF6",
							"#10B981",
							"#3B82F6",
							"#059669",
							"#EF4444",
						],
						borderWidth: 2,
						borderColor: "#FFFFFF",
					},
				],
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				layout: {
					padding: {
						top: 20,
						bottom: 20,
						left: 20,
						right: 20,
					},
				},
				plugins: {
					legend: {
						position: "right",
						labels: {
							color: "#FFFFFF",
							padding: 12,
							font: {
								size: 13,
								weight: 500,
							},
							generateLabels: function (chart: Chart) {
								const data = chart.data;
								if (data.labels && data.labels.length && data.datasets.length) {
									const dataset = data.datasets[0];
									if (!dataset) return [];

									const total = (dataset.data as number[]).reduce((a, b) => a + b, 0);

									return data.labels.map((label: unknown, i: number) => {
										const value = (dataset.data as number[])[i];
										const percentage = value ? ((value / total) * 100).toFixed(1) : "0.0";

										return {
											text: `${label}: ${value} (${percentage}%)`,
											fillStyle: (dataset.backgroundColor as string[])[i],
											strokeStyle: "#FFFFFF",
											lineWidth: 0,
											hidden: false,
											index: i,
											fontColor: "#FFFFFF",
										};
									});
								}
								return [];
							},
						},
					},
					tooltip: {
						callbacks: {
							label: function (context: {
								dataset: { data: number[] };
								parsed: number;
								label: string;
							}) {
								const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
								const value = context.parsed;
								if (value === null || value === undefined) {
									return `${context.label}: 0 (0.0%)`;
								}
								const percentage = ((value / total) * 100).toFixed(1);
								return `${context.label}: ${value} pedidos (${percentage}%)`;
							},
						},
					},
				},
			},
		};
	}

	return null;
};

let updateTimeout: ReturnType<typeof setTimeout> | null = null;

/**
 * Cria o gráfico
 */
const createChart = () => {
	if (!props.data || isEmpty.value || !chartCanvas.value) {
		isReady.value = false;
		return;
	}

	const config = getChartConfig(props.data);
	if (!config) return;

	try {
		// @ts-expect-error - Chart.js aceita configurações dinâmicas
		chartInstance.value = new Chart(chartCanvas.value, config);
		isReady.value = true;
	} catch (err) {
		console.error("[Chart] Erro:", err);
		isReady.value = false;
	}
};

/**
 * Destroi o gráfico de forma segura
 */
const destroyChart = () => {
	if (chartInstance.value) {
		try {
			chartInstance.value.destroy();
		} catch {
			// Ignora erro
		}
		chartInstance.value = undefined;
	}
};

/**
 * Recria o gráfico
 */
const recreateChart = () => {
	// Limpa timeout anterior
	if (updateTimeout) {
		clearTimeout(updateTimeout);
	}

	// Destroi gráfico atual
	destroyChart();
	isReady.value = false;

	// Aguarda um pouco e recria
	updateTimeout = setTimeout(() => {
		if (chartCanvas.value) {
			createChart();
		}
	}, 50);
};

// Watch para mudanças nos dados
watch(() => props.data, recreateChart, { deep: false });

// Inicializa
onMounted(() => {
	nextTick(createChart);
});

// Limpa
onBeforeUnmount(() => {
	if (updateTimeout) {
		clearTimeout(updateTimeout);
	}
	destroyChart();
});
</script>

<template>
	<div class="w-full h-full chart-container relative overflow-hidden">
		<!-- EmptyState -->
		<div v-if="isEmpty" class="absolute inset-0 flex items-center justify-center">
			<UiEmptyState
				icon="lucide:calendar-x"
				title="Ops! Nada por aqui ainda"
				description="Parece que não há dados para o período selecionado. Tente ajustar o filtro de datas ou aguarde novos pedidos chegarem. Seus gráficos vão aparecer assim que houver movimento! 📊"
				size="sm"
			/>
		</div>

		<!-- Skeleton -->
		<div v-else-if="!isReady" class="absolute inset-0 flex flex-col gap-3 p-4">
			<UiSkeleton class="h-4 w-32" />
			<div class="flex-1 flex items-end gap-2">
				<UiSkeleton class="w-full" style="height: 60%" />
				<UiSkeleton class="w-full" style="height: 80%" />
				<UiSkeleton class="w-full" style="height: 45%" />
				<UiSkeleton class="w-full" style="height: 90%" />
				<UiSkeleton class="w-full" style="height: 70%" />
			</div>
			<div class="flex gap-2 justify-between">
				<UiSkeleton class="h-3 w-12" />
				<UiSkeleton class="h-3 w-12" />
				<UiSkeleton class="h-3 w-12" />
			</div>
		</div>

		<!-- Canvas -->
		<canvas
			ref="chartCanvas"
			class="w-full h-full transition-opacity duration-300"
			:class="{ 'opacity-0': !isReady || isEmpty, 'opacity-100': isReady && !isEmpty }"
		></canvas>
	</div>
</template>

<style scoped>
/* Estilos do container apenas */
</style>
