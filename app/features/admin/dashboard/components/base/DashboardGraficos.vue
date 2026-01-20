<script setup lang="ts">
/**
 * 📊 DashboardGraficos - Container de Gráficos Dinâmicos
 *
 * Componente que renderiza diferentes tipos de gráficos baseado na tab ativa:
 * - Pedidos: Gráfico de linha dupla (pedidos + faturamento por hora)
 * - Faturamento: Gráfico de linha comparativa semanal
 * - Status: Gráfico de pizza com distribuição de status
 * - Produtos: Gráfico de barras com ranking de produtos
 *
 * Usa Chart.js para renderização e suporte a temas dark/light.
 */

import { Chart, registerables, type TooltipItem } from "chart.js";
import type {
	ChartPedidosPorHora,
	ChartFaturamentoSemanal,
	ChartStatusDistribuicao,
	ChartProdutosRanking,
} from "../../types/dashboard";

// Registra todos os componentes do Chart.js
Chart.register(...registerables);

// Plugin customizado para forçar cor da legenda
const legendColorPlugin = {
	id: "legendColorPlugin",
	beforeInit(chart: Chart) {
		const originalGenerateLabels = chart.options.plugins?.legend?.labels?.generateLabels;
		if (chart.options.plugins?.legend?.labels) {
			chart.options.plugins.legend.labels.generateLabels = function (chart) {
				const labels = originalGenerateLabels ? originalGenerateLabels(chart) : [];
				// Força a cor em cada label
				return labels.map((label) => ({
					...label,
					fontColor: "#F1F5F9",
				}));
			};
		}
	},
};

Chart.register(legendColorPlugin);

// Configuração global de cores padrão para Chart.js
Chart.defaults.color = "#F1F5F9"; // Cor clara para textos
Chart.defaults.borderColor = "rgba(148, 163, 184, 0.1)"; // Cor para bordas

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

// Referência para o canvas
const chartCanvas = ref<HTMLCanvasElement>();
const chartInstance = ref<Chart>();

/**
 * Configuração do gráfico baseado no tipo
 */
