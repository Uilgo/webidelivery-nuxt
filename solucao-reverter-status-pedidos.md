# 🔄 Solução: Reverter Status de Pedidos

## ⚠️ PROBLEMA IDENTIFICADO

### Cenário Real:

1. Cliente cancela pedido → `status = 'cancelado'`, `cancelado_em = timestamp`
2. Cliente liga arrependido (5 min depois) → quer reativar
3. Estabelecimento precisa voltar para `pendente` ou `aceito`

### ❌ Problema com Estrutura Atual:

```sql
UPDATE pedidos
SET status = 'pendente',
    cancelado_em = NULL  -- ❌ PERDE O HISTÓRICO!
WHERE id = 'xxx';
```

**Você PERDE:**

- Quando foi cancelado
- Por que foi cancelado
- Quantas vezes foi cancelado
- Quem cancelou

### Outras Reversões Necessárias:

- `cancelado` → `pendente` (cliente voltou atrás)
- `aceito` → `pendente` (erro ao aceitar)
- `preparo` → `aceito` (faltou ingrediente)
- `pronto` → `preparo` (erro na montagem)
- `entrega` → `pronto` (entregador não disponível)

---

## ✅ SOLUÇÃO: Estrutura Híbrida

### Estratégia: Melhor dos Dois Mundos

1. **MANTER** campos atuais (`aceito_em`, `preparo_em`, etc) → Performance
2. **ADICIONAR** tabela `pedido_historico` → Auditoria completa

---

## 📋 1. Criar Tabela de Histórico

```sql
-- Tabela para registrar TODAS as mudanças de status
CREATE TABLE pedido_historico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  status_anterior status_pedido,
  status_novo status_pedido NOT NULL,
  usuario_id UUID REFERENCES auth.users(id),
  usuario_nome TEXT, -- desnormalizado para histórico
  observacao TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Índices para performance
CREATE INDEX idx_pedido_historico_pedido
ON pedido_historico(pedido_id, created_at DESC);

CREATE INDEX idx_pedido_historico_created_at
ON pedido_historico(created_at DESC);

CREATE INDEX idx_pedido_historico_usuario
ON pedido_historico(usuario_id);

-- RLS
ALTER TABLE pedido_historico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários veem histórico do seu estabelecimento"
ON pedido_historico
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM pedidos p
    INNER JOIN perfis pf ON pf.estabelecimento_id = p.estabelecimento_id
    WHERE p.id = pedido_historico.pedido_id
    AND pf.id = auth.uid()
  )
);

CREATE POLICY "Usuários inserem histórico do seu estabelecimento"
ON pedido_historico
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM pedidos p
    INNER JOIN perfis pf ON pf.estabelecimento_id = p.estabelecimento_id
    WHERE p.id = pedido_historico.pedido_id
    AND pf.id = auth.uid()
  )
);
```

---

## 🔧 2. Atualizar RPC de Mudança de Status

