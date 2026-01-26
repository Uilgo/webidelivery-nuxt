<script setup lang="ts">
/**
 * 📦 PedidosRelatorio
 *
 * Container principal do relatório de pedidos:
 * - Orquestra KPIs, gráficos e tabela
 * - Gerencia loading states
 * - Integra com composable de dados
 * - Design premium com seções bem definidas
 */

import PedidosKpis from "./PedidosKpis.vue";
import PedidosGraficos from "./PedidosGraficos.vue";
import PedidosTabela from "./PedidosTabela.vue";
import { useRelatoriosPedidos } from "../../composables/useRelatoriosPedidos";
import { useRelatoriosFiltros } from "../../composables/useRelatoriosFiltros";

const { dados, loading, error } = useRelatoriosPedidos();
const { periodo } = useRelatoriosFiltros();

// Buscar dados quando o período mudar
watch(
	periodo,
	async (novoPeriodo) => {
		const { fetchDados } = useRelatoriosPedidos();
		await fetchDados(novoPeriodo);
	},
	{ immediate: true },
);
</script>

<template>
	<div class="pedidos-relatorio space-y-8">
		<!-- Erro -->
		<div
			v-if="error"
			class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4"
		>
			<div class="flex items-center gap-3 text-red-800 dark:text-red-200">
				<div
					class="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-500/20 flex items-center justify-center shrink-0"
				>
					<Icon name="lucide:alert-circle" class="w-5 h-5" />
				</div>
				<div>
					<span class="font-semibold block">Erro ao carregar dados</span>
					<span class="text-sm opacity-80">{{ error }}</span>
				</div>
			</div>
		</div>

		<!-- Seção: KPIs (Métricas Principais) -->
		<section>
			<div class="flex items-center gap-3 mb-5">
				<div
					class="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25"
				>
					<Icon name="lucide:bar-chart-3" class="w-5 h-5 text-white" />
				</div>
				<div>
					<h2 class="text-lg font-bold text-gray-900 dark:text-white">Métricas Principais</h2>
					<p class="text-sm text-gray-500 dark:text-gray-400">
						Indicadores de desempenho do período selecionado
					</p>
				</div>
			</div>
			<PedidosKpis :dados="dados?.kpis" :loading="loading" />
		</section>

		<!-- Seção: Gráficos (Análise Visual) -->
		<section>
			<div class="flex items-center gap-3 mb-5">
				<div
					class="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/25"
				>
					<Icon name="lucide:pie-chart" class="w-5 h-5 text-white" />
				</div>
				<div>
					<h2 class="text-lg font-bold text-gray-900 dark:text-white">Análise Visual</h2>
					<p class="text-sm text-gray-500 dark:text-gray-400">
						Gráficos detalhados para insights rápidos
					</p>
				</div>
			</div>
			<PedidosGraficos :dados="dados?.graficos" :loading="loading" />
		</section>

		<!-- Seção: Tabela (Pedidos Detalhados) -->
		<section>
			<div class="flex items-center gap-3 mb-5">
				<div
					class="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25"
				>
					<Icon name="lucide:list" class="w-5 h-5 text-white" />
				</div>
				<div>
					<h2 class="text-lg font-bold text-gray-900 dark:text-white">Pedidos Detalhados</h2>
					<p class="text-sm text-gray-500 dark:text-gray-400">
						Lista completa com filtros e ordenação
					</p>
				</div>
			</div>
			<PedidosTabela :dados="dados?.tabela" :loading="loading" />
		</section>
	</div>
</template>
