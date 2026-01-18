# Análise Completa: Estrutura de Pedidos no Banco de Dados

## 📊 Estrutura Atual

### Tabela `pedidos`

**Campos de Timestamp Separados:**

- `aceito_em` (timestamptz, nullable)
- `preparo_em` (timestamptz, nullable)
- `pronto_em` (timestamptz, nullable)
- `entrega_em` (timestamptz, nullable)
- `concluido_em` (timestamptz, nullable)
- `cancelado_em` (timestamptz, nullable)

**Campo de Status:**

- `status` (enum): pendente, aceito, preparo, pronto, entrega, concluido, cancelado

**Outros Campos Importantes:**

- `numero` (integer) - sequencial por estabelecimento
- `created_at`, `updated_at` (timestamptz)
- Campos de cliente (nome, telefone, email)
- Campos de endereço separados (rua, numero, complemento, bairro, cidade, estado, cep, referencia)
- Campos financeiros (subtotal, taxa_entrega, desconto, total)
- `motivo_cancelamento` (text, nullable)

**Índices:**

- PK: `id`
- UNIQUE: `(estabelecimento_id, numero)`
- INDEX: `estabelecimento_id`
- INDEX: `status`
- INDEX: `created_at DESC`
- INDEX: `(estabelecimento_id, numero)`

---

## ✅ Análise: Campos Separados vs JSONB

### Abordagem Atual (Campos Separados) - **RECOMENDADA** ✅

**Vantagens:**

1. **Queries Simples e Performáticas**
   - Filtrar por data específica: `WHERE aceito_em > '2024-01-01'`
   - Calcular tempo médio: `AVG(concluido_em - aceito_em)`
   - Índices diretos em cada campo

2. **Tipagem Forte**
   - PostgreSQL valida automaticamente os tipos
   - Não precisa de validação manual
   - Erros detectados no banco, não no app

3. **Índices Eficientes**
   - Pode criar índice em qualquer timestamp
   - Queries de range são otimizadas
   - Suporte nativo a BRIN indexes para séries temporais

4. **Relatórios e Analytics**
   - Fácil calcular SLA (tempo entre status)
   - Agregações diretas: `AVG()`, `MIN()`, `MAX()`
   - Compatível com ferramentas de BI

5. **Manutenção e Debug**
   - Estrutura clara e previsível
   - Fácil de entender para novos devs
   - Logs e auditoria simples

**Desvantagens:**

- Mais colunas na tabela (6 campos de timestamp)
- Não guarda histórico de múltiplas mudanças no mesmo status

---

### Abordagem JSONB (Histórico Completo)

**Estrutura Proposta:**

```sql
status_historico JSONB DEFAULT '[]'::jsonb

-- Exemplo de conteúdo:
[
  {
    "status": "pendente",
    "timestamp": "2024-01-18T10:00:00Z",
    "usuario_id": null,
    "observacao": "Pedido criado"
  },
  {
    "status": "aceito",
    "timestamp": "2024-01-18T10:05:00Z",
    "usuario_id": "uuid-do-gerente",
    "observacao": "Aceito por João"
  },
  {
    "status": "preparo",
    "timestamp": "2024-01-18T10:10:00Z",
    "usuario_id": "uuid-do-staff",
    "observacao": null
  }
]
```

**Vantagens:**

1. **Histórico Completo**
   - Guarda TODAS as mudanças de status
   - Pode voltar status e ter registro
   - Auditoria completa (quem mudou, quando, por quê)

2. **Flexibilidade**
   - Adicionar novos campos sem alterar schema
   - Metadata customizada por status
   - Suporta workflows complexos

3. **Menos Colunas**
   - Apenas 1 campo JSONB ao invés de 6 timestamps
   - Tabela mais "limpa" visualmente

**Desvantagens:**

