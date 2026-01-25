<script setup lang="ts">
/**
 * 📦 PedidosRelatorio
 *
 * Container principal do relatório de pedidos:
 * - Orquestra KPIs, gráficos e tabela
 * - Gerencia loading states
 * - Integra com composable de dados
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
	<div class="pedidos-relatorio space-y-6">
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
				Métricas Principais
			</h2>
			<PedidosKpis :dados="dados?.kpis" :loading="loading" />
		</section>

		<!-- Gráficos -->
		<section>
			<h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Análise Visual</h2>
			<PedidosGraficos :dados="dados?.graficos" :loading="loading" />
		</section>

		<!-- Tabela Detalhada -->
		<section>
			<h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
				Pedidos Detalhados
			</h2>
			<PedidosTabela :dados="dados?.tabela" :loading="loading" />
		</section>
	</div>
</template>
