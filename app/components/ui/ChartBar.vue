<script setup lang="ts">
/**
 * 📊 ChartBar
 *
 * Componente de gráfico de barras reutilizável usando Chart.js
 * - Suporta múltiplas séries de dados
 * - Responsivo e adaptável ao tema (dark/light)
 * - Configurações customizáveis
 * - Animações suaves
 * - Suporta orientação horizontal e vertical
 */

import { Bar } from "vue-chartjs";
import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	BarElement,
	Title,
	Tooltip,
	Legend,
	type ChartData,
	type ChartOptions,
} from "chart.js";

// Registrar componentes do Chart.js
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface Dataset {
	label: string;
	data: number[];
	backgroundColor?: string | string[];
	borderColor?: string | string[];
	borderWidth?: number;
}

interface Props {
	/** Labels do eixo X (ou Y se horizontal) */
	labels: string[];
	/** Datasets (séries de dados) */
	datasets: Dataset[];
	/** Título do gráfico */
	title?: string;
	/** Altura do gráfico em pixels */
	height?: number;
	/** Mostrar legenda */
	showLegend?: boolean;
	/** Mostrar grid */
	showGrid?: boolean;
	/** Orientação do gráfico */
	orientation?: "vertical" | "horizontal";
	/** Empilhar barras */
	stacked?: boolean;
	/** Formato dos valores no tooltip */
	valueFormat?: (value: number) => string;
}

const props = withDefaults(defineProps<Props>(), {
	title: "",
	height: 300,
	showLegend: true,
	showGrid: true,
	orientation: "vertical",
	stacked: false,
	valueFormat: (value: number) => value.toString(),
});

// Detectar tema atual
const colorMode = useColorMode();
const isDark = computed(() => colorMode.value === "dark");

// Cores padrão baseadas no tema
const defaultColors = computed(() => ({
	primary: isDark.value ? "#60a5fa" : "#3b82f6",
	secondary: isDark.value ? "#34d399" : "#10b981",
	tertiary: isDark.value ? "#fbbf24" : "#f59e0b",
	quaternary: isDark.value ? "#f87171" : "#ef4444",
	quinary: isDark.value ? "#a78bfa" : "#8b5cf6",
	text: isDark.value ? "#e5e7eb" : "#374151",
	grid: isDark.value ? "#374151" : "#e5e7eb",
}));

// Preparar dados do gráfico
const chartData = computed<ChartData<"bar">>(() => ({
	labels: props.labels,
	datasets: props.datasets.map((dataset, index) => {
		const colors = [
			defaultColors.value.primary,
			defaultColors.value.secondary,
			defaultColors.value.tertiary,
			defaultColors.value.quaternary,
			defaultColors.value.quinary,
		];

		const color = colors[index % colors.length];

		return {
			label: dataset.label,
			data: dataset.data,
			backgroundColor: dataset.backgroundColor || color,
			borderColor: dataset.borderColor || color,
			borderWidth: dataset.borderWidth ?? 0,
			borderRadius: 4,
			borderSkipped: false,
		};
	}),
}));

// Opções do gráfico
const chartOptions = computed<ChartOptions<"bar">>(() => ({
	indexAxis: props.orientation === "horizontal" ? "y" : "x",
	responsive: true,
	maintainAspectRatio: false,
	plugins: {
		legend: {
			display: props.showLegend,
			position: "top",
			labels: {
				color: defaultColors.value.text,
				padding: 15,
				font: {
					size: 12,
					family: "Inter, system-ui, sans-serif",
				},
				usePointStyle: true,
				pointStyle: "circle",
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
					const label = context.dataset.label || "";
					const value = context.parsed.y;
					if (typeof value === "number") {
						return `${label}: ${props.valueFormat(value)}`;
					}
					return `${label}: -`;
				},
			},
		},
	},
	scales: {
		x: {
			stacked: props.stacked,
			grid: {
				display: props.showGrid,
				color: defaultColors.value.grid,
			},
			ticks: {
				color: defaultColors.value.text,
				font: {
					size: 11,
					family: "Inter, system-ui, sans-serif",
				},
			},
		},
		y: {
			stacked: props.stacked,
			beginAtZero: true,
			grid: {
				display: props.showGrid,
				color: defaultColors.value.grid,
			},
			ticks: {
				color: defaultColors.value.text,
				font: {
					size: 11,
					family: "Inter, system-ui, sans-serif",
				},
				callback: (value) => {
					if (typeof value === "number") {
						return props.valueFormat(value);
					}
					return value?.toString() || "";
				},
			},
		},
	},
}));
</script>

<template>
	<div class="chart-bar-container" :style="{ height: `${height}px` }">
		<Bar :data="chartData" :options="chartOptions" />
	</div>
</template>

<style scoped>
.chart-bar-container {
	position: relative;
	width: 100%;
}
</style>
