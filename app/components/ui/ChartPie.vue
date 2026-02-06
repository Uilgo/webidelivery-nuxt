<script setup lang="ts">
/**
 * 🥧 ChartPie
 *
 * Componente de gráfico de pizza/donut reutilizável usando Chart.js
 * - Suporta modo pizza e donut
 * - Responsivo e adaptável ao tema (dark/light)
 * - Configurações customizáveis
 * - Animações suaves
 * - Legendas posicionáveis
 */

import { Pie, Doughnut } from "vue-chartjs";
import { Chart as ChartJS, ArcElement, Title, Tooltip, Legend, type ChartOptions } from "chart.js";

// Registrar componentes do Chart.js
ChartJS.register(ArcElement, Title, Tooltip, Legend);

interface Props {
	/** Labels dos segmentos */
	labels: string[];
	/** Dados dos segmentos */
	data: number[];
	/** Cores customizadas (opcional) */
	colors?: string[];
	/** Título do gráfico */
	title?: string;
	/** Altura do gráfico em pixels */
	height?: number;
	/** Mostrar legenda */
	showLegend?: boolean;
	/** Posição da legenda */
	legendPosition?: "top" | "bottom" | "left" | "right";
	/** Tipo de gráfico */
	type?: "pie" | "doughnut";
	/** Espessura do donut (0-100, apenas para doughnut) */
	cutout?: number;
	/** Formato dos valores no tooltip */
	valueFormat?: (value: number) => string;
	/** Mostrar percentual no tooltip */
	showPercentage?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	colors: () => [],
	title: "",
	height: 300,
	showLegend: true,
	legendPosition: "right",
	type: "pie",
	cutout: 50,
	valueFormat: (value: number) => value.toString(),
	showPercentage: true,
});

// Detectar tema atual
const colorMode = useColorMode();
const isDark = computed(() => colorMode.value === "dark");

// Cores padrão baseadas no tema
const defaultColors = computed(() => {
	const baseColors = [
		isDark.value ? "#60a5fa" : "#3b82f6", // blue
		isDark.value ? "#34d399" : "#10b981", // green
		isDark.value ? "#fbbf24" : "#f59e0b", // yellow
		isDark.value ? "#f87171" : "#ef4444", // red
		isDark.value ? "#a78bfa" : "#8b5cf6", // purple
		isDark.value ? "#fb923c" : "#f97316", // orange
		isDark.value ? "#2dd4bf" : "#14b8a6", // teal
		isDark.value ? "#f472b6" : "#ec4899", // pink
	];

	return {
		colors: baseColors,
		text: isDark.value ? "#e5e7eb" : "#374151",
		grid: isDark.value ? "#374151" : "#e5e7eb",
	};
});

// Calcular total para percentuais
const total = computed(() => props.data.reduce((sum, value) => sum + value, 0));

// Preparar dados do gráfico
const chartData = computed(() => ({
	labels: props.labels,
	datasets: [
		{
			data: props.data,
			backgroundColor:
				props.colors && props.colors.length > 0 ? props.colors : defaultColors.value.colors,
			borderColor: isDark.value ? "#1f2937" : "#ffffff",
			borderWidth: 2,
			hoverOffset: 8,
		},
	],
}));

// Opções do gráfico
const chartOptions = computed<ChartOptions<"pie" | "doughnut">>(() => ({
	responsive: true,
	maintainAspectRatio: false,
	cutout: props.type === "doughnut" ? `${props.cutout}%` : undefined,
	plugins: {
		legend: {
			display: props.showLegend,
			position: props.legendPosition,
			labels: {
				color: defaultColors.value.text,
				padding: 15,
				font: {
					size: 12,
					family: "Inter, system-ui, sans-serif",
				},
				usePointStyle: true,
				pointStyle: "circle",
				generateLabels: (chart) => {
					const data = chart.data;
					if (data.labels && data.datasets.length && data.datasets[0]) {
						return data.labels.map((label, i) => {
							const dataset = data.datasets[0];
							const value = dataset?.data[i] as number;
							const percentage = total.value > 0 ? ((value / total.value) * 100).toFixed(1) : "0";
							const bgColors = dataset?.backgroundColor as string[] | undefined;

							return {
								text: props.showPercentage ? `${label} (${percentage}%)` : (label as string),
								fillStyle:
									bgColors?.[i] ||
									defaultColors.value.colors[i % defaultColors.value.colors.length],
								hidden: false,
								index: i,
							};
						});
					}
					return [];
				},
			},
		},
		title: {
			display: !!props.title,
			text: props.title,
			color: defaultColors.value.text,
			font: {
				size: 16,
				weight: "bold",
				family: "Inter, system-ui, sans-serif",
			},
			padding: {
				top: 10,
				bottom: 20,
			},
		},
		tooltip: {
			backgroundColor: isDark.value ? "#1f2937" : "#ffffff",
			titleColor: defaultColors.value.text,
			bodyColor: defaultColors.value.text,
			borderColor: defaultColors.value.grid,
			borderWidth: 1,
			padding: 12,
			displayColors: true,
			callbacks: {
				label: (context) => {
					const label = context.label || "";
					const value = context.parsed;
					const percentage = total.value > 0 ? ((value / total.value) * 100).toFixed(1) : "0";

					if (typeof value === "number") {
						const formattedValue = props.valueFormat(value);
						return props.showPercentage
							? `${label}: ${formattedValue} (${percentage}%)`
							: `${label}: ${formattedValue}`;
					}
					return `${label}: -`;
				},
			},
		},
	},
}));

// Componente dinâmico baseado no tipo
const ChartComponent = computed(() => (props.type === "doughnut" ? Doughnut : Pie));
</script>

<template>
	<div class="chart-pie-container" :style="{ height: `${height}px` }">
		<component :is="ChartComponent" :data="chartData" :options="chartOptions" />
	</div>
</template>

<style scoped>
.chart-pie-container {
	position: relative;
	width: 100%;
	display: flex;
	align-items: center;
	justify-content: center;
}
</style>
