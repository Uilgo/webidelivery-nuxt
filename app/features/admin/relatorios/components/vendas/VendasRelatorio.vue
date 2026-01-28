<script setup lang="ts">
/**
 * 💰 VendasRelatorio
 *
 * Container principal do relatório de vendas:
 * - Orquestra KPIs, gráficos, comparativo e tabela
 * - Gerencia loading states
 * - Design premium com headers de seção e estrutura otimizada
 */

import VendasKpis from "./VendasKpis.vue";
import VendasGraficos from "./VendasGraficos.vue";
import VendasComparativo from "./VendasComparativo.vue";
import VendasTabela from "./VendasTabela.vue";
import { useRelatoriosVendas } from "../../composables/useRelatoriosVendas";

// Watch já está dentro do composable
const { dados, loading, error } = useRelatoriosVendas();
</script>

<template>
	<div class="vendas-relatorio space-y-10">
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

		<!-- Seção: KPIs (Métricas de Vendas) -->
		<section>
			<div class="flex items-center gap-3 mb-6">
				<div
					class="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/25"
				>
					<Icon name="lucide:dollar-sign" class="w-5 h-5 text-white" />
				</div>
				<div>
					<h2 class="text-lg font-bold text-gray-900 dark:text-white">Métricas de Vendas</h2>
					<p class="text-sm text-gray-500 dark:text-gray-400">
						Indicadores financeiros do período selecionado
					</p>
				</div>
			</div>
			<VendasKpis :dados="dados?.kpis" :loading="loading" />
		</section>

		<!-- Seção: Comparativo -->
		<section>
			<div class="flex items-center gap-3 mb-6">
				<div
					class="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25"
				>
					<Icon name="lucide:git-compare" class="w-5 h-5 text-white" />
				</div>
				<div>
					<h2 class="text-lg font-bold text-gray-900 dark:text-white">Comparativo de Períodos</h2>
					<p class="text-sm text-gray-500 dark:text-gray-400">
						Análise de desempenho vs período anterior
					</p>
				</div>
			</div>
			<VendasComparativo :dados="dados?.comparativo" :loading="loading" />
		</section>

		<!-- Seção: Gráficos (Análise de Faturamento) -->
		<section>
			<div class="flex items-center gap-3 mb-6">
				<div
					class="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-sky-600 flex items-center justify-center shadow-lg shadow-blue-500/25"
				>
					<Icon name="lucide:trending-up" class="w-5 h-5 text-white" />
				</div>
				<div>
					<h2 class="text-lg font-bold text-gray-900 dark:text-white">Análise de Faturamento</h2>
					<p class="text-sm text-gray-500 dark:text-gray-400">
						Evolução das vendas e performance por categoria
					</p>
				</div>
			</div>
			<VendasGraficos :dados="dados?.graficos" :loading="loading" />
		</section>

		<!-- Seção: Tabela (Vendas Detalhadas) -->
		<section>
			<div class="flex items-center gap-3 mb-6">
				<div
					class="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-orange-500/25"
				>
					<Icon name="lucide:file-text" class="w-5 h-5 text-white" />
				</div>
				<div>
					<h2 class="text-lg font-bold text-gray-900 dark:text-white">Vendas Detalhadas</h2>
					<p class="text-sm text-gray-500 dark:text-gray-400">Histórico completo de transações</p>
				</div>
			</div>
			<VendasTabela :dados="dados?.tabela" :loading="loading" />
		</section>
	</div>
</template>
