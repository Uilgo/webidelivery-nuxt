<script setup lang="ts">
/**
 * 🎫 MarketingCupons
 *
 * Exibe desempenho dos cupons: mais usados e desempenho geral.
 */

import type { DadosCupons } from "../../types/marketing";
import { formatCurrency } from "~/lib/formatters/currency";

interface Props {
	cupons: DadosCupons;
	loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	loading: false,
});

// Colunas da tabela de desempenho
const colunas = [
	{ key: "codigo", label: "Código" },
	{ key: "tipo", label: "Tipo" },
	{ key: "usos", label: "Usos" },
	{ key: "desconto_total", label: "Desconto Total" },
	{ key: "receita_gerada", label: "Receita Gerada" },
	{ key: "economia_media", label: "Economia Média" },
	{ key: "taxa_conversao", label: "Taxa Conversão" },
];

// Formatar dados para tabela
const dadosTabela = computed(() => {
	return [...props.cupons.desempenho].map((cupom) => ({
		...cupom,
		desconto_total: formatCurrency(cupom.desconto_total),
		receita_gerada: formatCurrency(cupom.receita_gerada),
		economia_media: formatCurrency(cupom.economia_media),
		taxa_conversao: `${cupom.taxa_conversao.toFixed(1)}%`,
	}));
});
</script>

<template>
	<div class="space-y-6">
		<!-- Cupons Mais Usados -->
		<UiCard>
			<template #header>
				<div class="flex items-center gap-2">
					<Icon name="lucide:trophy" class="w-5 h-5 text-yellow-500" />
					<h3 class="text-lg font-semibold">Top 10 Cupons Mais Usados</h3>
				</div>
			</template>

			<div v-if="loading" class="space-y-3">
				<UiSkeleton v-for="i in 5" :key="i" class="h-16 w-full" />
			</div>

			<div v-else-if="cupons.mais_usados.length === 0" class="py-8">
				<UiEmptyState
					title="Nenhum cupom usado"
					description="Não há cupons utilizados no período selecionado."
					icon="lucide:ticket"
					size="sm"
				/>
			</div>

			<div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div
					v-for="cupom in cupons.mais_usados"
					:key="cupom.id"
					class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
				>
					<div class="flex items-center gap-3">
						<div
							class="flex items-center justify-center w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full"
						>
							<Icon name="lucide:ticket" class="w-5 h-5 text-blue-600 dark:text-blue-400" />
						</div>
						<div>
							<p class="font-semibold text-gray-900 dark:text-white">{{ cupom.codigo }}</p>
							<p class="text-sm text-gray-500 dark:text-gray-400">{{ cupom.tipo }}</p>
						</div>
					</div>
					<div class="text-right">
						<p class="text-lg font-bold text-gray-900 dark:text-white">{{ cupom.usos }}</p>
						<p class="text-xs text-gray-500 dark:text-gray-400">usos</p>
					</div>
				</div>
			</div>
		</UiCard>

		<!-- Desempenho Geral -->
		<UiCard>
			<template #header>
				<div class="flex items-center gap-2">
					<Icon name="lucide:bar-chart" class="w-5 h-5 text-blue-500" />
					<h3 class="text-lg font-semibold">Desempenho Geral dos Cupons</h3>
				</div>
			</template>

			<div v-if="loading">
				<UiSkeleton class="h-64 w-full" />
			</div>

			<div v-else-if="cupons.desempenho.length === 0" class="py-8">
				<UiEmptyState
					title="Nenhum dado disponível"
					description="Não há dados de desempenho para exibir."
					icon="lucide:bar-chart"
					size="sm"
				/>
			</div>

			<UiTable v-else :columns="colunas" :data="[...dadosTabela]" />
		</UiCard>
	</div>
</template>
