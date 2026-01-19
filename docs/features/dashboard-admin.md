# 📊 Dashboard Admin - Planejamento de Feature

## 🎯 Objetivo

Criar uma dashboard administrativa completa e funcional que exiba métricas em tempo real, estatísticas de negócio e permita ações rápidas para gerenciar o estabelecimento.

## 📋 Requisitos Funcionais

### KPIs Principais

- **Pedidos Hoje**: Total, pendentes, em andamento, concluídos
- **Faturamento**: Hoje, semana, mês, ticket médio
- **Produtos**: Total ativos, mais vendidos, sem estoque
- **Performance**: Tempo médio de preparo, taxa de cancelamento

### Visualizações

- **Seção de Gráficos com Tabs**:
  - **Tab Principal**: Pedidos por Hora (padrão - últimas 24h)
  - **Tab Faturamento**: Linha temporal de receita semanal
  - **Tab Status**: Distribuição por status (donut chart)
  - **Tab Produtos**: Ranking dos mais vendidos (top 5)
  - **Tab Horários**: Mapa de calor de demanda

### Filtros de Período

Os gráficos terão **5 opções de filtro** seguindo exatamente o mesmo padrão da página de pedidos:

1. **Todos** (padrão) - Sem filtro de data, exibe todos os períodos
2. **Hoje** - Últimas 24 horas (desde 00:00 até agora)
3. **Ontem** - Dia anterior completo (00:00 às 23:59)
4. **Últimos 7 dias** - 7 dias corridos incluindo hoje
5. **Personalizado** - Date range picker para período específico

> **Consistência UX**: Usa exatamente o mesmo padrão do seletor de pedidos (`usePedidosFilters`) para familiaridade do usuário. Evita "Esta Semana/Semana Passada" que são confusos e inconsistentes.

### Seções Interativas

- **Pedidos em Tempo Real** (lista atualizada a cada 30s)
- **Ações Rápidas** (aceitar pedidos, criar produtos, promoções)
- **Alertas e Notificações** (novos pedidos, produtos em falta)
- **Resumo Financeiro** (receita, custos, lucro estimado)

## 🏗️ Arquitetura da Feature

### Estrutura de Pastas

```
app/features/admin/dashboard/
├── components/
│   ├── cards/
│   │   ├── DashboardKpiCard.vue           # Card genérico para KPIs
│   │   ├── DashboardPedidosCard.vue       # Card de pedidos em tempo real
│   │   ├── DashboardFaturamentoCard.vue   # Card de faturamento
│   │   ├── DashboardProdutosCard.vue      # Card de produtos populares
│   │   └── DashboardAcoesCard.vue         # Card de ações rápidas
│   ├── charts/
│   │   ├── DashboardChartsContainer.vue   # Container com tabs de gráficos
│   │   ├── DashboardPedidosChart.vue      # Gráfico de pedidos por hora (tab padrão)
│   │   ├── DashboardFaturamentoChart.vue  # Linha temporal de faturamento
│   │   ├── DashboardStatusChart.vue       # Donut chart de status
│   │   ├── DashboardProdutosChart.vue     # Ranking de produtos
│   │   └── DashboardHeatmapChart.vue      # Mapa de calor de horários
│   ├── widgets/
│   │   ├── DashboardNotificacoes.vue      # Widget de notificações
│   │   ├── DashboardAlertas.vue           # Widget de alertas
│   │   ├── DashboardResumoFinanceiro.vue  # Resumo financeiro
│   │   └── DashboardMetricas.vue          # Métricas gerais
│   └── DashboardManager.vue               # Orquestrador principal
├── composables/
│   ├── useDashboardData.ts                # Composable principal de dados
│   ├── useDashboardKpis.ts                # Cálculo de KPIs
│   ├── useDashboardCharts.ts              # Dados para gráficos
│   ├── useDashboardRealtime.ts            # Atualizações em tempo real
│   ├── useDashboardFilters.ts             # Filtros de período
│   └── useDashboardActions.ts             # Ações rápidas
├── types/
│   ├── dashboard.ts                       # Tipos principais
│   ├── kpis.ts                           # Tipos de KPIs
│   ├── charts.ts                         # Tipos de gráficos
│   └── filters.ts                        # Tipos de filtros
├── utils/
│   ├── dashboard-calculations.ts          # Cálculos de métricas
│   ├── dashboard-formatters.ts            # Formatação específica
│   ├── dashboard-colors.ts                # Paleta de cores
│   └── dashboard-constants.ts             # Constantes
└── pages/
    └── DashboardPage.vue                  # Página principal (refatorada)
```

