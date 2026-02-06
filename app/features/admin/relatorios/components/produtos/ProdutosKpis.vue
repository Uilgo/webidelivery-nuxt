<script setup lang="ts">
/**
 * 📊 ProdutosKpis
 *
 * Grid de KPIs do relatório de produtos:
 * - Produtos vendidos
 * - Produto mais vendido
 * - Categoria mais vendida
 * - Receita de produtos
 */

import type { RelatorioProdutos } from "../../types/produtos";
import KpiCard from "../shared/KpiCard.vue";

interface Props {
	dados: RelatorioProdutos["kpis"] | undefined;
	loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	loading: false,
});

// Lista de KPIs na ordem de exibição
const kpisOrdenados = computed(() => {
	if (!props.dados) return [];

	return [
		props.dados.produtos_vendidos,
		props.dados.produto_mais_vendido,
		props.dados.categoria_mais_vendida,
		props.dados.receita_produtos,
	];
});
</script>

<template>
	<div class="produtos-kpis">
		<!-- Loading State -->
		<div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
			<div
				v-for="i in 4"
				:key="i"
				class="h-32 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"
			></div>
		</div>

		<!-- KPIs Grid -->
		<div v-else-if="dados" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
			<KpiCard v-for="(kpi, index) in kpisOrdenados" :key="index" :kpi="kpi" />
		</div>

		<!-- Empty State -->
		<UiEmptyState
			v-else
			title="Nenhum dado disponível"
			description="Não há KPIs de produtos para o período selecionado"
			icon="lucide:package"
			size="md"
		/>
	</div>
</template>
