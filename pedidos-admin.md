# 📋 Planejamento: Página de Pedidos - Painel Admin

## 🎯 Objetivo

Criar interface completa para o estabelecimento gerenciar pedidos em tempo real, com filtros, ações e visualização detalhada.

---

## 📊 Visão Geral

### Funcionalidades Principais

1. **Listagem de Pedidos** - Visualização em cards/lista (toggle) com filtros
2. **Filtros e Busca** - Por status, data, tipo de entrega, forma de pagamento
3. **Ações em Pedidos** - Aceitar, preparar, finalizar, cancelar
4. **Detalhes do Pedido** - Modal/drawer com todas informações
5. **Atualização em Tempo Real** - Polling (10 segundos)
6. ~~**Notificações Sonoras**~~ - Fase 2 (futuro)
7. ~~**Impressão**~~ - Fase 2 (futuro)
8. ~~**Realtime Supabase**~~ - Fase 2 (futuro)

---

## 🎨 Layout e UX

### Estrutura da Página (Similar ao Cardápio)

```
┌─────────────────────────────────────────────────────────┐
│ 📋 Pedidos                      [🔲 Cards] [☰ Lista]    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ [Tabs: Pendentes | Aceitos | Em Preparo | Prontos |    │
│         Em Entrega | Concluídos | Cancelados]           │
│                                                          │
│ ┌────────────────────────────────────────────────────┐ │
│ │ 🔍 Buscar por número, cliente...                   │ │
│ │ [Filtros: Hoje | Ontem | Últimos 7 dias | Custom] │ │
│ │ [Tipo: Todos | Delivery | Retirada]                │ │
│ │ [Pagamento: Todos | Dinheiro | PIX | Cartão]       │ │
│ └────────────────────────────────────────────────────┘ │
│                                                          │
│ MODO CARDS:                                             │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐    │
│ │ Pedido #123  │ │ Pedido #124  │ │ Pedido #125  │    │
│ │ 🕐 10:30     │ │ 🕐 10:35     │ │ 🕐 10:40     │    │
│ │ João Silva   │ │ Maria Costa  │ │ Pedro Lima   │    │
│ │ 🚚 Delivery  │ │ 🏪 Retirada  │ │ 🚚 Delivery  │    │
│ │ 💰 R$ 45,00  │ │ 💰 R$ 32,00  │ │ 💰 R$ 78,00  │    │
│ │ [Aceitar]    │ │ [Preparar]   │ │ [Pronto]     │    │
│ └──────────────┘ └──────────────┘ └──────────────┘    │
│                                                          │
│ MODO LISTA:                                             │
│ ┌────────────────────────────────────────────────────┐ │
│ │ #123 | João Silva | 🚚 | R$ 45,00 | [Aceitar]     │ │
│ │ #124 | Maria Costa | 🏪 | R$ 32,00 | [Preparar]   │ │
│ │ #125 | Pedro Lima | 🚚 | R$ 78,00 | [Pronto]      │ │
│ └────────────────────────────────────────────────────┘ │
│                                                          │
│ [Carregar mais...]                                      │
└─────────────────────────────────────────────────────────┘
```

### Modal de Detalhes

```
┌─────────────────────────────────────────────────────────┐
│ Pedido #123                                      [✕]    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ � Aguardando Confirmação                               │
│ 🕐 Realizado há 5 minutos (10:30)                       │
│                                                          │
│ ┌────────────────────────────────────────────────────┐ │
│ │ � Cliente                                          │ │
│ │ João Silva                                          │ │
│ │ 📱 (11) 99999-9999                                  │ │
│ │ 📧 joao@email.com                                   │ │
│ └────────────────────────────────────────────────────┘ │
│                                                          │
│ ┌────────────────────────────────────────────────────┐ │
│ │ 🚚 Entrega                                          │ │
│ │ Rua Exemplo, 123 - Apto 45                         │ │
│ │ Centro - São Paulo/SP                               │ │
│ │ CEP: 01234-567                                      │ │
│ │ Ref: Próximo ao mercado                            │ │
│ └────────────────────────────────────────────────────┘ │
│                                                          │
│ ┌────────────────────────────────────────────────────┐ │
│ │ � Itens (3)                                        │ │
│ │ 2x Pizza Margherita (Grande)                       │ │
│ │    + Borda recheada                                │ │
│ │    Obs: Sem cebola                        R$ 60,00 │ │
│ │                                                     │ │
│ │ 1x Refrigerante 2L                        R$ 10,00 │ │
│ └────────────────────────────────────────────────────┘ │
│                                                          │
│ ┌────────────────────────────────────────────────────┐ │
│ │ 💰 Pagamento                                        │ │
│ │ Forma: Dinheiro                                     │ │
│ │ Troco para: R$ 100,00                              │ │
│ │                                                     │ │
│ │ Subtotal:        R$ 70,00                          │ │
│ │ Taxa de entrega: R$  5,00                          │ │
│ │ Total:           R$ 75,00                          │ │
│ └────────────────────────────────────────────────────┘ │
│                                                          │
│ [❌ Cancelar] [✅ Aceitar Pedido]                       │
└─────────────────────────────────────────────────────────┘
```