## 📊 Tipos TypeScript

### Tipos Principais

```typescript
// types/dashboard.ts
export interface DashboardData {
	kpis: DashboardKpis;
	charts: DashboardCharts;
	realtime: DashboardRealtime;
	filters: DashboardFilters;
}

export interface DashboardKpis {
	pedidos_hoje: KpiPedidos;
	faturamento: KpiFaturamento;
	produtos: KpiProdutos;
	performance: KpiPerformance;
}

export interface KpiPedidos {
	total: number;
	pendentes: number;
	em_andamento: number;
	concluidos: number;
	cancelados: number;
	variacao_ontem: number; // percentual
}

export interface KpiFaturamento {
	hoje: number;
	semana: number;
	mes: number;
	ticket_medio: number;
	variacao_semana: number; // percentual
}

export interface KpiProdutos {
	total_ativos: number;
	sem_estoque: number;
	mais_vendidos: ProdutoRanking[];
	menos_vendidos: ProdutoRanking[];
}

export interface KpiPerformance {
	tempo_medio_preparo: number; // minutos
	taxa_cancelamento: number; // percentual
	satisfacao_media: number; // 1-5
	entregas_no_prazo: number; // percentual
}
```

### Tipos de Gráficos

```typescript
// types/charts.ts
export interface ChartPedidosPorHora {
	labels: string[]; // ['00:00', '01:00', ...]
	datasets: {
		pedidos: number[];
		faturamento: number[];
	};
}

export interface ChartStatusDistribuicao {
	labels: string[];
	data: number[];
	colors: string[];
}

export interface ChartFaturamentoSemanal {
	labels: string[]; // ['Seg', 'Ter', ...]
	datasets: {
		atual: number[];
		anterior: number[];
	};
}

export interface ProdutoRanking {
	id: string;
	nome: string;
	quantidade_vendida: number;
	faturamento: number;
	imagem_url?: string;
}
```

### Tipos de Filtros

```typescript
// types/filters.ts
export type DashboardPeriodo = "todos" | "hoje" | "ontem" | "ultimos_7_dias" | "personalizado";

export interface DashboardFilters {
	periodo: DashboardPeriodo;
	data_inicio: Date | null;
	data_fim: Date | null;
}

export interface PeriodoConfig {
	id: DashboardPeriodo;
	label: string;
	descricao: string;
	calcularIntervalo: () => { inicio: Date | null; fim: Date | null };
}

// Configuração dos períodos disponíveis (mesmo padrão de pedidos)
export const PERIODOS_DASHBOARD: PeriodoConfig[] = [
	{
		id: "todos",
		label: "Todos",
		descricao: "Todos os períodos",
		calcularIntervalo: () => ({
			inicio: null,
			fim: null,
		}),
	},
	{
		id: "hoje",
		label: "Hoje",
		descricao: "Últimas 24 horas",
		calcularIntervalo: () => ({
			inicio: startOfDay(new Date()),
			fim: new Date(),
		}),
	},
	{
		id: "ontem",
		label: "Ontem",
		descricao: "Dia anterior completo",
		calcularIntervalo: () => {
			const ontem = subDays(new Date(), 1);
			return {
				inicio: startOfDay(ontem),
				fim: endOfDay(ontem),
			};
		},
	},
	{
		id: "ultimos_7_dias",
		label: "Últimos 7 dias",
		descricao: "7 dias corridos incluindo hoje",
		calcularIntervalo: () => ({
			inicio: startOfDay(subDays(new Date(), 6)), // 6 dias atrás + hoje = 7 dias
			fim: new Date(),
		}),
	},
	{
		id: "personalizado",
		label: "Personalizado",
		descricao: "Período específico",
		calcularIntervalo: () => ({
			inicio: null, // Será definido pelo usuário
			fim: null, // Será definido pelo usuário
		}),
	},
];
```

## 🔧 Composables

