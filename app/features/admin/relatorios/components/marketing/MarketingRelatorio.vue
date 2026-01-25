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

// Composables
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

		<!-- Dados carregados -->
		<template v-else-if="dados">
			<!-- KPIs -->
			<MarketingKpis :kpis="dados.kpis" :loading="loading" />

			<!-- Desempenho de Cupons -->
			<MarketingCupons :cupons="dados.cupons" :loading="loading" />

			<!-- Gráficos -->
			<MarketingGraficos :graficos="dados.graficos" :loading="loading" />

			<!-- Resumo -->
			<MarketingResumo :resumo="dados.resumo" :loading="loading" />
		</template>

		<!-- Estado vazio -->
		<UiEmptyState
			v-else
			title="Nenhum dado de marketing"
			description="Não há dados de cupons ou campanhas para o período selecionado."
			icon="lucide:ticket"
		/>
	</div>
</template>
