<script setup lang="ts">
/**
 * 🎯 MarketingRelatorio
 *
 * Container principal do relatório de marketing.
 * Orquestra todos os subcomponentes e gerencia o estado.
 */

import MarketingKpis from "./MarketingKpis.vue";
import MarketingCupons from "./MarketingCupons.vue";
import MarketingGraficos from "./MarketingGraficos.vue";
import MarketingResumo from "./MarketingResumo.vue";
import { useRelatoriosMarketing } from "../../composables/useRelatoriosMarketing";

// Watch já está dentro do composable
const { dados, loading, error } = useRelatoriosMarketing();

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
			<MarketingKpis :kpis="dados?.kpis" :loading="loading" />

			<!-- Desempenho de Cupons -->
			<MarketingCupons :cupons="dados?.cupons" :loading="loading" />

			<!-- Gráficos -->
			<MarketingGraficos :graficos="dados?.graficos" :loading="loading" />

			<!-- Resumo -->
			<MarketingResumo :resumo="dados?.resumo" :loading="loading" />
		</template>
	</div>
</template>
