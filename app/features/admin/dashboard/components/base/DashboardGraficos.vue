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
					},
					y: {
						type: "linear" as const,
						display: true,
						position: "left" as const,
						title: {
							display: true,
							text: "Quantidade de Pedidos",
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
							drawOnChartArea: false,
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
						},
						y: {
							title: {
								display: true,
								text: "Faturamento (R$)",
							},
							ticks: {
								callback: function (value: string | number) {
									const numValue = typeof value === "string" ? parseFloat(value) : value;
									if (isNaN(numValue)) return "R$ 0,00";
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
						},
						y: {
							title: {
								display: true,
								text: "Produtos",
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
 * Cria ou atualiza o gráfico
 */
const updateChart = () => {
	if (!chartCanvas.value || !props.data) return;

	// Destrói gráfico anterior se existir
	if (chartInstance.value) {
		chartInstance.value.destroy();
	}

	// Cria novo gráfico
	const config = getChartConfig(props.data);
	chartInstance.value = new Chart(chartCanvas.value, config);
};

// Observa mudanças nos dados
watch(() => props.data, updateChart, { deep: true });

// Inicializa o gráfico quando o componente é montado
onMounted(() => {
	nextTick(() => {
		updateChart();
	});
});

// Limpa o gráfico quando o componente é desmontado
onUnmounted(() => {
	if (chartInstance.value) {
		chartInstance.value.destroy();
	}
});
</script>

<template>
	<div class="w-full h-full">
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