---

## 🔄 Fluxo de Status

```
pendente → aceito → preparo → pronto → entrega → concluido
    ↓
cancelado
```

### Ações por Status

| Status        | Ações Disponíveis                                  | Próximo Status     |
| ------------- | -------------------------------------------------- | ------------------ |
| **Pendente**  | Aceitar, Cancelar                                  | aceito, cancelado  |
| **Aceito**    | Iniciar Preparo, Cancelar                          | preparo, cancelado |
| **Preparo**   | Marcar como Pronto                                 | pronto             |
| **Pronto**    | Saiu para Entrega (delivery) / Concluir (retirada) | entrega, concluido |
| **Entrega**   | Marcar como Entregue                               | concluido          |
| **Concluído** | Visualizar apenas                                  | -                  |
| **Cancelado** | Visualizar apenas                                  | -                  |

---

## 📁 Estrutura de Arquivos

```
app/features/admin/pedidos/
├── pages/
│   └── PedidosPage.vue                    # Página principal
├── components/
│   ├── PedidoCard.vue                     # Card do pedido (modo cards)
│   ├── PedidoListaItem.vue                # Item da lista (modo lista)
│   ├── PedidoDetalhesModal.vue            # Modal com detalhes completos
│   ├── PedidoFiltros.vue                  # Filtros e busca
│   ├── PedidoTabs.vue                     # Tabs de status
│   ├── PedidoAcoes.vue                    # Botões de ação
│   └── PedidoViewToggle.vue               # Toggle Cards/Lista
├── composables/
│   ├── usePedidos.ts                      # Lógica principal (leitura com RLS)
│   ├── usePedidoAcoes.ts                  # Ações via RPC (CUD)
│   └── usePedidoFiltros.ts                # Filtros e busca
├── types/
│   └── pedidos-admin.ts                   # Tipos específicos do admin
└── utils/
    └── pedido-formatters.ts               # Formatadores

app/pages/admin/
└── pedidos.vue                            # Rota: /admin/pedidos
```

---

## 🔧 Funcionalidades Técnicas

### 1. Listagem de Pedidos (Leitura com RLS)

**Composable: `usePedidos.ts`**

```typescript
export const usePedidos = () => {
	const supabase = useSupabaseClient();
	const pedidos = ref<PedidoCompleto[]>([]);
	const loading = ref(false);
	const filtros = ref<FiltrosPedidos>({
		status: null,
		data_inicio: null,
		data_fim: null,
		tipo_entrega: null,
		forma_pagamento: null,
		busca: "",
	});

	/**
	 * Buscar pedidos com RLS (leitura direta)
	 * RLS garante que só vê pedidos do seu estabelecimento
	 */
	const buscarPedidos = async () => {
		loading.value = true;

		let query = supabase
			.from("pedidos")
			.select(
				`
        *,
        itens:pedido_itens(
          *,
          adicionais:pedido_itens_adicionais(*)
        )
      `,
			)
			.order("created_at", { ascending: false });

		// Aplicar filtros
		if (filtros.value.status) {
			query = query.eq("status", filtros.value.status);
		}

		if (filtros.value.data_inicio) {
			query = query.gte("created_at", filtros.value.data_inicio);
		}

		if (filtros.value.data_fim) {
			query = query.lte("created_at", filtros.value.data_fim);
		}

		if (filtros.value.tipo_entrega) {
			query = query.eq("tipo_entrega", filtros.value.tipo_entrega);
		}

		if (filtros.value.forma_pagamento) {
			query = query.eq("forma_pagamento", filtros.value.forma_pagamento);
		}

		const { data, error } = await query;

		if (!error && data) {
			pedidos.value = data;
		}

		loading.value = false;
	};

	const pedidosPorStatus = computed(() => {
		// Agrupar pedidos por status
		return pedidos.value.reduce(
			(acc, pedido) => {
				if (!acc[pedido.status]) {
					acc[pedido.status] = [];
				}
				acc[pedido.status].push(pedido);
				return acc;
			},
			{} as Record<string, PedidoCompleto[]>,
		);
	});

	return {
		pedidos,
		loading,
		filtros,
		buscarPedidos,
		pedidosPorStatus,
	};
};
```

### 2. Ações em Pedidos (CUD via RPC)