```sql
CREATE OR REPLACE FUNCTION atualizar_status_pedido_v2(
  p_pedido_id UUID,
  p_novo_status status_pedido,
  p_observacao TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_status_anterior status_pedido;
  v_estabelecimento_id UUID;
  v_usuario_id UUID;
  v_usuario_nome TEXT;
  v_timestamp TIMESTAMPTZ;
BEGIN
  -- Buscar dados atuais do pedido
  SELECT status, estabelecimento_id
  INTO v_status_anterior, v_estabelecimento_id
  FROM pedidos
  WHERE id = p_pedido_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Pedido não encontrado'
    );
  END IF;

  -- Verificar permissão (RLS)
  IF NOT EXISTS (
    SELECT 1 FROM perfis
    WHERE id = auth.uid()
    AND estabelecimento_id = v_estabelecimento_id
    AND cargo IN ('admin', 'gerente', 'staff')
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Sem permissão'
    );
  END IF;

  -- Buscar dados do usuário
  SELECT id, nome || ' ' || sobrenome
  INTO v_usuario_id, v_usuario_nome
  FROM perfis
  WHERE id = auth.uid();

  -- Timestamp atual
  v_timestamp := now();

  -- Atualizar campos de timestamp na tabela pedidos
  -- IMPORTANTE: Não limpar timestamps antigos, apenas atualizar o novo
  CASE p_novo_status
    WHEN 'aceito' THEN
      UPDATE pedidos SET
        status = p_novo_status,
        aceito_em = v_timestamp,
        updated_at = v_timestamp
      WHERE id = p_pedido_id;

    WHEN 'preparo' THEN
      UPDATE pedidos SET
        status = p_novo_status,
        preparo_em = v_timestamp,
        updated_at = v_timestamp
      WHERE id = p_pedido_id;

    WHEN 'pronto' THEN
      UPDATE pedidos SET
        status = p_novo_status,
        pronto_em = v_timestamp,
        updated_at = v_timestamp
      WHERE id = p_pedido_id;

    WHEN 'entrega' THEN
      UPDATE pedidos SET
        status = p_novo_status,
        entrega_em = v_timestamp,
        updated_at = v_timestamp
      WHERE id = p_pedido_id;

    WHEN 'concluido' THEN
      UPDATE pedidos SET
        status = p_novo_status,
        concluido_em = v_timestamp,
        updated_at = v_timestamp
      WHERE id = p_pedido_id;

    WHEN 'cancelado' THEN
      UPDATE pedidos SET
        status = p_novo_status,
        cancelado_em = v_timestamp,
        motivo_cancelamento = p_observacao,
        updated_at = v_timestamp
      WHERE id = p_pedido_id;

    WHEN 'pendente' THEN
      -- Ao voltar para pendente, apenas atualizar status
      -- NÃO limpar timestamps (mantém histórico)
      UPDATE pedidos SET
        status = p_novo_status,
        updated_at = v_timestamp
      WHERE id = p_pedido_id;

    ELSE
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Status inválido'
      );
  END CASE;

  -- Registrar no histórico
  INSERT INTO pedido_historico (
    pedido_id,
    status_anterior,
    status_novo,
    usuario_id,
    usuario_nome,
    observacao
  ) VALUES (
    p_pedido_id,
    v_status_anterior,
    p_novo_status,
    v_usuario_id,
    v_usuario_nome,
    p_observacao
  );

  RETURN jsonb_build_object(
    'success', true,
    'status_anterior', v_status_anterior,
    'status_novo', p_novo_status
  );
END;
$$;
```

---

## 🎯 3. Regras de Transição de Status

### Matriz de Transições Permitidas

```typescript
// app/features/admin/pedidos/utils/status-transitions.ts

export type StatusPedido =
	| "pendente"
	| "aceito"
	| "preparo"
	| "pronto"
	| "entrega"
	| "concluido"
	| "cancelado";

/**
 * Define quais transições de status são permitidas
 */
export const TRANSICOES_PERMITIDAS: Record<StatusPedido, StatusPedido[]> = {
	pendente: ["aceito", "cancelado"],
	aceito: ["pendente", "preparo", "cancelado"],
	preparo: ["aceito", "pronto", "cancelado"],
	pronto: ["preparo", "entrega", "cancelado"],
	entrega: ["pronto", "concluido", "cancelado"],
	concluido: [], // ❌ Não pode reverter pedido concluído
	cancelado: ["pendente", "aceito"], // ✅ Pode reativar
};

/**
 * Verifica se uma transição de status é permitida
 */
export const podeTransicionar = (statusAtual: StatusPedido, statusNovo: StatusPedido): boolean => {
	return TRANSICOES_PERMITIDAS[statusAtual]?.includes(statusNovo) ?? false;
};

/**
 * Retorna os status possíveis a partir do status atual
 */
export const getProximosStatus = (statusAtual: StatusPedido): StatusPedido[] => {
	return TRANSICOES_PERMITIDAS[statusAtual] || [];
};

/**
 * Verifica se uma transição requer observação obrigatória
 */
export const requerObservacao = (statusAtual: StatusPedido, statusNovo: StatusPedido): boolean => {
	// Reversões sempre requerem observação
	const reversoes: [StatusPedido, StatusPedido][] = [
		["cancelado", "pendente"],
		["cancelado", "aceito"],
		["aceito", "pendente"],
		["preparo", "aceito"],
		["pronto", "preparo"],
		["entrega", "pronto"],
	];

	return reversoes.some(([de, para]) => statusAtual === de && statusNovo === para);
};
```

