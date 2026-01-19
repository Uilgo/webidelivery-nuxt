<script setup lang="ts">
/**
 * 📊 DashboardStatsCard - Card de Estatística (KPI)
 *
 * Componente visual para os cards do topo da dashboard via props.
 * Mantém o design original com gradientes e micro-interações.
 */

interface DashboardStatsCardProps {
	title: string;
	value: string | number;
	icon: string;
	variant?: "emerald" | "blue" | "violet" | "rose";
	trend?: {
		value: number;
		label?: string; // ex: "vs. ontem"
		positive?: boolean; // se true usa ícone up, false down
	};
	secondaryLabel?: string;
	secondaryValue?: string;
}

const props = withDefaults(defineProps<DashboardStatsCardProps>(), {
	variant: "emerald",
	trend: undefined,
	secondaryLabel: "",
	secondaryValue: "",
});

// Mapeamento de estilos baseados na variante
const variantStyles = computed(() => {
	const map = {
		emerald: {
			bg: "from-emerald-500 to-emerald-700",
			textSub: "text-emerald-100",
		},
		blue: {
			bg: "from-blue-500 to-blue-700",
			textSub: "text-blue-100",
		},
		violet: {
			bg: "from-violet-500 to-violet-700",
			textSub: "text-violet-100",
		},
		rose: {
			bg: "from-rose-500 to-rose-700",
			textSub: "text-rose-100",
		},
	};
	return map[props.variant];
});
</script>

<template>
	<div
		class="relative overflow-hidden rounded-xl bg-gradient-to-br text-white shadow-lg p-6 group hover:shadow-xl transition-all"
		:class="variantStyles.bg"
	>
		<!-- Cabeçalho: Título + Valor + Ícone Flutuante -->
		<div class="flex justify-between items-start mb-4">
			<div>
				<p class="text-sm font-medium" :class="variantStyles.textSub">
					{{ title }}
				</p>
				<h3 class="text-2xl font-bold mt-1">{{ value }}</h3>
			</div>
			<div class="p-2 bg-white/20 rounded-lg text-white group-hover:scale-110 transition-transform">
				<Icon :name="icon" class="w-5 h-5" />
			</div>
		</div>

		<!-- Rodapé: Trend + Info Secundária -->
		<div class="flex items-center justify-between text-xs">
			<span
				v-if="trend"
				class="flex items-center gap-1 font-medium bg-white/20 px-1.5 py-0.5 rounded backdrop-blur-sm"
			>
				<Icon
					:name="trend.positive ? 'lucide:trending-up' : 'lucide:trending-down'"
					class="w-3 h-3"
				/>
				{{ trend.value > 0 ? "+" : "" }}{{ trend.value }}%
			</span>

			<span v-if="secondaryLabel || secondaryValue" :class="variantStyles.textSub">
				{{ secondaryLabel }}
				<strong v-if="secondaryValue" class="text-white ml-1">{{ secondaryValue }}</strong>
			</span>
		</div>
	</div>
</template>