### 1. useDashboardData.ts (Principal)

```typescript
export const useDashboardData = () => {
	const kpis = ref<DashboardKpis | null>(null);
	const charts = ref<DashboardCharts | null>(null);
	const loading = ref(false);
	const error = ref<string | null>(null);

	// Filtros de período (mesmo padrão de pedidos)
	const periodo = ref<DashboardPeriodo>("todos"); // Padrão: todos
	const dataInicio = ref<Date | null>(null);
	const dataFim = ref<Date | null>(null);

	// Carregar dados principais
	const carregarDados = async () => {
		/* ... */
	};

	// Auto-refresh a cada 30 segundos
	const { pause, resume } = useIntervalFn(carregarDados, 30000);

	return {
		kpis: readonly(kpis),
		charts: readonly(charts),
		loading: readonly(loading),
		error: readonly(error),
		periodo,
		dataInicio,
		dataFim,
		carregarDados,
		pauseAutoRefresh: pause,
		resumeAutoRefresh: resume,
	};
};
```

### 2. useDashboardKpis.ts (Cálculos)

```typescript
export const useDashboardKpis = () => {
	const calcularKpisPedidos = (pedidos: PedidoCompleto[]): KpiPedidos => {
		const hoje = new Date();
		const ontem = subDays(hoje, 1);

		const pedidosHoje = pedidos.filter((p) => isSameDay(new Date(p.created_at), hoje));

		const pedidosOntem = pedidos.filter((p) => isSameDay(new Date(p.created_at), ontem));

		return {
			total: pedidosHoje.length,
			pendentes: pedidosHoje.filter((p) => p.status === "pendente").length,
			em_andamento: pedidosHoje.filter((p) =>
				["aceito", "preparo", "pronto", "entrega"].includes(p.status),
			).length,
			concluidos: pedidosHoje.filter((p) => p.status === "concluido").length,
			cancelados: pedidosHoje.filter((p) => p.status === "cancelado").length,
			variacao_ontem: calcularVariacao(pedidosHoje.length, pedidosOntem.length),
		};
	};

	const calcularKpisFaturamento = (pedidos: PedidoCompleto[]): KpiFaturamento => {
		// Implementar cálculos de faturamento
	};

	return {
		calcularKpisPedidos,
		calcularKpisFaturamento,
		calcularKpisProdutos,
		calcularKpisPerformance,
	};
};
```

### 3. useDashboardRealtime.ts (Tempo Real)

```typescript
export const useDashboardRealtime = () => {
	const pedidosRecentes = ref<PedidoCompleto[]>([]);
	const notificacoes = ref<DashboardNotificacao[]>([]);
	const alertas = ref<DashboardAlerta[]>([]);

	// Polling de pedidos novos
	const { pause, resume } = useIntervalFn(async () => {
		const novosPedidos = await buscarPedidosRecentes();

		// Detectar novos pedidos
		const novos = novosPedidos.filter(
			(novo) => !pedidosRecentes.value.some((existente) => existente.id === novo.id),
		);

		// Adicionar notificações
		novos.forEach((pedido) => {
			notificacoes.value.unshift({
				id: generateId(),
				tipo: "novo_pedido",
				titulo: "Novo Pedido",
				mensagem: `Pedido #${pedido.numero} de ${pedido.cliente_nome}`,
				pedido_id: pedido.id,
				created_at: new Date().toISOString(),
				lida: false,
			});
		});

		pedidosRecentes.value = novosPedidos;
	}, 10000); // 10 segundos

	return {
		pedidosRecentes: readonly(pedidosRecentes),
		notificacoes: readonly(notificacoes),
		alertas: readonly(alertas),
		pauseRealtime: pause,
		resumeRealtime: resume,
	};
};
```

## 🎨 Componentes

### 1. DashboardKpiCard.vue (Genérico)

```vue
<template>
	<UiCard class="p-6">
		<div class="flex items-center justify-between">
			<div>
				<p class="text-sm text-[var(--text-muted)] mb-1">{{ titulo }}</p>
				<p class="text-2xl font-bold text-[var(--text-primary)]">
					{{ formatarValor(valor) }}
				</p>
				<div v-if="variacao !== undefined" class="flex items-center mt-2">
					<Icon
						:name="variacao >= 0 ? 'lucide:trending-up' : 'lucide:trending-down'"
						:class="['w-4 h-4 mr-1', variacao >= 0 ? 'text-green-500' : 'text-red-500']"
					/>
					<span :class="['text-sm font-medium', variacao >= 0 ? 'text-green-500' : 'text-red-500']">
						{{ Math.abs(variacao) }}%
					</span>
					<span class="text-sm text-[var(--text-muted)] ml-1"> vs {{ periodoComparacao }} </span>
				</div>
			</div>
			<div class="w-12 h-12 rounded-lg flex items-center justify-center" :class="corFundo">
				<Icon :name="icone" class="w-6 h-6" :class="corIcone" />
			</div>
		</div>
	</UiCard>