**Composable: `usePedidoAcoes.ts`**

```typescript
export const usePedidoAcoes = () => {
	const supabase = useSupabaseClient();

	const aceitarPedido = async (pedidoId: string) => {
		const { error } = await supabase.rpc("atualizar_status_pedido", {
			p_pedido_id: pedidoId,
			p_novo_status: "aceito",
		});

		if (error) throw error;
	};

	const iniciarPreparo = async (pedidoId: string) => {
		const { error } = await supabase.rpc("atualizar_status_pedido", {
			p_pedido_id: pedidoId,
			p_novo_status: "preparo",
		});

		if (error) throw error;
	};

	const marcarPronto = async (pedidoId: string) => {
		const { error } = await supabase.rpc("atualizar_status_pedido", {
			p_pedido_id: pedidoId,
			p_novo_status: "pronto",
		});

		if (error) throw error;
	};

	const sairParaEntrega = async (pedidoId: string) => {
		const { error } = await supabase.rpc("atualizar_status_pedido", {
			p_pedido_id: pedidoId,
			p_novo_status: "entrega",
		});

		if (error) throw error;
	};

	const concluirPedido = async (pedidoId: string) => {
		const { error } = await supabase.rpc("atualizar_status_pedido", {
			p_pedido_id: pedidoId,
			p_novo_status: "concluido",
		});

		if (error) throw error;
	};

	const cancelarPedido = async (pedidoId: string, motivo: string) => {
		const { error } = await supabase.rpc("cancelar_pedido", {
			p_pedido_id: pedidoId,
			p_motivo: motivo,
		});

		if (error) throw error;
	};

	return {
		aceitarPedido,
		iniciarPreparo,
		marcarPronto,
		sairParaEntrega,
		concluirPedido,
		cancelarPedido,
	};
};
```

### 3. Filtros e Busca (Client-side)

**Composable: `usePedidoFiltros.ts`**

```typescript
export const usePedidoFiltros = () => {
	const aplicarBusca = (pedidos: Pedido[], termo: string) => {
		if (!termo) return pedidos;

		const termoLower = termo.toLowerCase();
		return pedidos.filter(
			(p) =>
				p.numero.toString().includes(termoLower) ||
				p.cliente_nome.toLowerCase().includes(termoLower) ||
				p.cliente_telefone.includes(termo),
		);
	};

	return { aplicarBusca };
};
```

### 4. Atualização em Tempo Real (Polling)

```typescript
// No componente principal
const intervalId = ref<NodeJS.Timeout | null>(null);

onMounted(() => {
	// Buscar inicial
	buscarPedidos();

	// Polling a cada 10 segundos
	intervalId.value = setInterval(() => {
		buscarPedidos();
	}, 10000);
});

onUnmounted(() => {
	if (intervalId.value) {
		clearInterval(intervalId.value);
	}
});
```

---

## 🗄️ Banco de Dados - RPCs Necessárias

### 1. Atualizar Status do Pedido (CUD)

```sql
CREATE OR REPLACE FUNCTION atualizar_status_pedido(
  p_pedido_id UUID,
  p_novo_status status_pedido
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Validar se usuário tem permissão (mesmo estabelecimento)
  IF NOT EXISTS (
    SELECT 1 FROM pedidos p
    JOIN perfis pf ON pf.estabelecimento_id = p.estabelecimento_id
    WHERE p.id = p_pedido_id AND pf.id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Sem permissão para atualizar este pedido';
  END IF;

  -- Atualizar status e timestamp correspondente
  UPDATE pedidos
  SET
    status = p_novo_status,
    updated_at = now(),
    aceito_em = CASE WHEN p_novo_status = 'aceito' THEN now() ELSE aceito_em END,
    preparo_em = CASE WHEN p_novo_status = 'preparo' THEN now() ELSE preparo_em END,
    pronto_em = CASE WHEN p_novo_status = 'pronto' THEN now() ELSE pronto_em END,
    entrega_em = CASE WHEN p_novo_status = 'entrega' THEN now() ELSE entrega_em END,
    concluido_em = CASE WHEN p_novo_status = 'concluido' THEN now() ELSE concluido_em END
  WHERE id = p_pedido_id;
END;
$$;
```

### 2. Cancelar Pedido (CUD)

```sql
CREATE OR REPLACE FUNCTION cancelar_pedido(
  p_pedido_id UUID,
  p_motivo TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Validar permissão
  IF NOT EXISTS (
    SELECT 1 FROM pedidos p
    JOIN perfis pf ON pf.estabelecimento_id = p.estabelecimento_id
    WHERE p.id = p_pedido_id AND pf.id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Sem permissão para cancelar este pedido';
  END IF;

  -- Atualizar para cancelado
  UPDATE pedidos
  SET
    status = 'cancelado',
    cancelado_em = now(),
    motivo_cancelamento = p_motivo,
    updated_at = now()
  WHERE id = p_pedido_id;
END;
$$;
```

