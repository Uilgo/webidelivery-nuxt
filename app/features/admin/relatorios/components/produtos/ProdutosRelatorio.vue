<script setup lang="ts">
/**
 * 📦 ProdutosRelatorio
 *
 * Container principal do relatório de produtos:
 * - Orquestra KPIs, ranking, gráficos e tabela
 * - Gerencia loading states
 * - Design premium com headers de seção e estrutura otimizada
 */

import { watch } from "vue";
import type { FiltrosPeriodo } from "../../types/relatorios";
import ProdutosKpis from "./ProdutosKpis.vue";
import ProdutosRanking from "./ProdutosRanking.vue";
import ProdutosGraficos from "./ProdutosGraficos.vue";
import ProdutosTabela from "./ProdutosTabela.vue";
import { useRelatoriosProdutos } from "../../composables/useRelatoriosProdutos";
import { useRelatoriosFiltros } from "../../composables/useRelatoriosFiltros";

const { dados, loading, error } = useRelatoriosProdutos();
const { periodo } = useRelatoriosFiltros();

// Buscar dados quando o período mudar
watch(
	periodo,
	async (novoPeriodo: FiltrosPeriodo) => {
		const { fetchDados } = useRelatoriosProdutos();
		await fetchDados(novoPeriodo);
	},
	{ immediate: true },
);
</script>

<template>
	<div class="produtos-relatorio space-y-10">
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

		<!-- Seção: KPIs (Métricas de Produtos) -->
		<section>
			<div class="flex items-center gap-3 mb-6">
				<div
					class="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25"
				>
					<Icon name="lucide:package" class="w-5 h-5 text-white" />
				</div>
				<div>
					<h2 class="text-lg font-bold text-gray-900 dark:text-white">Métricas de Produtos</h2>
					<p class="text-sm text-gray-500 dark:text-gray-400">
						Performance geral do catálogo no período
					</p>
				</div>
			</div>
			<ProdutosKpis :dados="dados?.kpis" :loading="loading" />
		</section>

		<!-- Seção: Ranking -->
		<section>
			<div class="flex items-center gap-3 mb-6">
				<div
					class="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center shadow-lg shadow-amber-500/25"
				>
					<Icon name="lucide:trophy" class="w-5 h-5 text-white" />
				</div>
				<div>
					<h2 class="text-lg font-bold text-gray-900 dark:text-white">Ranking de Produtos</h2>
					<p class="text-sm text-gray-500 dark:text-gray-400">Destaques positivos e negativos</p>
				</div>
			</div>
			<ProdutosRanking :dados="dados?.ranking" :loading="loading" />
		</section>

		<!-- Seção: Gráficos (Análise de Vendas) -->
		<section>
			<div class="flex items-center gap-3 mb-6">
				<div
					class="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-500/25"
				>
					<Icon name="lucide:bar-chart-2" class="w-5 h-5 text-white" />
				</div>
				<div>
					<h2 class="text-lg font-bold text-gray-900 dark:text-white">Análise de Vendas</h2>
					<p class="text-sm text-gray-500 dark:text-gray-400">
						Tendências e distribuição por categoria
					</p>
				</div>
			</div>
			<ProdutosGraficos :dados="dados?.graficos" :loading="loading" />
		</section>

		<!-- Seção: Tabela (Produtos Detalhados) -->
		<section>
			<div class="flex items-center gap-3 mb-6">
				<div
					class="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25"
				>
					<Icon name="lucide:list" class="w-5 h-5 text-white" />
				</div>
				<div>
					<h2 class="text-lg font-bold text-gray-900 dark:text-white">Produtos Detalhados</h2>
					<p class="text-sm text-gray-500 dark:text-gray-400">
						Lista completa com métricas de desempenho
					</p>
				</div>
			</div>
			<ProdutosTabela :dados="dados?.tabela" :loading="loading" />
		</section>
	</div>
</template>