</template>
```

### 2. DashboardChartsContainer.vue (Container com Tabs)

```vue
<template>
	<UiCard class="p-6">
		<div class="flex items-center justify-between mb-6">
			<h3 class="text-lg font-semibold text-[var(--text-primary)]">Análises</h3>
			<UiSelect v-model="periodo" size="sm">
				<option value="todos">Todos</option>
				<option value="hoje">Hoje</option>
				<option value="ontem">Ontem</option>
				<option value="ultimos_7_dias">Últimos 7 dias</option>
				<option value="personalizado">Personalizado</option>
			</UiSelect>
		</div>

		<!-- Tabs de Gráficos -->
		<div class="border-b border-[var(--border-default)] mb-6">
			<nav class="flex space-x-8">
				<button
					v-for="tab in tabs"
					:key="tab.id"
					@click="activeTab = tab.id"
					:class="[
						'py-2 px-1 border-b-2 font-medium text-sm transition-colors',
						activeTab === tab.id
							? 'border-primary text-primary'
							: 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]',
					]"
				>
					<Icon :name="tab.icon" class="w-4 h-4 mr-2 inline" />
					{{ tab.label }}
				</button>
			</nav>
		</div>

		<!-- Conteúdo do Gráfico Ativo -->
		<div class="h-80">
			<DashboardPedidosChart v-if="activeTab === 'pedidos'" :periodo="periodo" />
			<DashboardFaturamentoChart v-else-if="activeTab === 'faturamento'" :periodo="periodo" />
			<DashboardStatusChart v-else-if="activeTab === 'status'" :periodo="periodo" />
			<DashboardProdutosChart v-else-if="activeTab === 'produtos'" :periodo="periodo" />
			<DashboardHeatmapChart v-else-if="activeTab === 'horarios'" :periodo="periodo" />
		</div>
	</UiCard>
</template>

<script setup lang="ts">
const activeTab = ref("pedidos"); // Tab padrão: Pedidos por Hora

const tabs = [
	{ id: "pedidos", label: "Pedidos", icon: "lucide:trending-up" },
	{ id: "faturamento", label: "Faturamento", icon: "lucide:dollar-sign" },
	{ id: "status", label: "Status", icon: "lucide:pie-chart" },
	{ id: "produtos", label: "Produtos", icon: "lucide:package" },
	{ id: "horarios", label: "Horários", icon: "lucide:clock" },
];

