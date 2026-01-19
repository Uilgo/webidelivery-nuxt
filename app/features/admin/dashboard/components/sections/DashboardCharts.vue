<script setup lang="ts">
/**
 * 📊 DashboardChartsSection - Seção de Gráficos com Tabs
 *
 * Gerencia a visualização dos gráficos (Pedidos, Faturamento, etc)
 * e o seletor de período global.
 */

import DashboardGraficos from "../base/DashboardGraficos.vue";
import type { DashboardCharts } from "../../types/dashboard";
import type { DashboardPeriodo } from "../../types/filters";

interface Props {
	charts: DashboardCharts | null;
	periodo: DashboardPeriodo;
	loading?: boolean;
}

interface Emits {
	(e: "update:periodo", value: DashboardPeriodo): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Proxy para o v-model do período
const localPeriodo = computed({
	get: () => props.periodo,
	set: (val) => emit("update:periodo", val),
});

// Opções do filtro de período
const periodoOptions = [
	{ label: "Hoje", value: "hoje" },
	{ label: "Ontem", value: "ontem" },
	{ label: "Últimos 7 dias", value: "ultimos_7_dias" },
	{ label: "Este Mês", value: "este_mes" },
	{ label: "Personalizado", value: "personalizado" },
];
</script>

<template>
	<UiCard class="lg:col-span-2">
		<div class="mb-4">
			<h3 class="text-lg font-semibold text-[var(--text-primary)]">Análises</h3>
		</div>

		<!-- Tabs de Navegação -->
		<div class="dashboard-tabs">
			<UiTabs
				:tabs="[
					{ key: 'pedidos', label: 'Pedidos', icon: 'lucide:trending-up' },
					{ key: 'faturamento', label: 'Faturamento', icon: 'lucide:dollar-sign' },
					{ key: 'status', label: 'Status', icon: 'lucide:pie-chart' },
					{ key: 'produtos', label: 'Produtos', icon: 'lucide:package' },
				]"
				default-tab="pedidos"
			>
				<!-- Slot extra para o filtro -->
				<template #extra>
					<UiSelect
						v-model="localPeriodo"
						:options="periodoOptions"
						size="md"
						placeholder="Selecionar período"
						class="min-w-[140px] dashboard-select"
					/>
				</template>

				<!-- Conteúdo dos gráficos -->
				<template #default="{ activeTab: currentTab }">
					<div class="h-72 relative">
						<!-- Loading State -->
						<div
							v-if="loading"
							class="absolute inset-0 flex items-center justify-center bg-[var(--bg-default)]/50 rounded-lg z-10"
						>
							<div class="flex items-center space-x-2">
								<Icon name="lucide:loader-2" class="w-5 h-5 animate-spin text-primary" />
								<span class="text-sm text-[var(--text-muted)]">Carregando...</span>
							</div>
						</div>

						<!-- Gráficos -->
						<div v-else-if="charts" class="h-full">
							<!-- Gráfico de Pedidos -->
							<DashboardGraficos
								v-if="currentTab === 'pedidos'"
								:data="charts.pedidos_por_hora"
								type="line"
								class="h-full"
							/>

							<!-- Gráfico de Faturamento -->
							<DashboardGraficos
								v-else-if="currentTab === 'faturamento'"
								:data="charts.faturamento_semanal"
								type="bar"
								class="h-full"
							/>

							<!-- Gráfico de Status -->
							<DashboardGraficos
								v-else-if="currentTab === 'status'"
								:data="charts.status_distribuicao"
								type="doughnut"
								class="h-full"
							/>

							<!-- Gráfico de Produtos -->
							<DashboardGraficos
								v-else-if="currentTab === 'produtos'"
								:data="charts.produtos_ranking"
								type="bar"
								class="h-full"
							/>

							<!-- Fallback -->
							<div
								v-else
								class="flex items-center justify-center h-full bg-[var(--bg-muted)] rounded-lg"
							>
								<div class="text-center">
									<Icon
										name="lucide:bar-chart-3"
										class="w-12 h-12 text-[var(--text-muted)] mx-auto mb-2"
									/>
									<p class="text-sm text-[var(--text-muted)]">
										Gráfico de {{ currentTab }} não encontrado
									</p>
								</div>
							</div>
						</div>
					</div>
				</template>
			</UiTabs>
		</div>
	</UiCard>
</template>

<style scoped>
/* Estilos específicos para compactar a UI de Tabs no Dashboard */

:deep(.dashboard-tabs button) {
	height: 2rem !important; /* 32px em vez de 40px */
	min-height: 2rem !important;
}

:deep(.dashboard-tabs .p-1) {
	padding: 0.25rem !important; /* Reduzir padding do container */
}

/* Select de filtro com a mesma altura do container das tabs (42px) */
/* Container = Botão(32px) + Padding(8px) + Borda(2px) = 42px */
.dashboard-tabs :deep(.dashboard-select div[role="combobox"]) {
	height: 42px !important;
	min-height: 42px !important;
	max-height: 42px !important;
	display: flex !important;
	align-items: center !important;
}
</style>