---

## 🎨 4. Interface - Drawer de Detalhes

### Adicionar Seção de Histórico

```vue
<!-- app/features/admin/pedidos/components/PedidoDetalhesDrawer.vue -->

<script setup lang="ts">
import { usePedidoHistorico } from "~/features/admin/pedidos/composables/usePedidoHistorico";
import {
	getProximosStatus,
	podeTransicionar,
	requerObservacao,
} from "~/features/admin/pedidos/utils/status-transitions";

const props = defineProps<{
	pedido: PedidoCompleto | null;
}>();

// Buscar histórico do pedido
const { historico, loading: loadingHistorico } = usePedidoHistorico(
	computed(() => props.pedido?.id),
);

// Status possíveis a partir do status atual
const statusDisponiveis = computed(() => {
	if (!props.pedido) return [];
	return getProximosStatus(props.pedido.status);
});

// Modal de reverter status
const mostrarModalReverter = ref(false);
const statusParaReverter = ref<StatusPedido | null>(null);
const observacaoReversao = ref("");

const abrirModalReverter = (novoStatus: StatusPedido) => {
	statusParaReverter.value = novoStatus;
	observacaoReversao.value = "";
	mostrarModalReverter.value = true;
};

const confirmarReversao = async () => {
	if (!props.pedido || !statusParaReverter.value) return;

	// Validar observação obrigatória
	if (requerObservacao(props.pedido.status, statusParaReverter.value)) {
		if (!observacaoReversao.value.trim()) {
			// Mostrar erro
			return;
		}
	}

	await executarAcao(
		props.pedido,
		"mudar_status",
		statusParaReverter.value,
		observacaoReversao.value,
	);

	mostrarModalReverter.value = false;
};
</script>

<template>
	<UiDrawer v-model="modelValue" title="Detalhes do Pedido" size="md">
		<!-- Conteúdo existente... -->

		<!-- Seção de Histórico -->
		<div v-if="historico.length > 0" class="border-t pt-4 mt-4">
			<h4 class="font-medium mb-3 flex items-center gap-2">
				<Icon name="lucide:history" class="w-4 h-4" />
				Histórico de Status
			</h4>

			<div v-if="loadingHistorico" class="text-center py-4">
				<Icon name="lucide:loader-2" class="w-5 h-5 animate-spin mx-auto" />
			</div>

			<div v-else class="space-y-3">
				<div
					v-for="item in historico"
					:key="item.id"
					class="flex items-start gap-3 text-sm p-3 rounded-lg bg-[var(--surface-secondary)]"
				>
					<Icon
						:name="getStatusIcon(item.status_novo)"
						:class="getStatusColor(item.status_novo)"
						class="w-4 h-4 mt-0.5 flex-shrink-0"
					/>
					<div class="flex-1 min-w-0">
						<div class="flex items-center gap-2 flex-wrap">
							<span class="font-medium">{{ formatarStatus(item.status_novo) }}</span>
							<span class="text-[var(--text-muted)] text-xs">
								{{ formatarDataHora(item.created_at) }}
							</span>
						</div>
						<div class="text-[var(--text-muted)] text-xs mt-0.5">
							por {{ item.usuario_nome || "Sistema" }}
						</div>
						<div v-if="item.observacao" class="text-[var(--text-muted)] text-xs mt-1 italic">
							"{{ item.observacao }}"
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Ações Disponíveis -->
		<div v-if="statusDisponiveis.length > 0" class="border-t pt-4 mt-4">
			<h4 class="font-medium mb-3">Ações Disponíveis</h4>
			<div class="flex flex-wrap gap-2">
				<UiButton
					v-for="status in statusDisponiveis"
					:key="status"
					:color="getStatusButtonColor(status)"
					variant="outline"
					size="sm"
					@click="abrirModalReverter(status)"
				>
					<Icon :name="getStatusIcon(status)" class="w-4 h-4" />
					{{ formatarStatus(status) }}
				</UiButton>
			</div>
		</div>

		<!-- Modal de Confirmação de Reversão -->
		<UiModal v-model="mostrarModalReverter" title="Confirmar Mudança de Status" size="sm">
			<div class="space-y-4">
				<p class="text-sm text-[var(--text-muted)]">
					Você está prestes a mudar o status do pedido de
					<strong>{{ formatarStatus(pedido?.status) }}</strong> para
					<strong>{{ formatarStatus(statusParaReverter) }}</strong
					>.
				</p>

				<div>
					<label class="block text-sm font-medium mb-2">
						Observação
						<span
							v-if="requerObservacao(pedido?.status, statusParaReverter)"
							class="text-[var(--error)]"
						>
							*
						</span>
					</label>
					<UiTextarea
						v-model="observacaoReversao"
						placeholder="Descreva o motivo da mudança..."
						rows="3"
					/>
				</div>

				<div class="flex gap-2">
					<UiButton
						color="neutral"
						variant="ghost"
						class="flex-1"
						@click="mostrarModalReverter = false"
					>
						Cancelar
					</UiButton>
					<UiButton color="primary" variant="solid" class="flex-[2]" @click="confirmarReversao">
						Confirmar Mudança
					</UiButton>
				</div>
			</div>
		</UiModal>
	</UiDrawer>
</template>
```