const periodo = ref("todos"); // Padrão: todos os períodos
</script>
```

## 📱 Responsividade

### Breakpoints

- **Mobile** (< 768px): 1 coluna, cards empilhados
- **Tablet** (768px - 1024px): 2 colunas, gráficos adaptados
- **Desktop** (> 1024px): 3-4 colunas, layout completo

### Layout Grid

```css
.dashboard-grid {
	display: grid;
	gap: 1.5rem;

	/* Mobile */
	grid-template-columns: 1fr;

	/* Tablet */
	@media (min-width: 768px) {
		grid-template-columns: repeat(2, 1fr);
	}

	/* Desktop */
	@media (min-width: 1024px) {
		grid-template-columns: repeat(4, 1fr);
	}
}
```

## 🔄 Atualizações em Tempo Real

### Estratégias

1. **Polling** (30s): Dados gerais e KPIs
2. **Polling Rápido** (10s): Pedidos novos e notificações
3. **WebSockets** (futuro): Atualizações instantâneas

### Otimizações

- **Cache inteligente**: Evitar requests desnecessários
- **Debounce**: Agrupar atualizações
- **Lazy loading**: Carregar gráficos sob demanda
- **Virtual scrolling**: Listas grandes de pedidos

## 🎯 Métricas de Performance

### Objetivos

- **Carregamento inicial**: < 2s
- **Atualização de dados**: < 500ms
- **Renderização de gráficos**: < 1s
- **Responsividade**: 60fps

### Monitoramento

- **Core Web Vitals**: LCP, FID, CLS
- **Tempo de resposta**: APIs e queries
- **Uso de memória**: Gráficos e dados em cache

## 🚀 Roadmap de Implementação

### Fase 1: Estrutura Base (1-2 dias)

- [ ] Criar estrutura de pastas
- [ ] Definir tipos TypeScript
- [ ] Implementar composables básicos
- [ ] Criar componentes de KPI

### Fase 2: Gráficos e Visualizações (2-3 dias)

- [ ] Integrar Chart.js
- [ ] Implementar gráficos principais
- [ ] Adicionar interatividade
- [ ] Otimizar performance

### Fase 3: Tempo Real e Ações (1-2 dias)

- [ ] Implementar polling
- [ ] Sistema de notificações
- [ ] Ações rápidas
- [ ] Alertas automáticos

### Fase 4: Polimento e Testes (1 dia)

- [ ] Responsividade completa
- [ ] Testes unitários
- [ ] Otimizações finais
- [ ] Documentação

## 📦 Dependências Necessárias

```json
{
	"dependencies": {
		"chart.js": "^4.4.0",
		"date-fns": "^3.0.0"
	},
	"devDependencies": {
		"@types/chart.js": "^2.9.41"
	}
}
```

### Por que date-fns?

**date-fns** é uma biblioteca moderna para manipulação de datas em JavaScript, essencial para a dashboard:

#### Funcionalidades Usadas:

- **`isSameDay()`**: Comparar se duas datas são do mesmo dia
- **`subDays()`**: Subtrair dias de uma data (ex: ontem, semana passada)
- **`startOfWeek()` / `endOfWeek()`**: Calcular início/fim da semana
- **`format()`**: Formatação customizada de datas
- **`differenceInHours()`**: Calcular diferença em horas entre datas
- **`eachHourOfInterval()`**: Gerar array de horas para gráficos

#### Exemplos de Uso na Dashboard:

```typescript
import { isSameDay, subDays, startOfWeek, format, eachHourOfInterval } from "date-fns";

// Filtrar pedidos de hoje vs ontem
const hoje = new Date();
const ontem = subDays(hoje, 1);
const pedidosHoje = pedidos.filter((p) => isSameDay(new Date(p.created_at), hoje));

// Gerar labels para gráfico de horas (00:00, 01:00, ...)
const horasDodia = eachHourOfInterval({
	start: startOfDay(hoje),
	end: endOfDay(hoje),
}).map((hora) => format(hora, "HH:mm"));

// Calcular período da semana
const inicioSemana = startOfWeek(hoje, { weekStartsOn: 1 }); // Segunda-feira
```

#### Vantagens sobre Date nativo:

- **Imutável**: Não modifica datas originais
- **Tree-shakable**: Importa apenas funções usadas
- **TypeScript**: Tipagem completa
- **Internacionalização**: Suporte a locales (pt-BR)
- **Confiável**: Lida com edge cases (fusos, anos bissextos)

## 🎨 Design System

### Cores da Dashboard

```typescript
export const DASHBOARD_COLORS = {
	primary: "#3B82F6",
	success: "#10B981",
	warning: "#F59E0B",
	error: "#EF4444",
	info: "#06B6D4",
	neutral: "#6B7280",
} as const;
```

### Paleta de Gráficos

```typescript
export const CHART_COLORS = [
	"#3B82F6",
	"#10B981",
	"#F59E0B",
	"#EF4444",
	"#8B5CF6",
	"#06B6D4",
	"#84CC16",
	"#F97316",
] as const;
```

---

**Total Estimado**: 6-8 dias de desenvolvimento
**Complexidade**: Média-Alta
**Prioridade**: Alta (core feature)

Esta dashboard será o coração do sistema administrativo, fornecendo insights valiosos e controle total sobre o negócio! 🚀