const getChartConfig = (
	data:
		| ChartPedidosPorHora
		| ChartFaturamentoSemanal
		| ChartStatusDistribuicao
		| ChartProdutosRanking,
) => {
	// Configuração para gráfico de linha (Pedidos por Hora)
	if (props.type === "line" && "datasets" in data && "pedidos" in data.datasets) {
		const lineData = data as ChartPedidosPorHora;
		return {
			type: "line" as const,
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
				interaction: {
					mode: "index" as const,
					intersect: false,
				},
				plugins: {
					legend: {
						position: "top" as const,
					},
					tooltip: {
						callbacks: {
							label: function (context: TooltipItem<"line">) {
								const label = context.dataset.label || "";
								const value = context.parsed.y;

								if (value === null || value === undefined) {
									return `${label}: --`;
								}

								if (label.includes("Faturamento")) {
									return `${label}: ${new Intl.NumberFormat("pt-BR", {
										style: "currency",
										currency: "BRL",
									}).format(value)}`;
								}

								return `${label}: ${value}`;
							},
						},
					},
				},
				scales: {
					x: {
						display: true,
						title: {
							display: true,
							text: "Horário",
						},
						grid: {
							display: true,
							color: "rgba(148, 163, 184, 0.1)", // Grid mais visível
							drawOnChartArea: true,
							drawTicks: true,
						},
						ticks: {
							color: "rgba(148, 163, 184, 0.8)", // Labels mais visíveis
						},
					},
					y: {
						type: "linear" as const,
						display: true,
						position: "left" as const,
						title: {
							display: true,
							text: "Quantidade de Pedidos",
						},
						grid: {
							display: true,
							color: "rgba(148, 163, 184, 0.1)", // Grid mais visível
							drawOnChartArea: true,
						},
						ticks: {
							color: "rgba(148, 163, 184, 0.8)", // Labels mais visíveis
						},
					},
					y1: {
						type: "linear" as const,
						display: true,
						position: "right" as const,
						title: {
							display: true,
							text: "Faturamento (R$)",
						},
						grid: {
							drawOnChartArea: false, // Não desenha grid para não duplicar
						},
						ticks: {
							color: "rgba(148, 163, 184, 0.8)", // Labels mais visíveis
						},
					},
				},
			},
		};
	}

	// Configuração para gráfico de barras (Faturamento Semanal ou Produtos)
	if (props.type === "bar") {
		// Faturamento Semanal
		if ("datasets" in data && "atual" in (data as ChartFaturamentoSemanal).datasets) {
			const barData = data as ChartFaturamentoSemanal;
			return {
				type: "bar" as const,
				data: {
					labels: barData.labels,
					datasets: [
						{
							label: "Esta Semana",
							data: barData.datasets.atual,
							backgroundColor: "#3B82F6",
							borderColor: "#2563EB",
							borderWidth: 1,
						},
						{
							label: "Semana Anterior",
							data: barData.datasets.anterior,
							backgroundColor: "#94A3B8",
							borderColor: "#64748B",
							borderWidth: 1,
						},
					],
				},
				options: {
					responsive: true,
					maintainAspectRatio: false,
					plugins: {
						legend: {
							position: "top" as const,
						},
						tooltip: {
							callbacks: {
								label: function (context: TooltipItem<"bar">) {
									const value = context.parsed.y;
									if (value === null || value === undefined) {
										return `${context.dataset.label}: R$ 0,00`;
									}
									return `${context.dataset.label}: ${new Intl.NumberFormat("pt-BR", {
										style: "currency",
										currency: "BRL",
									}).format(value)}`;
								},
							},
						},
					},
					scales: {
						x: {
							title: {
								display: true,
								text: "Dias da Semana",
							},
							grid: {
								display: true,
								color: "rgba(148, 163, 184, 0.1)", // Grid mais visível
								drawOnChartArea: true,
								drawTicks: true,
							},
							ticks: {
								color: "rgba(148, 163, 184, 0.8)", // Labels mais visíveis
							},
						},
						y: {
							title: {
								display: true,
								text: "Faturamento (R$)",
							},
							grid: {
								display: true,
								color: "rgba(148, 163, 184, 0.1)", // Grid mais visível
								drawOnChartArea: true,
							},
							ticks: {
								color: "rgba(148, 163, 184, 0.8)", // Labels mais visíveis
								callback: function (value: string | number) {
									// Garante que value é um número válido
									const numValue = typeof value === "string" ? parseFloat(value) : value;
									if (typeof numValue !== "number" || isNaN(numValue)) {
										return "R$ 0,00";
									}
									return new Intl.NumberFormat("pt-BR", {
										style: "currency",
										currency: "BRL",
									}).format(numValue);
								},
							},
						},
					},
				},
			};
		}

		// Produtos Ranking
		if ("data" in data && Array.isArray((data as ChartProdutosRanking).data)) {
			const produtoData = data as ChartProdutosRanking;
			return {
				type: "bar" as const,
				data: {
					labels: produtoData.labels,
					datasets: [
						{
							label: "Quantidade Vendida",
							data: produtoData.data,
							backgroundColor: "#10B981",
							borderColor: "#059669",
							borderWidth: 1,
						},
					],
				},
				options: {
					responsive: true,
					maintainAspectRatio: false,
					indexAxis: "y" as const,
					plugins: {
						legend: {
							display: false,
						},
						tooltip: {
							callbacks: {
								label: function (context: TooltipItem<"bar">) {
									const value = context.parsed.x;
									if (value === null || value === undefined) {
										return "Vendidos: 0";
									}
									return `Vendidos: ${value}`;
								},
							},
						},
					},
					scales: {
						x: {
							title: {
								display: true,
								text: "Quantidade Vendida",
							},
							grid: {
								display: true,
								color: "rgba(148, 163, 184, 0.1)", // Grid mais visível
								drawOnChartArea: true,
							},
							ticks: {
								color: "rgba(148, 163, 184, 0.8)", // Labels mais visíveis
							},
						},
						y: {
							title: {
								display: true,
								text: "Produtos",
							},
							grid: {
								display: false, // Não precisa grid horizontal em barras horizontais
							},
							ticks: {
								color: "rgba(148, 163, 184, 0.8)", // Labels mais visíveis
							},
						},
					},
				},
			};
		}
	}

	// Configuração para gráfico de rosca (Status)
	if (props.type === "doughnut" && "data" in data) {
		const doughnutData = data as ChartStatusDistribuicao;
		return {
			type: "doughnut" as const,
			data: {
				labels: doughnutData.labels,
				datasets: [
					{
						data: doughnutData.data,
						backgroundColor: doughnutData.colors || [
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
				plugins: {
					legend: {
						position: "right" as const,
						labels: {
							color: "rgba(148, 163, 184, 0.9)", // Labels mais visíveis
							padding: 12,
							font: {
								size: 12,
							},
						},
					},
					tooltip: {
						callbacks: {
							label: function (context: TooltipItem<"doughnut">) {
								const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
								const value = context.parsed;
								if (value === null || value === undefined) {
									return `${context.label}: 0 (0.0%)`;
								}
								const percentage = ((value / total) * 100).toFixed(1);
								return `${context.label}: ${value} (${percentage}%)`;
							},
						},
					},
				},
			},
		};
	}

	// Configuração para gráfico de pizza (Status)
	if (props.type === "pie" && "data" in data) {
		const pieData = data as ChartStatusDistribuicao;

		return {
			type: "pie" as const,
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
				// Reduz o tamanho da pizza
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
						position: "right" as const,
						labels: {
							color: "#F1F5F9", // Cor bem clara (quase branco)
							padding: 12,
							font: {
								size: 13,
								weight: 500, // Número em vez de string
							},
							// Adiciona quantidade e percentual na legenda
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
										};
									});
								}
								return [];
							},
						},
					},
					tooltip: {
						callbacks: {
							label: function (context: TooltipItem<"pie">) {
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

	// Fallback para configuração básica
	return {
		type: props.type,
		data: {
			labels: [],
			datasets: [],
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
		},
	};
};

/**
 * Cria ou atualiza o gráfico (SEM destruir desnecessariamente)
 */
const updateChart = () => {
	// Verifica se tem dados e canvas disponível
	if (!props.data || !chartCanvas.value) {
		return;
	}

	// Se já existe gráfico, apenas atualiza os dados (MUITO mais rápido)
	if (chartInstance.value) {
		try {
			const config = getChartConfig(props.data);
			chartInstance.value.data = config.data;
			chartInstance.value.update("none"); // Update sem animação
			return;
		} catch {
			// Se falhar, destrói e recria
			chartInstance.value.destroy();
			chartInstance.value = undefined;
		}
	}

	// Cria novo gráfico apenas se não existir
	try {
		const config = getChartConfig(props.data);

		// Desabilita animações
		if (config.options) {
			// @ts-expect-error - animation existe mas não está nos tipos
			config.options.animation = false;
		}

		chartInstance.value = new Chart(chartCanvas.value, config);
	} catch {
		// Ignora erros
	}
};

// Observa mudanças nos dados (NÃO destrói o gráfico, apenas atualiza)
watch(
	() => props.data,
	() => {
		nextTick(() => {
			updateChart();
		});
	},
	{ deep: true },
);

// Inicializa o gráfico quando o componente é montado
onMounted(() => {
	nextTick(() => {
		updateChart();
	});
});

// Limpa o gráfico quando o componente é desmontado
onBeforeUnmount(() => {
	// Usa onBeforeUnmount para destruir antes do DOM ser removido
	if (chartInstance.value) {
		try {
			chartInstance.value.destroy();
		} catch {
			// Ignora erros de destruição
		}
		chartInstance.value = undefined;
	}
});
</script>

<template>
	<div class="w-full h-full chart-container">
		<!-- Canvas renderizado apenas quando há dados -->
		<canvas v-if="data" ref="chartCanvas" class="w-full h-full"></canvas>

		<!-- Estado vazio -->
		<div v-else class="flex items-center justify-center h-full">
			<div class="text-center">
				<Icon name="lucide:line-chart" class="w-12 h-12 text-[var(--text-muted)] mx-auto mb-2" />
				<p class="text-sm text-[var(--text-muted)]">Nenhum dado disponível</p>
			</div>
		</div>
	</div>
</template>

<style scoped>
/* Força a cor do texto da legenda do Chart.js */
.chart-container :deep(canvas) {
	color: #f1f5f9 !important;
}

/* Força a cor de todos os textos dentro do container do gráfico */
.chart-container :deep(*) {
	color: #f1f5f9 !important;
}

/* Ataca diretamente os elementos de legenda do Chart.js */
.chart-container :deep(.chartjs-legend),
.chart-container :deep(.chartjs-legend *),
.chart-container :deep([class*="legend"]),
.chart-container :deep([class*="legend"] *) {
	color: #f1f5f9 !important;
}

/* Força cor nos spans e divs da legenda */
.chart-container :deep(span),
.chart-container :deep(div) {
	color: #f1f5f9 !important;
}
</style>
