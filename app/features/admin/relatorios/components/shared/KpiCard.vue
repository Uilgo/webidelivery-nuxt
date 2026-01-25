<script setup lang="ts">
/**
 * 📌 KpiCard
 *
 * Card de métrica (KPI) com valor principal, variação percentual e indicador visual.
 * Usado em todos os relatórios para exibir métricas chave.
 */

import { computed } from "vue";
import type { KpiBase } from "../../types/relatorios";
import { formatarValorKpi } from "../../utils/formatadores";

/**
 * Props do componente
 */
interface Props {
	kpi: KpiBase;
	loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	loading: false,
});

/**
 * Formata o valor do KPI baseado no formato especificado
 */
const valorFormatado = computed<string>(() => {
	return formatarValorKpi(props.kpi.valor, props.kpi.formato);
});
</script>

<template>
	<div
		class="relative overflow-hidden rounded-lg border bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:bg-gray-800 dark:border-gray-700"
	>
		<!-- Loading State -->
		<div v-if="loading" class="space-y-3">
			<div class="h-4 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
			<div class="h-8 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
			<div class="h-3 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
		</div>

		<!-- Content -->
		<div v-else class="space-y-2">
			<!-- Título e Ícone -->
			<div class="flex items-center justify-between">
				<p class="text-sm font-medium text-gray-600 dark:text-gray-400">
					{{ kpi.titulo }}
				</p>
				<div
					v-if="kpi.icone"
					class="flex h-10 w-10 items-center justify-center rounded-full"
					:style="{ backgroundColor: `${kpi.cor}20` }"
				>
					<Icon :name="kpi.icone" :style="{ color: kpi.cor }" class="h-5 w-5" />
				</div>
			</div>

			<!-- Valor Principal -->
			<div class="flex items-baseline gap-2">
				<p class="text-3xl font-bold text-gray-900 dark:text-white">
					{{ valorFormatado }}
				</p>
			</div>

			<!-- Variação -->
			<div v-if="kpi.variacao !== undefined" class="flex items-center gap-1">
				<!-- Seta de variação -->
				<Icon
					v-if="kpi.variacao_tipo === 'aumento'"
					name="lucide:trending-up"
					class="h-4 w-4 text-green-600"
				/>
				<Icon
					v-else-if="kpi.variacao_tipo === 'reducao'"
					name="lucide:trending-down"
					class="h-4 w-4 text-red-600"
				/>
				<Icon v-else name="lucide:minus" class="h-4 w-4 text-gray-400" />

				<!-- Percentual -->
				<span
					class="text-sm font-medium"
					:class="{
						'text-green-600': kpi.variacao_tipo === 'aumento',
						'text-red-600': kpi.variacao_tipo === 'reducao',
						'text-gray-500': kpi.variacao_tipo === 'neutro',
					}"
				>
					{{ Math.abs(kpi.variacao).toFixed(1) }}%
				</span>

				<span class="text-xs text-gray-500 dark:text-gray-400">vs período anterior</span>
			</div>

			<!-- Descrição adicional -->
			<p v-if="kpi.descricao" class="text-xs text-gray-500 dark:text-gray-400">
				{{ kpi.descricao }}
			</p>
		</div>
	</div>
</template>
