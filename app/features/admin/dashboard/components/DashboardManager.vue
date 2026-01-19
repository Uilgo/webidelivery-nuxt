<script setup lang="ts">
/**
 * 📊 DashboardManager - Orquestrador Principal da Dashboard
 *
 * Componente responsável por:
 * - Gerenciar estado global da dashboard
 * - Coordenar todos os componentes filhos
 * - Controlar filtros e atualizações
 * - Exibir loading states e tratamento de erros
 */

import { useDashboard } from "~/features/admin/dashboard/composables/useDashboard";
import DashboardGraficos from "./DashboardGraficos.vue";

/**
 * Composable principal da dashboard
 */
const {
	// Dados
	kpis,

	// Estados
	// Estados
	loading,
	error,

	// Filtros
	periodo,

	// Métodos
	recarregarTudo,
} = useDashboard();

/**
 * Força recarregamento de todos os dados
 */
const handleRefresh = async () => {
	await recarregarTudo();
};
</script>

<template>
	<div class="space-y-6">
		<!-- Cabeçalho e Ações -->
		<div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
			<div>
				<p class="text-sm text-[var(--text-muted)] mt-1">Visão geral de Domingo, 19 de Janeiro</p>
			</div>

			<!-- Barra de Ferramentas Operacionais -->
			<div class="flex items-center gap-2">
				<UiButton
					variant="outline"
					size="sm"
					class="gap-2 hidden sm:flex text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
				>
					<Icon name="lucide:printer" class="w-4 h-4" />
					Relatório
				</UiButton>

				<!-- Botão de Refresh -->
				<UiButton
					:loading="loading"
					variant="ghost"
					size="sm"
					title="Atualizar dados"
					class="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
					@click="handleRefresh"
				>
					<Icon name="lucide:refresh-cw" class="w-4 h-4" />
				</UiButton>
			</div>
		</div>

		<!-- Estado de Erro -->
		<UiCard
			v-if="error"
			class="mb-6 p-4 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20"
		>
			<div class="flex items-start space-x-3">
				<Icon name="lucide:alert-circle" class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
				<div class="flex-1">
					<h3 class="text-sm font-medium text-red-800 dark:text-red-200">Erro ao carregar dados</h3>
					<p class="text-sm text-red-700 dark:text-red-300 mt-1">
						{{ error }}
					</p>
					<UiButton variant="outline" size="sm" class="mt-3" @click="handleRefresh">
						Tentar novamente
					</UiButton>
				</div>
			</div>
		</UiCard>

		<!-- Loading State Inicial -->
		<div v-if="loading && !kpis" class="space-y-6">
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
				<UiSkeleton v-for="i in 4" :key="i" class="h-32" />
			</div>
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				<UiSkeleton v-for="i in 4" :key="i" class="h-16" />
			</div>
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<UiSkeleton class="h-80" />
				<UiSkeleton class="h-80" />
				<UiSkeleton class="h-80" />
				<UiSkeleton class="h-80" />
			</div>
		</div>

		<!-- Conteúdo Principal -->
		<div v-else class="space-y-6">
			<!-- KPIs Principais -->
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				<!-- KPI 1: Faturamento -->
				<div
					class="relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-lg p-6 group hover:shadow-xl transition-all"
				>
					<div class="flex justify-between items-start mb-4">
						<div>
							<p class="text-sm font-medium text-emerald-100">Faturamento do Dia</p>
							<h3 class="text-2xl font-bold mt-1">R$ 1.250,00</h3>
						</div>
						<div
							class="p-2 bg-white/20 rounded-lg text-white group-hover:scale-110 transition-transform"
						>
							<Icon name="lucide:dollar-sign" class="w-5 h-5" />
						</div>
					</div>
					<div class="flex items-center justify-between text-xs">
						<span
							class="flex items-center gap-1 font-medium bg-white/20 px-1.5 py-0.5 rounded backdrop-blur-sm"
						>
							<Icon name="lucide:trending-up" class="w-3 h-3" />
							+12%
						</span>
						<span class="text-emerald-100"
							>Ticket Médio: <strong class="text-white">R$ 45</strong></span
						>
					</div>
				</div>

				<!-- KPI 2: Pedidos -->
				<div
					class="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-lg p-6 group hover:shadow-xl transition-all"
				>
					<div class="flex justify-between items-start mb-4">
						<div>
							<p class="text-sm font-medium text-blue-100">Pedidos Realizados</p>
							<h3 class="text-2xl font-bold mt-1">42</h3>
						</div>
						<div
							class="p-2 bg-white/20 rounded-lg text-white group-hover:scale-110 transition-transform"
						>
							<Icon name="lucide:shopping-bag" class="w-5 h-5" />
						</div>
					</div>
					<div class="flex items-center justify-between text-xs">
						<span
							class="flex items-center gap-1 font-medium bg-white/20 px-1.5 py-0.5 rounded backdrop-blur-sm"
						>
							<Icon name="lucide:trending-up" class="w-3 h-3" />
							+5%
						</span>
						<span class="text-blue-100">vs. ontem</span>
					</div>
				</div>

				<!-- KPI 3: Clientes -->
				<div
					class="relative overflow-hidden rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 text-white shadow-lg p-6 group hover:shadow-xl transition-all"
				>
					<div class="flex justify-between items-start mb-4">
						<div>
							<p class="text-sm font-medium text-violet-100">Novos Clientes</p>
							<h3 class="text-2xl font-bold mt-1">8</h3>
						</div>
						<div
							class="p-2 bg-white/20 rounded-lg text-white group-hover:scale-110 transition-transform"
						>
							<Icon name="lucide:users" class="w-5 h-5" />
						</div>
					</div>
					<div class="flex items-center justify-between text-xs">
						<span
							class="flex items-center gap-1 font-medium bg-white/20 px-1.5 py-0.5 rounded backdrop-blur-sm"
						>
							<Icon name="lucide:plus" class="w-3 h-3" />
							+2
						</span>
						<span class="text-violet-100"
							>Recorrência: <strong class="text-white">85%</strong></span
						>
					</div>
				</div>

				<!-- KPI 4: Conversão -->
				<div
					class="relative overflow-hidden rounded-xl bg-gradient-to-br from-rose-500 to-rose-700 text-white shadow-lg p-6 group hover:shadow-xl transition-all"
				>
					<div class="flex justify-between items-start mb-4">
						<div>
							<p class="text-sm font-medium text-rose-100">Taxa de Conversão</p>
							<h3 class="text-2xl font-bold mt-1">3.2%</h3>
						</div>
						<div
							class="p-2 bg-white/20 rounded-lg text-white group-hover:scale-110 transition-transform"
						>
							<Icon name="lucide:bar-chart-2" class="w-5 h-5" />
						</div>
					</div>
					<div class="flex items-center justify-between text-xs">
						<span
							class="flex items-center gap-1 font-medium bg-white/20 px-1.5 py-0.5 rounded backdrop-blur-sm"
						>
							<Icon name="lucide:trending-down" class="w-3 h-3" />
							-0.5%
						</span>
						<span class="text-rose-100">Visitas: <strong class="text-white">1.2k</strong></span>
					</div>
				</div>
			</div>

			<!-- Grid Principal - Gráficos (2/3) + Estoque (1/3) -->
			<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<!-- Análises com Tabs e Filtros - Ocupa 2 colunas (máxima largura) -->
				<UiCard class="lg:col-span-2">
					<div class="mb-4">
						<h3 class="text-lg font-semibold text-[var(--text-primary)]">Análises</h3>
					</div>

					<!-- Tabs de Navegação usando UiTabs com slot extra para filtro -->
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
									v-model="periodo"
									:options="[
										{ label: 'Hoje', value: 'hoje' },
										{ label: 'Ontem', value: 'ontem' },
										{ label: 'Últimos 7 dias', value: 'ultimos_7_dias' },
										{ label: 'Este Mês', value: 'este_mes' },
										{ label: 'Personalizado', value: 'personalizado' },
									]"
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
										class="absolute inset-0 flex items-center justify-center bg-[var(--bg-default)]/50 rounded-lg"
									>
										<div class="flex items-center space-x-2">
											<Icon name="lucide:loader-2" class="w-5 h-5 animate-spin text-primary" />
											<span class="text-sm text-[var(--text-muted)]">Carregando...</span>
										</div>
									</div>

									<!-- Gráficos -->
									<div v-else class="h-full">
										<!-- Gráfico de Pedidos -->
										<DashboardGraficos
											v-if="currentTab === 'pedidos'"
											:data="{
												labels: ['00:00', '06:00', '12:00', '18:00', '23:59'],
												datasets: {
													pedidos: [2, 8, 15, 22, 5],
													faturamento: [120, 480, 890, 1340, 280],
												},
											}"
											class="h-full"
										/>

										<!-- Placeholder para outros gráficos -->
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
													Gráfico de {{ currentTab }} em desenvolvimento
												</p>
											</div>
										</div>
									</div>
								</div>
							</template>
						</UiTabs>
					</div>
				</UiCard>

				<!-- Mais Vendidos - Ocupa 1 coluna (largura mínima) -->
				<UiCard class="p-5 h-full flex flex-col">
					<div class="flex flex-row items-center justify-between mb-6 gap-2">
						<h3 class="text-lg font-bold text-[var(--text-primary)] whitespace-nowrap">
							Mais Vendidos
						</h3>
						<UiSelect
							:model-value="'quantidade'"
							:options="[
								{ label: 'Por Quantidade', value: 'quantidade' },
								{ label: 'Por Faturamento', value: 'faturamento' },
							]"
							size="sm"
							class="w-[160px]"
						/>
					</div>

					<div class="flex-1 flex flex-col justify-center space-y-5">
						<div
							v-for="(item, index) in [
								{
									nome: 'X-Bacon Duplo Artesanal',
									valor: '145 un',
									percent: 100,
									cor: 'bg-yellow-500',
								},
								{
									nome: 'Combo Família Feliz',
									valor: '98 un',
									percent: 68,
									cor: 'bg-gray-400',
								},
								{
									nome: 'Refrigerante 2L',
									valor: '87 un',
									percent: 60,
									cor: 'bg-orange-700',
								},
								{
									nome: 'Batata Frita Suprema',
									valor: '65 un',
									percent: 45,
									cor: 'bg-amber-600',
								},
								{
									nome: 'Milkshake Ovomaltine',
									valor: '42 un',
									percent: 29,
									cor: 'bg-blue-400',
								},
								{
									nome: 'Onion Rings Crocante',
									valor: '35 un',
									percent: 24,
									cor: 'bg-purple-500',
								},
							]"
							:key="item.nome"
							class="group"
						>
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
								<span
									class="text-sm font-bold text-[var(--text-primary)] tabular-nums flex-shrink-0"
								>
									{{ item.valor }}
								</span>
							</div>

							<!-- Barra de Progresso Background -->
							<div class="h-1.5 w-full bg-[var(--bg-muted)] rounded-full overflow-hidden">
								<div
									class="h-full rounded-full transition-all duration-500 ease-out"
									:class="item.cor"
									:style="{ width: `${item.percent}%` }"
								></div>
							</div>
						</div>
					</div>
				</UiCard>
			</div>

			<!-- Segunda linha - Operação em Tempo Real -->
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">
				<!-- Feed de Pedidos (Live) -->
				<UiCard class="p-5 h-full flex flex-col">
					<div class="flex items-center justify-between mb-6">
						<div class="flex items-center gap-2">
							<div class="relative">
								<span
									class="absolute -right-1 -top-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse border-2 border-[var(--card-bg)]"
								></span>
								<Icon name="lucide:radio" class="w-5 h-5 text-[var(--primary)]" />
							</div>
							<h3 class="text-lg font-bold text-[var(--text-primary)]">Feed de Pedidos</h3>
						</div>
						<UiButton
							variant="ghost"
							size="sm"
							class="text-[var(--primary)] hover:text-[var(--primary-dark)] hover:bg-[var(--primary-light)]"
						>
							Ver todos
						</UiButton>
					</div>

					<div class="space-y-4 flex-1 overflow-y-auto pr-1 max-h-[300px]">
						<div
							v-for="pedido in [
								{
									id: '#042',
									cliente: 'Roberto Alves',
									valor: 45.9,
									status: 'Preparo',
									tempo: 'Há 5 min',
								},
								{
									id: '#041',
									cliente: 'Ana Beatriz',
									valor: 82.5,
									status: 'Entrega',
									tempo: 'Há 12 min',
								},
								{
									id: '#040',
									cliente: 'Carlos Eduardo',
									valor: 32.9,
									status: 'Pendente',
									tempo: 'Há 14 min',
								},
								{
									id: '#039',
									cliente: 'Fernanda Lima',
									valor: 112.0,
									status: 'Concluído',
									tempo: 'Há 28 min',
								},
							]"
							:key="pedido.id"
							class="flex items-center justify-between p-3 rounded-lg hover:bg-[var(--bg-muted)] transition-colors border border-transparent hover:border-[var(--border-default)] group cursor-pointer"
						>
							<div class="flex items-center gap-3">
								<div>
									<div class="flex items-center gap-2">
										<span class="font-bold text-[var(--text-primary)] text-sm">{{
											pedido.id
										}}</span>
										<span class="text-sm text-[var(--text-secondary)] truncate max-w-[120px]">{{
											pedido.cliente
										}}</span>
									</div>
									<div class="flex items-center gap-2 mt-0.5">
										<span
											class="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded"
											:class="{
												'bg-yellow-100 text-yellow-700': pedido.status === 'Pendente',
												'bg-blue-100 text-blue-700': pedido.status === 'Preparo',
												'bg-orange-100 text-orange-700': pedido.status === 'Entrega',
												'bg-green-100 text-green-700': pedido.status === 'Concluído',
											}"
										>
											{{ pedido.status }}
										</span>
										<span class="text-xs text-[var(--text-muted)] flex items-center gap-1">
											<Icon name="lucide:clock" class="w-3 h-3" />
											{{ pedido.tempo }}
										</span>
									</div>
								</div>
							</div>

							<div class="text-right">
								<p class="font-bold text-[var(--text-primary)]">
									{{
										new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
											pedido.valor,
										)
									}}
								</p>
								<Icon
									name="lucide:chevron-right"
									class="w-4 h-4 text-[var(--text-muted)] ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
								/>
							</div>
						</div>
					</div>
				</UiCard>

				<!-- Eficiência Operacional -->
				<UiCard class="p-5 h-full flex flex-col">
					<div class="flex items-center justify-between mb-6">
						<h3 class="text-lg font-bold text-[var(--text-primary)]">Eficiência Operacional</h3>
						<span
							class="text-xs font-medium px-2 py-1 bg-green-100 text-green-700 rounded-full border border-green-200"
						>
							Hoje
						</span>
					</div>

					<div class="grid grid-cols-2 gap-4 flex-1">
						<!-- Card 1: Tempo Preparo -->
						<div
							class="bg-[var(--bg-muted)]/50 rounded-xl p-4 border border-[var(--border-default)] flex flex-col justify-between hover:border-[var(--primary-light)] transition-colors"
						>
							<div class="flex items-start justify-between">
								<div
									class="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400"
								>
									<Icon name="lucide:chef-hat" class="w-5 h-5" />
								</div>
								<span
									class="text-xs font-bold text-green-600 flex items-center gap-1 bg-green-100 px-1.5 py-0.5 rounded"
								>
									<Icon name="lucide:check-circle-2" class="w-3 h-3" />
									Meta: 30'
								</span>
							</div>
							<div class="mt-3">
								<p class="text-2xl font-bold text-[var(--text-primary)]">24 min</p>
								<p class="text-xs text-[var(--text-muted)]">Tempo Médio de Preparo</p>
							</div>
						</div>

						<!-- Card 2: Tempo Entrega -->
						<div
							class="bg-[var(--bg-muted)]/50 rounded-xl p-4 border border-[var(--border-default)] flex flex-col justify-between hover:border-[var(--primary-light)] transition-colors"
						>
							<div class="flex items-start justify-between">
								<div
									class="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg text-orange-600 dark:text-orange-400"
								>
									<Icon name="lucide:bike" class="w-5 h-5" />
								</div>
								<span
									class="text-xs font-bold text-green-600 flex items-center gap-1 bg-green-100 px-1.5 py-0.5 rounded"
								>
									<Icon name="lucide:check-circle-2" class="w-3 h-3" />
									Meta: 45'
								</span>
							</div>
							<div class="mt-3">
								<p class="text-2xl font-bold text-[var(--text-primary)]">38 min</p>
								<p class="text-xs text-[var(--text-muted)]">Tempo Médio de Entrega</p>
							</div>
						</div>

						<!-- Card 3: Avaliação -->
						<div
							class="bg-[var(--bg-muted)]/50 rounded-xl p-4 border border-[var(--border-default)] flex flex-col justify-between hover:border-[var(--primary-light)] transition-colors"
						>
							<div class="flex items-start justify-between">
								<div
									class="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg text-yellow-600 dark:text-yellow-400"
								>
									<Icon name="lucide:star" class="w-5 h-5" />
								</div>
								<span class="text-xs font-medium text-[var(--text-muted)]"> 12 avaliações </span>
							</div>
							<div class="mt-3">
								<div class="flex items-end gap-2">
									<p class="text-2xl font-bold text-[var(--text-primary)]">4.9</p>
									<div class="flex pb-1.5">
										<Icon name="lucide:star" class="w-3 h-3 text-yellow-400 fill-yellow-400" />
										<Icon name="lucide:star" class="w-3 h-3 text-yellow-400 fill-yellow-400" />
										<Icon name="lucide:star" class="w-3 h-3 text-yellow-400 fill-yellow-400" />
										<Icon name="lucide:star" class="w-3 h-3 text-yellow-400 fill-yellow-400" />
										<Icon name="lucide:star-half" class="w-3 h-3 text-yellow-400 fill-yellow-400" />
									</div>
								</div>
								<p class="text-xs text-[var(--text-muted)]">Satisfação do Cliente</p>
							</div>
						</div>

						<!-- Card 4: Cancelamentos -->
						<div
							class="bg-[var(--bg-muted)]/50 rounded-xl p-4 border border-[var(--border-default)] flex flex-col justify-between hover:border-red-200 dark:hover:border-red-900 transition-colors"
						>
							<div class="flex items-start justify-between">
								<div
									class="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-600 dark:text-red-400"
								>
									<Icon name="lucide:alert-octagon" class="w-5 h-5" />
								</div>
								<span
									class="text-xs font-bold text-red-600 flex items-center gap-1 bg-red-100 px-1.5 py-0.5 rounded"
								>
									Atenção
								</span>
							</div>
							<div class="mt-3">
								<p class="text-2xl font-bold text-[var(--text-primary)]">2</p>
								<p class="text-xs text-[var(--text-muted)]">Pedidos Cancelados</p>
							</div>
						</div>
					</div>
				</UiCard>
			</div>
		</div>
	</div>
</template>

<style scoped>
/* Custom Scrollbar para o Feed */
.overflow-y-auto::-webkit-scrollbar {
	width: 4px;
}
.overflow-y-auto::-webkit-scrollbar-track {
	background: transparent;
}
.overflow-y-auto::-webkit-scrollbar-thumb {
	background-color: var(--border-default);
	border-radius: 20px;
}

/* Diminuir altura das tabs apenas no dashboard */
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
