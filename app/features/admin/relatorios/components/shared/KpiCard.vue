<script setup lang="ts">
/**
 * 📌 KpiCard
 *
 * Card de métrica (KPI) com valor principal, variação percentual e indicador visual.
 * Usado em todos os relatórios para exibir métricas chave.
 * Design premium com gradientes, efeitos hover e visual moderno.
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
		class="group relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 transition-all duration-300 hover:-translate-y-1 shadow-lg shadow-gray-200/50 dark:shadow-black/20 hover:shadow-xl hover:shadow-gray-300/50 dark:hover:shadow-black/30"
	>
		<!-- Linha colorida no topo -->
		<div
			class="h-1 w-full"
			:style="{ background: `linear-gradient(90deg, ${kpi.cor}, ${kpi.cor}80)` }"
		></div>

		<!-- Efeito de brilho no hover -->
		<div
			class="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out pointer-events-none"
		></div>

		<!-- Loading State -->
		<div v-if="loading" class="p-5 space-y-4">
			<div class="flex items-center justify-between">
				<div class="h-4 w-28 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700"></div>
				<div class="h-12 w-12 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700"></div>
			</div>
			<div class="h-10 w-36 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700"></div>
			<div class="h-6 w-24 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700"></div>
		</div>

		<!-- Content -->
		<div v-else class="relative p-5">
			<!-- Header: Título e Ícone -->
			<div class="flex items-start justify-between gap-3 mb-4">
				<div class="flex-1 min-w-0">
					<p class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 truncate">
						{{ kpi.titulo }}
					</p>
					<!-- Valor Principal -->
					<p class="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
						{{ valorFormatado }}
					</p>
				</div>

				<!-- Ícone com fundo gradiente -->
				<div
					v-if="kpi.icone"
					class="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
					:style="{
						background: `linear-gradient(135deg, ${kpi.cor}, ${kpi.cor}99)`,
						boxShadow: `0 4px 14px ${kpi.cor}40`,
					}"
				>
					<Icon :name="kpi.icone" class="w-6 h-6 text-white" />
				</div>
			</div>

			<!-- Variação em Badge -->
			<div v-if="kpi.variacao !== undefined" class="flex items-center gap-2">
				<span
					class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full"
					:class="{
						'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400':
							kpi.variacao_tipo === 'aumento',
						'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400':
							kpi.variacao_tipo === 'reducao',
						'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300':
							kpi.variacao_tipo === 'neutro',
					}"
				>
					<Icon
						:name="
							kpi.variacao_tipo === 'aumento'
								? 'lucide:trending-up'
								: kpi.variacao_tipo === 'reducao'
									? 'lucide:trending-down'
									: 'lucide:minus'
						"
						class="w-3.5 h-3.5"
					/>
					{{ kpi.variacao >= 0 ? "+" : "" }}{{ kpi.variacao.toFixed(1) }}%
				</span>
				<span class="text-xs text-gray-400 dark:text-gray-500">vs anterior</span>
			</div>

			<!-- Descrição adicional -->
			<p v-if="kpi.descricao" class="mt-3 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
				{{ kpi.descricao }}
			</p>
		</div>
	</div>
</template>