---

## 📊 5. Composable para Histórico

```typescript
// app/features/admin/pedidos/composables/usePedidoHistorico.ts

import type { Ref } from "vue";

export interface PedidoHistoricoItem {
	id: string;
	created_at: string;
	pedido_id: string;
	status_anterior: StatusPedido | null;
	status_novo: StatusPedido;
	usuario_id: string | null;
	usuario_nome: string | null;
	observacao: string | null;
}

export const usePedidoHistorico = (pedidoId: Ref<string | undefined>) => {
	const supabase = useSupabaseClient();

	const historico = ref<PedidoHistoricoItem[]>([]);
	const loading = ref(false);
	const erro = ref<string | null>(null);

	const buscarHistorico = async () => {
		if (!pedidoId.value) {
			historico.value = [];
			return;
		}

		loading.value = true;
		erro.value = null;

		try {
			const { data, error } = await supabase
				.from("pedido_historico")
				.select("*")
				.eq("pedido_id", pedidoId.value)
				.order("created_at", { ascending: true });

			if (error) throw error;

			historico.value = data || [];
		} catch (err) {
			erro.value = "Erro ao buscar histórico";
			console.error(err);
		} finally {
			loading.value = false;
		}
	};

	// Buscar quando pedidoId mudar
	watch(pedidoId, buscarHistorico, { immediate: true });

	return {
		historico,
		loading,
		erro,
		buscarHistorico,
	};
};
```

---

## 🔄 6. Exemplo de Fluxo Completo

### Cenário: Cliente Cancela e Volta Atrás

```typescript
// 1. Cliente cancela pedido
await supabase.rpc("atualizar_status_pedido_v2", {
	p_pedido_id: "uuid-do-pedido",
	p_novo_status: "cancelado",
	p_observacao: "Cliente desistiu da compra",
});

// Banco após cancelamento:
// pedidos.status = 'cancelado'
// pedidos.cancelado_em = '2024-01-18 10:30:00'
// pedidos.motivo_cancelamento = 'Cliente desistiu da compra'
//
// pedido_historico:
// | created_at          | status_anterior | status_novo | usuario_nome | observacao                  |
// | 2024-01-18 10:00:00 | NULL            | pendente    | Sistema      | Pedido criado               |
// | 2024-01-18 10:30:00 | pendente        | cancelado   | João Silva   | Cliente desistiu da compra  |

// 2. Cliente liga arrependido (5 minutos depois)
await supabase.rpc("atualizar_status_pedido_v2", {
	p_pedido_id: "uuid-do-pedido",
	p_novo_status: "pendente",
	p_observacao: "Cliente voltou atrás, reativar pedido",
});

// Banco após reativação:
// pedidos.status = 'pendente'
// pedidos.cancelado_em = '2024-01-18 10:30:00' ✅ MANTÉM O HISTÓRICO!
// pedidos.motivo_cancelamento = 'Cliente desistiu da compra' ✅ MANTÉM!
//
// pedido_historico:
// | created_at          | status_anterior | status_novo | usuario_nome | observacao                        |
// | 2024-01-18 10:00:00 | NULL            | pendente    | Sistema      | Pedido criado                     |
// | 2024-01-18 10:30:00 | pendente        | cancelado   | João Silva   | Cliente desistiu da compra        |
// | 2024-01-18 10:35:00 | cancelado       | pendente    | João Silva   | Cliente voltou atrás, reativar    |

// 3. Estabelecimento aceita o pedido
await supabase.rpc("atualizar_status_pedido_v2", {
	p_pedido_id: "uuid-do-pedido",
	p_novo_status: "aceito",
	p_observacao: null,
});

// Histórico completo preservado! ✅
```

