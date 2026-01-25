<script setup lang="ts">
/**
 * 📦 ProdutosRelatorio
 *
 * Container principal do relatório de produtos:
 * - Orquestra KPIs, ranking, gráficos e tabela
 * - Gerencia loading states
 * - Integra com composable de dados
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
	<div class="produtos-relatorio space-y-6">
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
				Métricas de Produtos
			</h2>
			<ProdutosKpis :dados="dados?.kpis" :loading="loading" />
		</section>

		<!-- Ranking -->
		<section>
			<h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
				Ranking de Produtos
			</h2>
			<ProdutosRanking :dados="dados?.ranking" :loading="loading" />
		</section>

		<!-- Gráficos -->
		<section>
			<h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Análise de Vendas</h2>
			<ProdutosGraficos :dados="dados?.graficos" :loading="loading" />
		</section>

		<!-- Tabela Detalhada -->
		<section>
			<h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
				Produtos Detalhados
			</h2>
			<ProdutosTabela :dados="dados?.tabela" :loading="loading" />
		</section>
	</div>
</template>
