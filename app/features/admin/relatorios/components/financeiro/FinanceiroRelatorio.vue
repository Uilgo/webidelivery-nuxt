<script setup lang="ts">
/**
 * 💰 FinanceiroRelatorio
 *
 * Container principal do relatório financeiro.
 * Orquestra todos os subcomponentes e gerencia o estado.
 */

import FinanceiroKpis from "./FinanceiroKpis.vue";
import FinanceiroMetodos from "./FinanceiroMetodos.vue";
import FinanceiroGraficos from "./FinanceiroGraficos.vue";
import FinanceiroTabela from "./FinanceiroTabela.vue";
import FinanceiroResumo from "./FinanceiroResumo.vue";
import { useRelatoriosFinanceiro } from "../../composables/useRelatoriosFinanceiro";

// Composables
const { dados, loading, error } = useRelatoriosFinanceiro();

// Estado de carregamento inicial
const isInitialLoad = computed(() => loading.value && !dados.value);
</script>

<template>
	<div class="space-y-6">
		<!-- Loading inicial -->
		<div v-if="isInitialLoad" class="space-y-6">
			<UiSkeleton class="h-32 w-full" />
			<UiSkeleton class="h-64 w-full" />
			<UiSkeleton class="h-96 w-full" />
		</div>

		<!-- Erro -->
		<UiEmptyState
			v-else-if="error"
			title="Erro ao carregar relatório"
			:description="error"
			icon="lucide:alert-circle"
			variant="error"
		/>

		<!-- Conteúdo (sempre renderiza, componentes internos gerenciam empty states) -->
		<template v-else>
			<!-- KPIs -->
			<FinanceiroKpis :kpis="dados?.kpis" :loading="loading" />

			<!-- Métodos de Pagamento -->
			<FinanceiroMetodos :metodos="dados?.metodos_pagamento" :loading="loading" />

			<!-- Gráficos -->
			<FinanceiroGraficos :graficos="dados?.graficos" :loading="loading" />

			<!-- Tabela de Transações -->
			<FinanceiroTabela :tabela="dados?.tabela" :loading="loading" />

			<!-- Resumo -->
			<FinanceiroResumo :resumo="dados?.resumo" :loading="loading" />
		</template>
	</div>
</template>
