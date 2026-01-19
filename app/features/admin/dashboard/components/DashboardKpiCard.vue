<script setup lang="ts">
/**
 * 📊 DashboardKpiCard - Card Genérico para KPIs
 *
 * Componente reutilizável para exibir indicadores de performance
 * com ícone, valor, variação e formatação automática.
 */

interface Props {
	titulo: string;
	valor: number;
	variacao?: number;
	periodoComparacao?: string;
	icone: string;
	tipo?: "numero" | "moeda" | "percentual" | "tempo";
	cor?: "blue" | "green" | "yellow" | "red" | "purple" | "gray";
}

const props = withDefaults(defineProps<Props>(), {
	variacao: undefined,
	periodoComparacao: "período anterior",
	tipo: "numero",
	cor: "blue",
});

/**
 * Formata o valor baseado no tipo
 */
const valorFormatado = computed(() => {
	switch (props.tipo) {
		case "moeda":
			return new Intl.NumberFormat("pt-BR", {
				style: "currency",
				currency: "BRL",
			}).format(props.valor);

		case "percentual":
			return `${props.valor}%`;

		case "tempo":
			return `${props.valor}min`;

		case "numero":
		default:
			return new Intl.NumberFormat("pt-BR").format(props.valor);
	}
});

/**
 * Classes CSS para variação (positiva/negativa)
 */
const variacaoClass = computed(() => {
	if (props.variacao === undefined) return "";
	return props.variacao >= 0 ? "text-green-500" : "text-red-500";
});

/**
 * Classes CSS para cor de fundo do ícone
 */
const corFundo = computed(() => {
	const cores = {
		blue: "bg-blue-100 dark:bg-blue-900/20",
		green: "bg-green-100 dark:bg-green-900/20",
		yellow: "bg-yellow-100 dark:bg-yellow-900/20",
		red: "bg-red-100 dark:bg-red-900/20",
		purple: "bg-purple-100 dark:bg-purple-900/20",
		gray: "bg-gray-100 dark:bg-gray-900/20",
	};
	return cores[props.cor];
});

/**
 * Classes CSS para cor do ícone
 */
const corIcone = computed(() => {
	const cores = {
		blue: "text-blue-600 dark:text-blue-400",
		green: "text-green-600 dark:text-green-400",
		yellow: "text-yellow-600 dark:text-yellow-400",
		red: "text-red-600 dark:text-red-400",
		purple: "text-purple-600 dark:text-purple-400",
		gray: "text-gray-600 dark:text-gray-400",
	};
	return cores[props.cor];
});
</script>

<template>
	<UiCard class="p-6">
		<div class="flex items-center justify-between">
			<div class="flex-1">
				<p class="text-sm text-[var(--text-muted)] mb-1">{{ titulo }}</p>
				<p class="text-2xl font-bold text-[var(--text-primary)]">
					{{ valorFormatado }}
				</p>
				<div v-if="variacao !== undefined" class="flex items-center mt-2">
					<Icon
						:name="variacao >= 0 ? 'lucide:trending-up' : 'lucide:trending-down'"
						:class="['w-4 h-4 mr-1', variacaoClass]"
					/>
					<span :class="['text-sm font-medium', variacaoClass]"> {{ Math.abs(variacao) }}% </span>
					<span class="text-sm text-[var(--text-muted)] ml-1"> vs {{ periodoComparacao }} </span>
				</div>
			</div>
			<div class="w-12 h-12 rounded-lg flex items-center justify-center" :class="corFundo">
				<Icon :name="icone" class="w-6 h-6" :class="corIcone" />
			</div>
		</div>
	</UiCard>
</template>
