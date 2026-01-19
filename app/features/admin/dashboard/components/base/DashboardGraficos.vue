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
import type { ChartPedidosPorHora } from "../../types/dashboard";

// Registra todos os componentes do Chart.js
Chart.register(...registerables);

interface Props {
	data: ChartPedidosPorHora | null;
}

const props = defineProps<Props>();

// Referência para o canvas
const chartCanvas = ref<HTMLCanvasElement>();
const chartInstance = ref<Chart>();

/**
 * Configuração do gráfico
 */
const getChartConfig = (data: ChartPedidosPorHora) => {
	return {
		type: "line" as const,
		data: {
			labels: data.labels,
			datasets: [
				{
					label: "Pedidos",
					data: data.datasets.pedidos,
					borderColor: "#3B82F6",
					backgroundColor: "#3B82F6",
					tension: 0.4,
					fill: false,
				},
				{
					label: "Faturamento (R$)",
					data: data.datasets.faturamento,
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

							// Verifica se o valor é válido
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
				<p class="text-sm text-[var(--text-muted)]">Nenhum dado de pedidos disponível</p>
			</div>
		</div>
	</div>
</template>
