<script setup lang="ts">
/**
 * 📌 Dashboard Page
 *
 * Página principal do dashboard administrativo do estabelecimento.
 * Página genérica para testes do layout admin.
 */

// Dados mock para teste
const stats = ref([
	{
		label: "Pedidos Hoje",
		value: "24",
		icon: "lucide:shopping-bag",
		color: "primary",
	},
	{
		label: "Faturamento",
		value: "R$ 1.250,00",
		icon: "lucide:dollar-sign",
		color: "success",
	},
	{
		label: "Produtos Ativos",
		value: "156",
		icon: "lucide:package",
		color: "warning",
	},
	{
		label: "Avaliação Média",
		value: "4.8",
		icon: "lucide:star",
		color: "primary",
	},
]);

const recentOrders = ref([
	{
		id: "#001",
		customer: "João Silva",
		total: "R$ 45,90",
		status: "Em preparo",
		time: "há 5 min",
	},
	{
		id: "#002",
		customer: "Maria Santos",
		total: "R$ 32,50",
		status: "Pronto",
		time: "há 12 min",
	},
	{
		id: "#003",
		customer: "Pedro Costa",
		total: "R$ 78,20",
		status: "Em entrega",
		time: "há 18 min",
	},
]);
</script>

<template>
	<div class="space-y-6">
		<!-- Cabeçalho da Página -->
		<div class="flex items-center justify-between">
			<div>
				<h1 class="text-2xl font-bold text-[var(--text-primary)]">Dashboard</h1>
				<p class="text-[var(--text-muted)] mt-1">Visão geral do seu estabelecimento</p>
			</div>
			<UiButton variant="solid" size="md">
				<Icon name="lucide:plus" class="w-4 h-4 mr-2" />
				Novo Pedido
			</UiButton>
		</div>

		<!-- Cards de Estatísticas -->
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
			<UiCard v-for="stat in stats" :key="stat.label" class="p-6">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm text-[var(--text-muted)] mb-1">{{ stat.label }}</p>
						<p class="text-2xl font-bold text-[var(--text-primary)]">{{ stat.value }}</p>
					</div>
					<div
						class="w-12 h-12 rounded-lg flex items-center justify-center"
						:class="[
							stat.color === 'primary' && 'bg-[var(--primary-light)] text-[var(--primary)]',
							stat.color === 'success' && 'bg-[var(--success-light)] text-[var(--success)]',
							stat.color === 'warning' && 'bg-[var(--warning-light)] text-[var(--warning)]',
						]"
					>
						<Icon :name="stat.icon" class="w-6 h-6" />
					</div>
				</div>
			</UiCard>
		</div>

		<!-- Conteúdo Principal -->
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
			<!-- Pedidos Recentes -->
			<div class="lg:col-span-2">
				<UiCard class="p-6">
					<div class="flex items-center justify-between mb-6">
						<h2 class="text-lg font-semibold text-[var(--text-primary)]">Pedidos Recentes</h2>
						<UiButton variant="ghost" size="sm"> Ver todos </UiButton>
					</div>

					<div class="space-y-4">
						<div
							v-for="order in recentOrders"
							:key="order.id"
							class="flex items-center justify-between p-4 border border-[var(--border-default)] rounded-lg hover:bg-[var(--surface-hover)] transition-colors"
						>
							<div class="flex items-center gap-4">
								<div
									class="w-10 h-10 bg-[var(--primary-light)] text-[var(--primary)] rounded-full flex items-center justify-center font-medium"
								>
									{{ order.customer.charAt(0) }}
								</div>
								<div>
									<p class="font-medium text-[var(--text-primary)]">{{ order.customer }}</p>
									<p class="text-sm text-[var(--text-muted)]">{{ order.id }} • {{ order.time }}</p>
								</div>
							</div>
							<div class="text-right">
								<p class="font-medium text-[var(--text-primary)]">{{ order.total }}</p>
								<UiBadge
									:variant="
										order.status === 'Pronto'
											? 'success'
											: order.status === 'Em preparo'
												? 'warning'
												: 'primary'
									"
									size="sm"
								>
									{{ order.status }}
								</UiBadge>
							</div>
						</div>
					</div>
				</UiCard>
			</div>

			<!-- Ações Rápidas -->
			<div>
				<UiCard class="p-6">
					<h2 class="text-lg font-semibold text-[var(--text-primary)] mb-6">Ações Rápidas</h2>

					<div class="space-y-3">
						<UiButton variant="outline" size="md" class="w-full justify-start">
							<Icon name="lucide:plus-circle" class="w-4 h-4 mr-3" />
							Adicionar Produto
						</UiButton>
						<UiButton variant="outline" size="md" class="w-full justify-start">
							<Icon name="lucide:tag" class="w-4 h-4 mr-3" />
							Criar Promoção
						</UiButton>
						<UiButton variant="outline" size="md" class="w-full justify-start">
							<Icon name="lucide:users" class="w-4 h-4 mr-3" />
							Convidar Equipe
						</UiButton>
						<UiButton variant="outline" size="md" class="w-full justify-start">
							<Icon name="lucide:bar-chart-3" class="w-4 h-4 mr-3" />
							Ver Relatórios
						</UiButton>
					</div>
				</UiCard>
			</div>
		</div>

		<!-- Seção de Teste do Layout -->
		<UiCard class="p-6">
			<h2 class="text-lg font-semibold text-[var(--text-primary)] mb-4">
				🧪 Teste do Layout Admin
			</h2>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
				<div>
					<h3 class="font-medium text-[var(--text-primary)] mb-2">Funcionalidades Testadas:</h3>
					<ul class="space-y-1 text-[var(--text-muted)]">
						<li>✅ Layout admin com sidebar e header</li>
						<li>✅ Sidebar colapsável (desktop)</li>
						<li>✅ Sidebar deslizante (mobile)</li>
						<li>✅ Dados centralizados (sem duplicação)</li>
						<li>✅ Componentes UI integrados</li>
					</ul>
				</div>
				<div>
					<h3 class="font-medium text-[var(--text-primary)] mb-2">Próximos Passos:</h3>
					<ul class="space-y-1 text-[var(--text-muted)]">
						<li>🔄 Implementar rota ativa no menu</li>
						<li>🔄 Conectar dados reais da API</li>
						<li>🔄 Adicionar mais páginas administrativas</li>
						<li>🔄 Implementar sistema de notificações</li>
						<li>🔄 Adicionar responsividade completa</li>
					</ul>
				</div>
			</div>
		</UiCard>
	</div>
</template>