1. **Queries Complexas**

   ```sql
   -- Buscar último timestamp de "aceito"
   SELECT (
     SELECT timestamp
     FROM jsonb_array_elements(status_historico)
     WHERE value->>'status' = 'aceito'
     ORDER BY timestamp DESC
     LIMIT 1
   ) as aceito_em
   FROM pedidos;
   ```

2. **Performance**
   - Queries em JSONB são mais lentas
   - Índices GIN são menos eficientes que B-tree
   - Agregações requerem funções complexas

3. **Validação Manual**
   - Precisa validar estrutura no app
   - Sem garantia de integridade no banco
   - Risco de dados inconsistentes

4. **Complexidade**
   - Curva de aprendizado maior
   - Mais difícil de debugar
   - Ferramentas de BI podem não suportar

---

## ⚠️ PROBLEMA IDENTIFICADO: Reverter Cancelamento

### Cenário Real:

1. Cliente cancela pedido → status = `cancelado`, `cancelado_em` = timestamp
2. Cliente liga arrependido → quer reativar o pedido
3. Estabelecimento precisa voltar status para `pendente` ou `aceito`

### ❌ Problema com Estrutura Atual:

```sql
-- Ao reverter cancelamento:
UPDATE pedidos
SET status = 'pendente',
    cancelado_em = NULL,  -- ❌ PERDE O HISTÓRICO!
    motivo_cancelamento = NULL
WHERE id = 'xxx';
```

**Você PERDE:**

- Quando foi cancelado originalmente
- Por que foi cancelado
- Quantas vezes foi cancelado
- Tempo que ficou cancelado

### Outras Transições Possíveis:

- `aceito` → `pendente` (erro ao aceitar)
- `preparo` → `aceito` (faltou ingrediente)
- `pronto` → `preparo` (erro na montagem)
- `entrega` → `pronto` (entregador não disponível)

---

## 🎯 Recomendação Final ATUALIZADA

### **ADICIONAR TABELA DE HISTÓRICO** ✅✅✅

**Motivos:**

1. **Precisa reverter status**
   - Cancelamento pode ser desfeito
   - Outras transições podem ser revertidas
   - Histórico completo é essencial

2. **Auditoria e Compliance**
   - Saber quantas vezes mudou status
   - Rastrear quem fez cada mudança
   - Identificar padrões (ex: muitos cancelamentos)

3. **Relatórios Avançados**
   - Tempo médio em cada status
   - Taxa de cancelamento e reversão
   - Performance da equipe

4. **Manter Performance**
   - Campos atuais continuam para queries rápidas
   - Histórico em tabela separada para auditoria
   - Melhor dos dois mundos

---

## 🔧 Melhorias Sugeridas (Opcionais)

### 1. Adicionar Tabela de Histórico (Se Precisar de Auditoria Completa)

```sql
CREATE TABLE pedido_historico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  status_anterior status_pedido,
  status_novo status_pedido NOT NULL,
  usuario_id UUID REFERENCES auth.users(id),
  observacao TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_pedido_historico_pedido ON pedido_historico(pedido_id);
CREATE INDEX idx_pedido_historico_created_at ON pedido_historico(created_at DESC);
```

**Quando usar:**

- Se precisar saber QUEM mudou cada status
- Se precisar de auditoria completa para compliance
- Se precisar rastrear mudanças indevidas

**Quando NÃO usar:**

- Se só precisa saber QUANDO mudou (campos atuais já resolvem)
- Se não tem requisito de auditoria
- Se quer manter o sistema simples

---

### 2. Adicionar Campos de Usuário (Se Precisar Rastrear Quem Mudou)

```sql
ALTER TABLE pedidos
ADD COLUMN aceito_por UUID REFERENCES auth.users(id),
ADD COLUMN preparo_por UUID REFERENCES auth.users(id),
ADD COLUMN pronto_por UUID REFERENCES auth.users(id),
ADD COLUMN entrega_por UUID REFERENCES auth.users(id),
ADD COLUMN concluido_por UUID REFERENCES auth.users(id),
ADD COLUMN cancelado_por UUID REFERENCES auth.users(id);
```

