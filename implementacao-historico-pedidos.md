# 🔄 IMPLEMENTAÇÃO COMPLETA: Histórico e Cancelamento de Pedidos

## 📋 VISÃO GERAL

### Problema

- Cliente pode cancelar pedido e voltar atrás
- Estabelecimento precisa reverter status (ex: preparo → aceito)
- Estrutura atual perde histórico ao reverter

### Solução

**Estrutura Híbrida:**

- ✅ MANTER campos `aceito_em`, `preparo_em`, etc (performance)
- ✅ ADICIONAR tabela `pedido_historico` (auditoria completa)

### Benefícios

1. Reverter cancelamentos sem perder dados
2. Auditoria completa (quem, quando, por quê)
3. Performance mantida
4. Relatórios avançados

---

## 🎯 REGRAS DE NEGÓCIO

### Cliente Pode Cancelar

- ✅ Status `pendente` - sempre pode
- ✅ Status `aceito` - última chance
- ❌ Status `preparo` em diante - NÃO pode (mostrar mensagem para contatar WhatsApp)

### Estabelecimento Pode Cancelar

- ✅ Até status `entrega` - sempre pode (motivo obrigatório)
- ❌ Status `concluido` - NÃO pode

### Transições Permitidas (Estabelecimento)

- `pendente` → aceito, cancelado
- `aceito` → pendente, preparo, cancelado
- `preparo` → aceito, pronto, cancelado
- `pronto` → preparo, entrega, cancelado
- `entrega` → pronto, concluido, cancelado
- `concluido` → (nenhum)
- `cancelado` → pendente, aceito (reativar)

### Reversões que Requerem Observação Obrigatória

- cancelado → pendente/aceito
- aceito → pendente
- preparo → aceito
- pronto → preparo
- entrega → pronto

---

## 🗄️ BANCO DE DADOS

### 1. Criar Tabela `pedido_historico`

**Campos:**

- id (UUID, PK)
- created_at (timestamptz)
- pedido_id (UUID, FK → pedidos)
- status_anterior (status_pedido, nullable)
- status_novo (status_pedido)
- usuario_id (UUID, FK → auth.users, nullable)
- usuario_nome (text, desnormalizado)
- observacao (text, nullable)
- metadata (jsonb)

**Índices:**

- idx_pedido_historico_pedido (pedido_id, created_at DESC)
- idx_pedido_historico_created_at (created_at DESC)
- idx_pedido_historico_usuario (usuario_id) WHERE usuario_id IS NOT NULL
- idx_pedido_historico_status (status_anterior, status_novo)

**RLS:**

- Policy SELECT: usuários veem histórico do seu estabelecimento
- Policy INSERT: usuários inserem histórico do seu estabelecimento
- Policy SELECT: histórico público é visível (para cliente ver seu pedido)

### 2. Criar RPCs

**RPC: `atualizar_status_pedido_v2`**

- Parâmetros: p_pedido_id, p_novo_status, p_observacao (opcional)
- Valida permissão (admin, gerente, staff)
- Atualiza campos de timestamp na tabela pedidos
- Registra mudança no histórico
- Retorna: success, status_anterior, status_novo, error

**RPC: `cancelar_pedido_cliente`**

- Parâmetros: p_pedido_id, p_motivo (opcional)
- Valida se status permite cancelamento (pendente ou aceito)
- Cancela pedido
- Registra no histórico com usuario_nome = 'Cliente'
- Retorna: success, numero, status_anterior, estabelecimento_id, error

**RPC: `verificar_pode_cancelar`**

- Parâmetros: p_pedido_id
- Retorna: success, pode_cancelar (boolean), status_atual

---

## 📦 TIPOS TYPESCRIPT

### Adicionar em `app/features/admin/pedidos/types/pedidos-admin.ts`

**Interface: `PedidoHistoricoItem`**

- Todos os campos da tabela pedido_historico

**Type: `MotivoCancelamentoCliente`**

- mudei_ideia, pedido_errado, demora, preco, outro

**Const: `MOTIVOS_CANCELAMENTO_LABELS`**

- Mapeamento de motivos para labels em português

**Interface: `CancelarPedidoResponse`**

- success, error, numero, status_anterior, estabelecimento_id, pode_cancelar, status_atual

---

## 🛠️ UTILS

