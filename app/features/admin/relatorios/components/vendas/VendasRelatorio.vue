<script setup lang="ts">
/**
 * 💰 VendasRelatorio
 *
 * Container principal do relatório de vendas:
 * - Orquestra KPIs, gráficos, comparativo e tabela
 * - Gerencia loading states
 * - Integra com composable de dados
 */

import { watch } from "vue";
import type { FiltrosPeriodo } from "../../types/relatorios";
import VendasKpis from "./VendasKpis.vue";
import VendasGraficos from "./VendasGraficos.vue";
import VendasComparativo from "./VendasComparativo.vue";
import VendasTabela from "./VendasTabela.vue";
import { useRelatoriosVendas } from "../../composables/useRelatoriosVendas";
import { useRelatoriosFiltros } from "../../composables/useRelatoriosFiltros";

const { dados, loading, error } = useRelatoriosVendas();
const { periodo } = useRelatoriosFiltros();

// Buscar dados quando o período mudar
watch(
	periodo,
	async (novoPeriodo: FiltrosPeriodo) => {
		const { fetchDados } = useRelatoriosVendas();
		await fetchDados(novoPeriodo);
	},
	{ immediate: true },
);
</script>

<template>
	<div class="vendas-relatorio space-y-6">
		<!-- Erro -->
		<div
			v-if="error"
			class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
		>
			<div class="flex items-center gap-2 text-red-800 dark:text-red-200">
				<Icon name="lucide:alert-circle" class="w-5 h-5" />
				<span class="font-medium">Erro ao carregar dados:</span>
				<span>{{ error }}</span>
			</div>
		</div>

		<!-- KPIs -->
		<section>
			<h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
				Métricas de Vendas
			</h2>
			<VendasKpis :dados="dados?.kpis" :loading="loading" />
		</section>

		<!-- Comparativo -->
		<section>
			<h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
				Comparativo de Períodos
			</h2>
			<VendasComparativo :dados="dados?.comparativo" :loading="loading" />
		</section>

		<!-- Gráficos -->
		<section>
			<h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
				Análise de Faturamento
			</h2>
			<VendasGraficos :dados="dados?.graficos" :loading="loading" />
		</section>

		<!-- Tabela Detalhada -->
		<section>
			<h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Vendas Detalhadas</h2>
			<VendasTabela :dados="dados?.tabela" :loading="loading" />
		</section>
	</div>
</template>