**Quando usar:**

- Se precisar saber qual membro da equipe fez cada ação
- Se tiver múltiplos usuários gerenciando pedidos
- Se precisar de relatórios por funcionário

---

### 3. Adicionar Índices Compostos (Se Tiver Queries Específicas)

```sql
-- Para queries que filtram por estabelecimento + status + data
CREATE INDEX idx_pedidos_estabelecimento_status_created
ON pedidos(estabelecimento_id, status, created_at DESC);

-- Para queries que buscam pedidos aceitos recentemente
CREATE INDEX idx_pedidos_aceito_em
ON pedidos(aceito_em DESC)
WHERE aceito_em IS NOT NULL;
```

---

## 📋 Estrutura das Tabelas Relacionadas

### Tabela `pedido_itens` ✅

**Estrutura Atual:**

- Campos desnormalizados: `produto_nome`, `variacao_nome`
- Campos: `quantidade`, `preco_unitario`, `subtotal`
- Relacionamentos: `pedido_id`, `produto_id`, `variacao_id`

**Análise:** ✅ **PERFEITA**

- Desnormalização é correta (snapshot do pedido)
- Se produto mudar nome/preço, pedido antigo não é afetado
- Permite deletar produtos sem perder histórico

---

### Tabela `pedido_itens_adicionais` ✅

**Estrutura Atual:**

- Campo desnormalizado: `adicional_nome`
- Campos: `quantidade`, `preco_unitario`, `subtotal`
- Relacionamentos: `pedido_item_id`, `adicional_id`

**Análise:** ✅ **PERFEITA**

- Mesma lógica de desnormalização
- Snapshot correto dos adicionais
- Histórico preservado

---

## 🎨 Estrutura de Endereço

**Atual:** Campos separados ✅

```
endereco_rua
endereco_numero
endereco_complemento
endereco_bairro
endereco_cidade
endereco_estado
endereco_cep
endereco_referencia
```

**Análise:** ✅ **CORRETO**

**Por que não usar JSONB:**

1. Queries de busca por cidade/bairro são comuns
2. Validação de CEP precisa ser no banco
3. Relatórios por região precisam de índices
4. Integração com APIs de frete precisa de campos separados

**Quando usar JSONB para endereço:**

- Se endereço for apenas para exibição
- Se nunca filtrar/buscar por campos de endereço
- Se tiver estruturas muito variadas (internacional)

---

## 📊 Resumo de Campos Financeiros

**Estrutura Atual:** ✅

```
subtotal (numeric) - soma dos itens
taxa_entrega (numeric) - custo do frete
desconto (numeric) - descontos aplicados
total (numeric) - valor final
troco_para (numeric, nullable) - apenas para dinheiro
```

**Análise:** ✅ **PERFEITA**

- Campos separados facilitam relatórios
- Cálculos de comissão, impostos, etc são simples
- Auditoria financeira é clara

---

## 🚀 Conclusão

### ✅ MANTER ESTRUTURA ATUAL

**Não precisa mudar nada!** A estrutura está:

- ✅ Otimizada para performance
- ✅ Simples de manter
- ✅ Fácil de entender
- ✅ Pronta para relatórios
- ✅ Com índices corretos

**Só considere mudanças se:**

- ❌ Precisar de auditoria completa (quem mudou cada status)
- ❌ Precisar de histórico de múltiplas mudanças no mesmo status
- ❌ Tiver workflows complexos com voltar status

**Para 99% dos casos de delivery, a estrutura atual é IDEAL.**

---

## 📈 Próximos Passos (Se Necessário)

1. **Fase 1 (Atual):** Manter estrutura atual ✅
2. **Fase 2 (Se precisar):** Adicionar tabela `pedido_historico` para auditoria
3. **Fase 3 (Se precisar):** Adicionar campos `*_por` para rastrear usuários

**Recomendação:** Implemente apenas quando tiver necessidade real, não por antecipação.