### Criar `app/features/admin/pedidos/utils/status-transitions.ts`

**Const: `TRANSICOES_PERMITIDAS`**

- Record<StatusPedido, StatusPedido[]> com matriz de transições

**Função: `podeTransicionar`**

- Verifica se transição é permitida

**Função: `getProximosStatus`**

- Retorna array de status possíveis a partir do atual

**Função: `requerObservacao`**

- Verifica se transição requer observação obrigatória

**Função: `clientePodeCancelar`**

- Verifica se cliente pode cancelar (pendente ou aceito)

**Função: `getAvisoCancelamento`**

- Retorna mensagem de aviso por status para o cliente

**Função: `getStatusButtonColor`**

- Retorna cor do botão de status para UI

---

## 🎣 COMPOSABLES

### 1. Criar `app/features/admin/pedidos/composables/usePedidoHistorico.ts`

- Recebe: pedidoId (Ref)
- Estado: historico, loading, erro
- Função: buscarHistorico() - busca da tabela pedido_historico
- Watch: busca automaticamente quando pedidoId muda

### 2. Atualizar `app/features/admin/pedidos/composables/usePedidoAcoes.ts`

- Substituir todas as chamadas para usar `atualizar_status_pedido_v2`
- Função: atualizarStatus(pedidoId, novoStatus, observacao?)
- Manter funções: aceitarPedido, iniciarPreparo, marcarPronto, sairParaEntrega, concluirPedido, cancelarPedido

### 3. Criar `app/features/public/pedido/composables/useCancelarPedido.ts`

- Estado: cancelando
- Função: verificarPodeCancelar(pedidoId) - chama RPC verificar_pode_cancelar
- Função: cancelar(pedidoId, motivo?) - chama RPC cancelar_pedido_cliente
- Retorna: CancelarPedidoResponse

---

## 🎨 COMPONENTES - PAINEL ADMIN

### Atualizar `app/features/admin/pedidos/components/PedidoDetalhesDrawer.vue`

**Adicionar Seção: Histórico de Status**

- Usar composable usePedidoHistorico
- Mostrar lista de mudanças com: ícone, status, data/hora, usuário, observação
- Loading state enquanto busca
- Estilo: cards com bg-[var(--surface-secondary)]

**Adicionar Seção: Ações Disponíveis**

- Usar getProximosStatus para listar status possíveis
- Botões para cada status disponível
- Ao clicar: abre modal de confirmação

**Adicionar Modal: Confirmar Mudança de Status**

- Título: "Confirmar Mudança de Status"
- Mostrar: status atual → status novo
- Campo: Observação (obrigatória se requerObservacao retornar true)
- Botões: Cancelar (ghost) e Confirmar (solid)
- Ao confirmar: chama atualizarStatus do usePedidoAcoes

**Atualizar Modal de Cancelamento Existente**

- Manter estrutura atual
- Garantir que chama atualizarStatus com observação

---

## 📱 COMPONENTES - PÁGINA PÚBLICA

### Atualizar `app/features/public/pedido/pages/PedidoConfirmacaoPage.vue`

**Adicionar Seção: Botão de Cancelar**

- Usar composable useCancelarPedido
- Mostrar botão apenas se clientePodeCancelar(status) retornar true
- Botão: "Cancelar Pedido" (color="error", variant="outline")

**Adicionar: Aviso quando NÃO pode cancelar**

- Mostrar se status >= preparo
- Mensagem: "Seu pedido já está sendo preparado e não pode mais ser cancelado. Entre em contato pelo WhatsApp."
- Ícone: lucide:info

**Adicionar: Aviso preventivo por status**

- Usar getAvisoCancelamento(status)
- Mostrar em card com ícone apropriado

**Adicionar Modal: Confirmar Cancelamento**

- Título: "Cancelar Pedido"
- Aviso: card amarelo com ícone de alerta
- Texto: "Tem certeza? Esta ação não pode ser desfeita."
- Select: Motivo do cancelamento (opcional) - usar MOTIVOS_CANCELAMENTO_LABELS
- Botões: Voltar (ghost) e Sim, Cancelar Pedido (solid, error)
- Ao confirmar: chama cancelar() do composable
- Loading state no botão

**Adicionar: Seção de Histórico (opcional)**