**⚠️ IMPORTANTE:** Leitura (R) é feita com RLS diretamente, SEM RPC!

---

## 🎨 Design System

### Cores por Status

```typescript
const statusColors = {
	pendente: {
		bg: "bg-yellow-500/10",
		border: "border-yellow-500/20",
		text: "text-yellow-600",
		icon: "lucide:clock",
	},
	aceito: {
		bg: "bg-blue-500/10",
		border: "border-blue-500/20",
		text: "text-blue-600",
		icon: "lucide:check-circle",
	},
	preparo: {
		bg: "bg-orange-500/10",
		border: "border-orange-500/20",
		text: "text-orange-600",
		icon: "lucide:chef-hat",
	},
	pronto: {
		bg: "bg-purple-500/10",
		border: "border-purple-500/20",
		text: "text-purple-600",
		icon: "lucide:package-check",
	},
	entrega: {
		bg: "bg-indigo-500/10",
		border: "border-indigo-500/20",
		text: "text-indigo-600",
		icon: "lucide:bike",
	},
	concluido: {
		bg: "bg-green-500/10",
		border: "border-green-500/20",
		text: "text-green-600",
		icon: "lucide:check-circle-2",
	},
	cancelado: {
		bg: "bg-red-500/10",
		border: "border-red-500/20",
		text: "text-red-600",
		icon: "lucide:x-circle",
	},
};
```

---

## 🔐 Permissões (RBAC)

### Acesso à Página

| Cargo      | Acesso                           |
| ---------- | -------------------------------- |
| Admin      | ✅ Total                         |
| Gerente    | ✅ Total                         |
| Staff      | ✅ Visualizar e atualizar status |
| Entregador | ❌ Sem acesso                    |

### Ações por Cargo

| Ação               | Admin | Gerente | Staff |
| ------------------ | ----- | ------- | ----- |
| Visualizar pedidos | ✅    | ✅      | ✅    |
| Aceitar pedido     | ✅    | ✅      | ✅    |
| Atualizar status   | ✅    | ✅      | ✅    |
| Cancelar pedido    | ✅    | ✅      | ❌    |
| Ver relatórios     | ✅    | ✅      | ❌    |

---

## 📱 Responsividade

### Desktop (≥1024px)

- Grid de 3 colunas para cards
- Lista com todas colunas
- Modal lateral para detalhes
- Todos os filtros visíveis

### Tablet (768px - 1023px)

- Grid de 2 colunas
- Lista com colunas essenciais
- Modal centralizado
- Filtros colapsáveis

### Mobile (<768px)

- Lista vertical (1 coluna)
- Lista compacta
- Modal fullscreen
- Filtros em drawer

---

## ✅ Checklist de Implementação

### Fase 1 - MVP (Essencial)

- [ ] Criar estrutura de arquivos
- [ ] Criar tipos TypeScript
- [ ] Criar RPCs no banco (atualizar_status, cancelar)
- [ ] Implementar composable usePedidos (leitura com RLS)
- [ ] Implementar composable usePedidoAcoes (CUD com RPC)
- [ ] Implementar composable usePedidoFiltros
- [ ] Criar componente PedidoCard
- [ ] Criar componente PedidoListaItem
- [ ] Criar componente PedidoViewToggle
- [ ] Criar componente PedidoDetalhesModal
- [ ] Criar componente PedidoTabs
- [ ] Criar componente PedidoFiltros
- [ ] Criar página PedidosPage
- [ ] Implementar todos os filtros (status, data, tipo, pagamento, busca)
- [ ] Implementar ações (aceitar, preparar, pronto, concluir, cancelar)
- [ ] Implementar polling (10s)
- [ ] Testar permissões RBAC
- [ ] Testar responsividade

### Fase 2 - Melhorias (Futuro)

- [ ] Implementar Realtime Supabase
- [ ] Adicionar notificações sonoras
- [ ] Adicionar notificações desktop
- [ ] Criar template de impressão
- [ ] Adicionar timeline de status
- [ ] Adicionar exportação de relatórios
- [ ] Adicionar métricas e KPIs

---

## � Próximos Passos

1. ✅ Planejamento revisado e corrigido
2. ⏳ Criar RPCs no banco de dados
3. ⏳ Criar tipos TypeScript
4. ⏳ Implementar composables
5. ⏳ Criar componentes
6. ⏳ Integrar tudo na página principal
7. ⏳ Testar e ajustar

---

**Pronto para começar a implementação!** 🎯
