# Planejamento de Refatoração da Dashboard

Este documento detalha o plano de refatoração para a feature de Dashboard (`features/admin/dashboard`), visando melhorar a organização do código, separação de responsabilidades e tipagem, **mantendo rigorosamente a identidade visual atual**.

## 1. Visão Geral

O objetivo é transformar o `DashboardManager.vue` (atualmente monolítico) em uma composição de componentes especializados, conectados a um gerenciamento de estado robusto (`useDashboard`). Isso facilitará a manutenção futura e a conexão com dados reais do Supabase (sem intermediário server/api).

### Metas Principais

- **Componentização**: Quebrar o arquivo gigante em componentes semânticos.
- **Supabase Integration**: Substituir o roteamento via `server/api` por chamadas diretas via **Client Supabase** (Reads com RLS) e **RPCs** (apenas se houver necessidade de escrita complexa/segura, embora Dashboard seja majoritariamente Read).
- **Tipagem**: Garantir que todos os props e dados sigam as interfaces de `types/dashboard.ts`.
- **Preservação Visual**: Manter o design "wow" com gradientes, sombras e animações **exatamente** como estão no código original.

---

## 2. Nova Estrutura de Arquivos

A estrutura de pastas será reorganizada para refletir a separação de responsabilidades:

```
app/features/admin/dashboard/
├── components/
│   ├── layout/
│   │   ├── DashboardHeader.vue       # Título, data e botões de ação (Refresh/Relatório)
│   │   └── DashboardStatsGrid.vue    # Grid com os 4 Cards de KPI (Substitui o HTML inline)
│   │
│   ├── charts/
│   │   ├── DashboardChartsSection.vue # Tabs + Área de Gráficos
│   │   └── DashboardGraficos.vue     # (Já existe, manter/refatorar se necessário)
│   │
│   ├── lists/
│   │   ├── DashboardRankingList.vue  # Lista "Mais Vendidos" (Barra de progresso)
│   │   └── DashboardLiveFeed.vue     # Lista "Feed de Pedidos" (Live update)
│   │
│   ├── efficiency/
│   │   └── DashboardEfficiency.vue   # Cards de Eficiência Operacional (Preparo, Entrega, etc)
│   │
│   └── ui/
│       └── DashboardStatsCard.vue    # Componente base para os Cards KPI (Gradientes)
│
├── composables/
│   ├── useDashboard.ts               # Orquestrador (Manter)
│   ├── useDashboardKpis.ts           # Lógica de KPIs (Adaptação para Supabase)
│   ├── useDashboardCharts.ts         # Lógica de Gráficos (Adaptação para Supabase)
│   ├── useDashboardRealtime.ts       # Lógica de Feed/Notificações (Adaptação para Supabase)
│   └── useDashboardFilters.ts        # Lógica de Filtros (Manter)
│
└── types/
    ├── dashboard.ts                  # Interfaces de resposta API e Props
    └── filters.ts                    # Tipos de filtros
```

---

## 3. Detalhamento dos Componentes

### 3.1. `DashboardStatsCard.vue` (Novo)

Este componente encapsulará o design visual dos cards do topo, permitindo reuso sem duplicar HTML.

- **Props**: `title`, `value`, `icon`, `trend` (value, label, direction), `variant` (emerald, blue, violet, rose).
- **Design**: Deve conter exatamente as classes Tailwind de gradiente e efeitos de hover atuais.

### 3.2. `DashboardStatsGrid.vue`

Responsável por receber o objeto `kpis` do hook `useDashboard` e renderizar os 4 cards utilizando o `DashboardStatsCard`.

- **Lógica**: Mapear `kpis.faturamento`, `kpis.pedidos`, `kpis.clientes`, `kpis.conversao` para os cards.

### 3.3. `DashboardChartsSection.vue`

Extrair a lógica das Tabs e o seletor de período que hoje está no meio do `DashboardManager`.

- **Input**: `charts` data e controle de filtros.
- **Responsabilidade**: Gerenciar qual tab está ativa localmente, mas usar os dados globais.

### 3.4. `DashboardRankingList.vue`

Substituir o `v-for` hardcoded da seção "Mais Vendidos".

- **Props**: `items: ProdutoRanking[]`.
- **Lógica**: Calcular as cores e larguras das barras baseadas nos valores reais.

### 3.5. `DashboardLiveFeed.vue`

Substituir o `v-for` hardcoded do "Feed de Pedidos".

- **Props**: `orders: PedidoResumo[]`.
- **Lógica**: Formatar status (cores das badges) e tempos ("há 5 min") usando date-fns.

### 3.6. `DashboardEfficiency.vue`

Container para os cards de "Eficiência Operacional".

- **Input**: `performance: KpiPerformance`.
- **Lógica**: Exibir os cards de Tempo, Entrega, Avaliação e Cancelamentos com os dados reais.

---

## 4. Integração de Dados (Arquitetura Supabase)

O usuário definiu uma arquitetura estrita:

- **Leitura (Read)**: Apenas queries diretas do cliente Supabase (`.from(...)`) confiando no **RLS** (Row Level Security).
- **Escrita (Create/Update/Delete)**: Apenas via **RPC** (Remote Procedure Calls) com `security definer`.
- **Sem `server/api`**: Não utilizaremos a pasta `server/` do Nuxt para APIs.

### Ajuste nos Composables

Os arquivos em `composables/*.ts` (ex: `useDashboardKpis.ts`) devem ser refatorados para realizar as chamadas Supabase diretamente.

**Exemplo de Fluxo (Read):**

```typescript
// useDashboardKpis.ts
const supabase = useSupabaseClient<Database>();
const { data, error } = await supabase
	.from("pedidos")
	.select("total, status, created_at")
	.gte("created_at", inicioDia)
	.lte("created_at", fimDia);
// ... lógica de cálculo local ou via .select com count/sum
```

---

## 5. Plano de Execução

1.  **Refatoração de Tipos**: Unificar `DashboardPeriodo` e garantir consistência em `types/dashboard.ts`.
2.  **Criação de UI Components**:
    - Criar `DashboardStatsCard.vue` com o CSS extraído do `DashboardManager`.
    - Criar `DashboardRankingList.vue` e `DashboardLiveFeed.vue` isolados.
3.  **Refatoração do `DashboardManager`**:
    - Importar os novos componentes.
    - Passar os dados de `useDashboard()` para eles via props.
    - Remover todo o HTML inline "pesado".
4.  **Implementação da Lógica Supabase**:
    - Atualizar `useDashboardKpis.ts`, `useDashboardCharts.ts`, etc., para buscar dados reais do Supabase.
    - Excluir arquivos obsoletos em `server/api/admin/dashboard/`.

---

## 6. Observações Importantes

- **Não alterar o CSS/Design**: O usuário explicitou que o visual está aprovado. Ao extrair para componentes, a prioridade máxima é **copiar exatamente** as classes Tailwind existentes.
- **Tipagem Segura**: Utilizar tipos do Supabase (Database types) sempre que possível para garantir type-safety nas queries.
