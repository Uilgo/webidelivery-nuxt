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
import { useDashboard } from "../../composables/useDashboard";

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

const dashboard = useDashboard();

// Estados
const showCustomDateModal = ref(false);
const customDateStart = ref("");
const customDateEnd = ref("");

// Proxy para o v-model do período
const localPeriodo = computed({
	get: () => props.periodo,
	set: (val) => {
		// Se selecionar "personalizado", abre o modal
		if (val === "personalizado") {
			showCustomDateModal.value = true;
			return;
		}
		emit("update:periodo", val);
	},
});

// Texto descritivo do período selecionado
const periodoTexto = computed(() => {
	const hoje = new Date();

	const opcoes: Record<string, string> = {
		hoje: `Hoje - ${hoje.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}`,
		ontem: (() => {
			const ontem = new Date(hoje);
			ontem.setDate(ontem.getDate() - 1);
			return `Ontem - ${ontem.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}`;
		})(),
		ultimos_7_dias: (() => {
			const inicio = new Date(hoje);
			inicio.setDate(inicio.getDate() - 6);
			return `${inicio.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} - ${hoje.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}`;
		})(),
		este_mes: `${hoje.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}`,
		personalizado: (() => {
			let inicio = dashboard.dataInicio.value;
			let fim = dashboard.dataFim.value;

			// Garante que são objetos Date (caso venham como string do estado persistido)
			if (inicio && !(inicio instanceof Date)) inicio = new Date(inicio);
			if (fim && !(fim instanceof Date)) fim = new Date(fim);

			if (inicio && fim && !isNaN(inicio.getTime()) && !isNaN(fim.getTime())) {
				return `${inicio.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} - ${fim.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}`;
			}
			return "Período personalizado";
		})(),
	};

	return opcoes[props.periodo] || "Período não definido";
});

// Aplicar período personalizado
const aplicarPeriodoPersonalizado = () => {
	if (!customDateStart.value || !customDateEnd.value) {
		return;
	}

	// 1. Primeiro avisa que o período mudou para personalizado
	emit("update:periodo", "personalizado");

	// 2. Converte strings para objetos Date
	// Usamos o timezone local para evitar shifts de data
	const inicio = new Date(customDateStart.value + "T00:00:00");
	const fim = new Date(customDateEnd.value + "T23:59:59");

	// 3. Salva as datas no dashboard (o composable agora aceita sem travas)
	dashboard.setDataInicio(inicio);
	dashboard.setDataFim(fim);

	showCustomDateModal.value = false;
};

// Cancelar período personalizado
const cancelarPeriodoPersonalizado = () => {
	showCustomDateModal.value = false;
	customDateStart.value = "";
	customDateEnd.value = "";
};

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
		<div class="mb-4 flex items-center justify-between">
			<h3 class="text-lg font-semibold text-[var(--text-primary)]">Análises</h3>
			<p class="text-sm text-[var(--text-muted)]">{{ periodoTexto }}</p>
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
						class="w-[160px] dashboard-select"
					/>
				</template>

				<!-- Conteúdo dos gráficos -->
				<template #default="{ activeTab: currentTab }">
					<div class="h-72 relative">
						<!-- Loading State (apenas quando não há dados) -->
						<div
							v-if="!charts"
							class="absolute inset-0 flex items-center justify-center bg-[var(--bg-default)] rounded-lg"
						>
							<div class="flex items-center space-x-2">
								<Icon name="lucide:loader-2" class="w-5 h-5 animate-spin text-primary" />
								<span class="text-sm text-[var(--text-muted)]">Carregando gráficos...</span>
							</div>
						</div>

						<!-- Gráficos - renderiza sempre que charts existir -->
						<div v-else class="h-full">
							<!-- Gráfico de Pedidos -->
							<DashboardGraficos
								v-show="currentTab === 'pedidos'"
								:active="currentTab === 'pedidos'"
								:data="charts.pedidos_por_hora"
								type="line"
								class="h-full"
							/>

							<!-- Gráfico de Faturamento -->
							<DashboardGraficos
								v-show="currentTab === 'faturamento'"
								:active="currentTab === 'faturamento'"
								:data="charts.faturamento_semanal"
								type="bar"
								class="h-full"
							/>

							<!-- Gráfico de Status -->
							<DashboardGraficos
								v-show="currentTab === 'status'"
								:active="currentTab === 'status'"
								:data="charts.status_distribuicao"
								type="pie"
								class="h-full"
							/>

							<!-- Gráfico de Produtos -->
							<DashboardGraficos
								v-show="currentTab === 'produtos'"
								:active="currentTab === 'produtos'"
								:data="charts.produtos_ranking"
								type="bar"
								class="h-full"
							/>

							<!-- Fallback -->
							<div
								v-if="
									currentTab !== 'pedidos' &&
									currentTab !== 'faturamento' &&
									currentTab !== 'status' &&
									currentTab !== 'produtos'
								"
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

		<!-- Modal de Período Personalizado -->
		<UiModal v-model="showCustomDateModal" title="Período Personalizado" size="lg">
			<div class="space-y-6 pb-4">
				<!-- Data Início -->
				<div>
					<label class="block text-sm font-medium text-[var(--text-primary)] mb-2">
						Data Início
					</label>
					<UiDatePicker
						v-model="customDateStart"
						placeholder="Selecione a data inicial"
						:max-date="customDateEnd || undefined"
					/>
				</div>

				<!-- Data Fim -->
				<div>
					<label class="block text-sm font-medium text-[var(--text-primary)] mb-2">
						Data Fim
					</label>
					<UiDatePicker
						v-model="customDateEnd"
						placeholder="Selecione a data final"
						:min-date="customDateStart || undefined"
					/>
				</div>

				<!-- Botões de Ação -->
				<div class="flex items-center justify-end gap-3 pt-6 border-t border-[var(--border-muted)]">
					<UiButton variant="ghost" size="md" @click="cancelarPeriodoPersonalizado">
						Cancelar
					</UiButton>
					<UiButton
						variant="solid"
						size="md"
						:disabled="!customDateStart || !customDateEnd"
						@click="aplicarPeriodoPersonalizado"
					>
						Aplicar
					</UiButton>
				</div>
			</div>
		</UiModal>
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
