<script setup lang="ts">
/**
 * 📊 DashboardRankingList - Lista de Mais Vendidos
 *
 * Exibe ranking de produtos com barras de progresso e badges.
 * Suporta ordenação por quantidade ou faturamento.
 */

import type { ProdutoRanking } from "../../types/dashboard";

interface Props {
	items: ProdutoRanking[];
	loading?: boolean;
}

const props = defineProps<Props>();

// Estado local para tipo de ranking
const rankingType = ref<"quantidade" | "faturamento">("quantidade");

/**
 * Calcula o valor máximo para definir a porcentagem da barra
 */
const maxValue = computed(() => {
	if (!props.items?.length) return 0;
	return Math.max(
		...props.items.map((item) =>
			rankingType.value === "quantidade" ? item.quantidade_vendida : item.faturamento,
		),
	);
});

/**
 * Lista ordenada e formatada para exibição
 */
const rankItems = computed(() => {
	if (!props.items) return [];

	// Ordena
	const sorted = [...props.items].sort((a, b) => {
		const valA = rankingType.value === "quantidade" ? a.quantidade_vendida : a.faturamento;
		const valB = rankingType.value === "quantidade" ? b.quantidade_vendida : b.faturamento;
		return valB - valA;
	});

	// Mapeia para display
	return sorted.slice(0, 6).map((item, index) => {
		const rawValue =
			rankingType.value === "quantidade" ? item.quantidade_vendida : item.faturamento;
		const percent = maxValue.value ? (rawValue / maxValue.value) * 100 : 0;

		return {
			...item,
			displayValue:
				rankingType.value === "quantidade"
					? `${rawValue} un`
					: new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(rawValue),
			percent,
			// Cores baseadas no ranking original
			colorBar:
				index === 0
					? "bg-yellow-500"
					: index === 1
						? "bg-gray-400"
						: index === 2
							? "bg-orange-700"
							: index === 3
								? "bg-amber-600"
								: index === 4
									? "bg-blue-400"
									: "bg-purple-500",
		};
	});
});
</script>

<template>
	<UiCard class="p-5 h-full flex flex-col">
		<div class="flex flex-row items-center justify-between mb-6 gap-2">
			<h3 class="text-lg font-bold text-[var(--text-primary)] whitespace-nowrap">Mais Vendidos</h3>
			<UiSelect
				v-model="rankingType"
				:options="[
					{ label: 'Por Quantidade', value: 'quantidade' },
					{ label: 'Por Faturamento', value: 'faturamento' },
				]"
				size="sm"
				class="w-[160px]"
			/>
		</div>

		<div v-if="loading" class="space-y-4">
			<UiSkeleton v-for="i in 5" :key="i" class="h-10 w-full" />
		</div>

		<div v-else-if="items.length === 0" class="flex-1 flex items-center justify-center">
			<UiEmptyState
				title="Sem dados de vendas"
				description="Comece vendendo para ver seus produtos mais populares aqui."
				icon="lucide:trending-up"
				size="sm"
				variant="default"
			/>
		</div>

		<div v-else class="flex-1 flex flex-col justify-center space-y-5">
			<div v-for="(item, index) in rankItems" :key="item.id" class="group">
				<!-- Linha Superior: Info -->
				<div class="flex items-center justify-between mb-1.5">
					<div class="flex items-center gap-3 overflow-hidden flex-1 mr-4">
						<!-- Badge de Ranking Minimalista -->
						<div
							class="w-5 h-5 flex items-center justify-center text-xs font-bold rounded flex-shrink-0"
							:class="[
								index === 0
									? 'bg-yellow-100 text-yellow-700'
									: index === 1
										? 'bg-slate-100 text-slate-700'
										: index === 2
											? 'bg-orange-100 text-orange-800'
											: 'bg-[var(--bg-muted)] text-[var(--text-muted)]',
							]"
						>
							{{ index + 1 }}
						</div>

						<!-- Nome + Medalha -->
						<div class="flex items-center gap-2 min-w-0">
							<!-- Medalha Top 3 -->
							<Icon
								v-if="index < 3"
								name="lucide:medal"
								class="w-4 h-4 flex-shrink-0"
								:class="[
									index === 0
										? 'text-yellow-500 fill-yellow-500/20'
										: index === 1
											? 'text-slate-400 fill-slate-400/20'
											: 'text-amber-700 fill-amber-700/20',
								]"
							/>
							<span class="text-sm font-medium text-[var(--text-primary)] truncate">
								{{ item.nome }}
							</span>
						</div>
					</div>
					<span class="text-sm font-bold text-[var(--text-primary)] tabular-nums flex-shrink-0">
						{{ item.displayValue }}
					</span>
				</div>

				<!-- Barra de Progresso Background -->
				<div class="h-1.5 w-full bg-[var(--bg-muted)] rounded-full overflow-hidden">
					<div
						class="h-full rounded-full transition-all duration-500 ease-out"
						:class="item.colorBar"
						:style="{ width: `${item.percent}%` }"
					></div>
				</div>
			</div>
		</div>
	</UiCard>
</template>