- Mostrar histórico simplificado para o cliente
- Apenas mudanças principais (sem detalhes de usuário)

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

### Fase 1: Banco de Dados

- [ ] Criar tabela `pedido_historico`
- [ ] Criar índices
- [ ] Habilitar RLS com policies
- [ ] Criar RPC `atualizar_status_pedido_v2`
- [ ] Criar RPC `cancelar_pedido_cliente`
- [ ] Criar RPC `verificar_pode_cancelar`
- [ ] Testar RPCs no SQL Editor

### Fase 2: Tipos e Utils

- [ ] Adicionar tipos em `pedidos-admin.ts`
- [ ] Criar `status-transitions.ts`
- [ ] Testar funções utils

### Fase 3: Composables

- [ ] Criar `usePedidoHistorico.ts`
- [ ] Atualizar `usePedidoAcoes.ts`
- [ ] Criar `useCancelarPedido.ts`
- [ ] Testar composables

### Fase 4: Painel Admin

- [ ] Atualizar `PedidoDetalhesDrawer.vue`
- [ ] Adicionar seção de histórico
- [ ] Adicionar seção de ações disponíveis
- [ ] Adicionar modal de mudança de status
- [ ] Testar fluxo completo de mudança de status
- [ ] Testar reversão de cancelamento

### Fase 5: Página Pública

- [ ] Atualizar `PedidoConfirmacaoPage.vue`
- [ ] Adicionar botão de cancelar
- [ ] Adicionar avisos por status
- [ ] Adicionar modal de confirmação
- [ ] Testar cancelamento pelo cliente
- [ ] Testar validação de status

### Fase 6: Testes Finais

- [ ] Testar fluxo: cliente cancela → estabelecimento reativa
- [ ] Testar fluxo: estabelecimento cancela → cliente vê histórico
- [ ] Testar todas as transições de status
- [ ] Testar observação obrigatória
- [ ] Testar permissões (admin, gerente, staff)
- [ ] Testar RLS (cada estabelecimento vê apenas seus dados)

---

## 🧪 CENÁRIOS DE TESTE

### Teste 1: Cliente Cancela e Volta Atrás

1. Cliente faz pedido → status = pendente
2. Estabelecimento aceita → status = aceito
3. Cliente cancela → status = cancelado, histórico registrado
4. Cliente liga arrependido
5. Estabelecimento reativa → status = pendente, histórico mantém cancelamento
6. Verificar: cancelado_em ainda tem valor, histórico completo

### Teste 2: Cliente Tenta Cancelar em Preparo

1. Pedido em status = preparo
2. Cliente tenta cancelar
3. Sistema bloqueia com mensagem
4. Botão de cancelar não aparece
5. Aviso mostra: "Entre em contato pelo WhatsApp"

### Teste 3: Estabelecimento Reverte Status

1. Pedido em preparo
2. Faltou ingrediente
3. Estabelecimento volta para aceito (com observação)
4. Histórico registra: preparo → aceito com motivo
5. Verificar: preparo_em mantém timestamp original

### Teste 4: Observação Obrigatória

1. Tentar reverter cancelado → pendente sem observação
2. Sistema deve bloquear
3. Adicionar observação
4. Sistema permite

### Teste 5: Permissões

1. Staff tenta cancelar pedido → deve funcionar
2. Entregador tenta mudar status → deve bloquear (não tem permissão)
3. Admin de outro estabelecimento tenta ver histórico → deve bloquear (RLS)

---

## 📊 RELATÓRIOS POSSÍVEIS (FUTURO)

Com a tabela de histórico, será possível criar:

- Taxa de cancelamento por status
- Taxa de reversão de cancelamentos
- Tempo médio em cada status
- Performance por usuário (quem mais cancela, quem mais aceita)
- Motivos mais comuns de cancelamento
- Horários com mais cancelamentos

---

## 🎯 RESUMO

**O que será criado:**

- 1 tabela no banco
- 3 RPCs
- 3 tipos/interfaces TypeScript
- 1 arquivo de utils
- 3 composables (1 novo, 1 atualizado, 1 novo)
- 2 componentes atualizados (drawer admin + página pública)

**Tempo estimado:** 4-6 horas

**Prioridade:** Alta (funcionalidade crítica para operação)

**Dependências:** Nenhuma (tudo já existe, apenas adicionar)