---

## 📈 7. Relatórios Possíveis

### Com a tabela de histórico, você pode:

```sql
-- 1. Taxa de cancelamento e reversão
SELECT
  COUNT(DISTINCT CASE WHEN status_novo = 'cancelado' THEN pedido_id END) as total_cancelamentos,
  COUNT(DISTINCT CASE
    WHEN status_anterior = 'cancelado' AND status_novo IN ('pendente', 'aceito')
    THEN pedido_id
  END) as total_reversoes,
  ROUND(
    COUNT(DISTINCT CASE WHEN status_anterior = 'cancelado' THEN pedido_id END)::numeric /
    NULLIF(COUNT(DISTINCT CASE WHEN status_novo = 'cancelado' THEN pedido_id END), 0) * 100,
    2
  ) as taxa_reversao_pct
FROM pedido_historico
WHERE created_at >= NOW() - INTERVAL '30 days';

-- 2. Tempo médio em cada status
SELECT
  status_novo,
  AVG(tempo_no_status) as tempo_medio_minutos
FROM (
  SELECT
    h1.pedido_id,
    h1.status_novo,
    EXTRACT(EPOCH FROM (h2.created_at - h1.created_at)) / 60 as tempo_no_status
  FROM pedido_historico h1
  LEFT JOIN pedido_historico h2 ON h2.pedido_id = h1.pedido_id
    AND h2.created_at > h1.created_at
  WHERE h1.created_at >= NOW() - INTERVAL '30 days'
) sub
GROUP BY status_novo;

-- 3. Performance por usuário
SELECT
  usuario_nome,
  COUNT(*) as total_acoes,
  COUNT(DISTINCT pedido_id) as pedidos_gerenciados,
  COUNT(CASE WHEN status_novo = 'cancelado' THEN 1 END) as cancelamentos,
  COUNT(CASE WHEN status_anterior = 'cancelado' THEN 1 END) as reversoes
FROM pedido_historico
WHERE created_at >= NOW() - INTERVAL '30 days'
  AND usuario_id IS NOT NULL
GROUP BY usuario_nome
ORDER BY total_acoes DESC;
```

---

## ✅ Resumo da Solução

### O que você ganha:

1. ✅ **Pode reverter cancelamentos** sem perder histórico
2. ✅ **Auditoria completa** de quem mudou cada status
3. ✅ **Performance mantida** com campos separados
4. ✅ **Relatórios avançados** de taxa de reversão, tempo por status, etc
5. ✅ **Flexibilidade** para adicionar novas transições no futuro

### Estrutura final:

- **Tabela `pedidos`**: campos `aceito_em`, `preparo_em`, etc → queries rápidas
- **Tabela `pedido_historico`**: registro completo de mudanças → auditoria
- **RPC `atualizar_status_pedido_v2`**: atualiza ambas as tabelas automaticamente
- **Validação client-side**: matriz de transições permitidas

### Próximos passos:

1. Criar tabela `pedido_historico` no banco
2. Criar RPC `atualizar_status_pedido_v2`
3. Atualizar composable `usePedidoAcoes` para usar novo RPC
4. Criar composable `usePedidoHistorico`
5. Criar utils `status-transitions.ts`
6. Atualizar `PedidoDetalhesDrawer` com seção de histórico e ações

**Quer que eu implemente essa solução agora?**
