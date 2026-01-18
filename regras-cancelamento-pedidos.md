# 🚫 Regras de Cancelamento de Pedidos

## 📊 Análise: Até Quando o Cliente Pode Cancelar?

### Benchmarking do Mercado

| Plataforma    | Limite de Cancelamento                                  | Justificativa                                   |
| ------------- | ------------------------------------------------------- | ----------------------------------------------- |
| **iFood**     | Até "Aceito" (antes de iniciar preparo)                 | Após aceito, estabelecimento já começou a fazer |
| **Rappi**     | Até "Aceito" (antes de iniciar preparo)                 | Mesma lógica do iFood                           |
| **Uber Eats** | Até "Aceito" (com janela de 5 minutos após confirmação) | Dá tempo pro cliente desistir                   |
| **99Food**    | Até "Aceito"                                            | Padrão do mercado                               |

### Fluxo de Status

```
pendente → aceito → preparo → pronto → entrega → concluido
   ✅        ✅        ❌        ❌        ❌         ❌
 PODE     PODE      NÃO      NÃO      NÃO       NÃO
CANCELAR CANCELAR  PODE     PODE     PODE      PODE
```

---

## ✅ RECOMENDAÇÃO: Cliente Pode Cancelar Até "ACEITO"

### Regra Principal

**Cliente pode cancelar:**

- ✅ Status `pendente` (pedido ainda não foi visto)
- ✅ Status `aceito` (estabelecimento confirmou, mas não começou a fazer)

**Cliente NÃO pode cancelar:**

- ❌ Status `preparo` (comida já está sendo feita)
- ❌ Status `pronto` (comida já está pronta)
- ❌ Status `entrega` (entregador já saiu)
- ❌ Status `concluido` (pedido já foi entregue)

### Justificativas

#### ✅ Por que permitir até "Aceito"?

1. **Estabelecimento ainda não teve custo**
   - Não comprou ingredientes específicos
   - Não começou a preparar
   - Não alocou recursos

2. **Cliente pode ter mudado de ideia rapidamente**
   - Pediu por engano
   - Escolheu produto errado
   - Desistiu da compra

3. **Padrão do mercado**
   - Todas as grandes plataformas permitem
   - Cliente já espera esse comportamento

#### ❌ Por que NÃO permitir após "Preparo"?

1. **Estabelecimento já teve custo**
   - Ingredientes já foram usados
   - Tempo da equipe foi gasto
   - Comida pode não ser reaproveitável

2. **Prejuízo financeiro**
   - Estabelecimento perde dinheiro
   - Comida pode ir pro lixo
   - Equipe trabalhou de graça

3. **Má fé do cliente**
   - Cliente pode cancelar após comida pronta
   - Estabelecimento fica no prejuízo

---

## ⏱️ Janela de Tempo Adicional (Opcional)

### Opção 1: Janela de 5 Minutos (Recomendado)

**Regra:**

- Cliente pode cancelar até 5 minutos após o pedido ser aceito
- Após 5 minutos, mesmo em "aceito", não pode mais cancelar

**Vantagens:**

- Dá tempo pro cliente desistir
- Protege estabelecimento de cancelamentos tardios
- Estabelecimento pode começar a preparar após 5 min com segurança

**Implementação:**

```typescript
const podeCancelar = (pedido: Pedido): boolean => {
	// Não pode cancelar se já passou de "aceito"
	if (!["pendente", "aceito"].includes(pedido.status)) {
		return false;
	}

	// Se está em "aceito", verificar janela de 5 minutos
	if (pedido.status === "aceito" && pedido.aceito_em) {
		const minutosDesdeAceito = differenceInMinutes(new Date(), new Date(pedido.aceito_em));
		return minutosDesdeAceito <= 5;
	}

	// Se está em "pendente", sempre pode cancelar
	return true;
};
```

### Opção 2: Sem Janela de Tempo (Mais Simples)

**Regra:**

- Cliente pode cancelar enquanto status for "pendente" ou "aceito"
- Sem limite de tempo

**Vantagens:**

- Mais simples de implementar
- Mais fácil de explicar pro cliente
- Estabelecimento controla mudando status rapidamente

**Implementação:**

```typescript
const podeCancelar = (pedido: Pedido): boolean => {
	return ["pendente", "aceito"].includes(pedido.status);
};
```

---

## 🎯 RECOMENDAÇÃO FINAL

### **Opção 2: Sem Janela de Tempo** ✅

**Por quê:**

1. **Simplicidade**
   - Fácil de entender: "Pode cancelar até aceito"
   - Sem confusão com contadores de tempo
   - Menos código pra manter

2. **Controle do Estabelecimento**
   - Se não quer que cancele, muda pra "preparo" rapidamente
   - Estabelecimento tem controle total
   - Não precisa de timers/cron jobs

3. **Experiência do Cliente**
   - Regra clara e objetiva
   - Não tem surpresa de "tempo esgotado"
   - Confia no estabelecimento

4. **Padrão do Mercado**
   - Maioria das plataformas não usa janela de tempo
   - Cliente já está acostumado

---

## 📱 Interface para o Cliente

### 1. Página de Acompanhamento do Pedido

```vue
<template>
	<div class="pedido-status">
		<!-- Status atual -->
		<div class="status-badge">
			{{ formatarStatus(pedido.status) }}
		</div>

		<!-- Botão de cancelar (condicional) -->
		<UiButton
			v-if="podeCancelar(pedido)"
			color="error"
			variant="outline"
			@click="mostrarModalCancelar = true"
		>
			<Icon name="lucide:x-circle" class="w-4 h-4" />
			Cancelar Pedido
		</UiButton>

		<!-- Aviso quando NÃO pode mais cancelar -->
		<div
			v-else-if="pedido.status !== 'concluido' && pedido.status !== 'cancelado'"
			class="aviso-nao-pode-cancelar"
		>
			<Icon name="lucide:info" class="w-4 h-4" />
			<span>
				Seu pedido já está sendo preparado e não pode mais ser cancelado. Em caso de dúvidas, entre
				em contato pelo WhatsApp.
			</span>
		</div>
	</div>
</template>
```

### 2. Modal de Confirmação de Cancelamento

```vue
<template>
	<UiModal v-model="mostrarModalCancelar" title="Cancelar Pedido" size="sm">
		<div class="space-y-4">
			<!-- Aviso -->
			<div class="bg-[var(--warning-surface)] p-4 rounded-lg">
				<div class="flex gap-3">
					<Icon name="lucide:alert-triangle" class="w-5 h-5 text-[var(--warning)] flex-shrink-0" />
					<div class="text-sm">
						<p class="font-medium text-[var(--warning)] mb-1">Tem certeza que deseja cancelar?</p>
						<p class="text-[var(--text-muted)]">
							Esta ação não pode ser desfeita. Você precisará fazer um novo pedido.
						</p>
					</div>
				</div>
			</div>

			<!-- Motivo (opcional) -->
			<div>
				<label class="block text-sm font-medium mb-2"> Motivo do cancelamento (opcional) </label>
				<UiSelect v-model="motivoCancelamento">
					<option value="">Selecione um motivo</option>
					<option value="mudei_ideia">Mudei de ideia</option>
					<option value="pedido_errado">Fiz o pedido errado</option>
					<option value="demora">Está demorando muito</option>
					<option value="preco">Preço muito alto</option>
					<option value="outro">Outro motivo</option>
				</UiSelect>
			</div>

			<!-- Botões -->
			<div class="flex gap-2">
				<UiButton
					color="neutral"
					variant="ghost"
					class="flex-1"
					@click="mostrarModalCancelar = false"
				>
					Voltar
				</UiButton>
				<UiButton
					color="error"
					variant="solid"
					class="flex-[2]"
					:loading="cancelando"
					@click="confirmarCancelamento"
				>
					Sim, Cancelar Pedido
				</UiButton>
			</div>
		</div>
	</UiModal>
</template>
```

### 3. Avisos Visuais por Status

```typescript
const getAvisoCancelamento = (status: StatusPedido): string | null => {
	switch (status) {
		case "pendente":
			return "Você pode cancelar seu pedido a qualquer momento até ele ser aceito.";

		case "aceito":
			return "Você ainda pode cancelar seu pedido. Após iniciar o preparo, não será mais possível.";

		case "preparo":
			return "Seu pedido já está sendo preparado e não pode mais ser cancelado.";

		case "pronto":
			return "Seu pedido está pronto e não pode mais ser cancelado.";

		case "entrega":
			return "Seu pedido está a caminho e não pode mais ser cancelado.";

		case "concluido":
			return null; // Não mostrar aviso

		case "cancelado":
			return null; // Não mostrar aviso

		default:
			return null;
	}
};
```

---

## 🏪 Interface para o Estabelecimento

### Quando Cliente Cancela

**Notificação:**

```
🔔 Pedido #123 foi cancelado pelo cliente
Motivo: Mudei de ideia
Status anterior: Aceito
Valor: R$ 45,90
```

**Ações do Estabelecimento:**

- ✅ Ver histórico completo
- ✅ Reativar pedido (se cliente ligar arrependido)
- ✅ Bloquear cliente (se houver abuso)

---

## 📊 Regras de Negócio Completas

### Matriz de Permissões

| Ator                | Pendente | Aceito  | Preparo | Pronto  | Entrega | Concluído |
| ------------------- | -------- | ------- | ------- | ------- | ------- | --------- |
| **Cliente**         | ✅ Pode  | ✅ Pode | ❌ Não  | ❌ Não  | ❌ Não  | ❌ Não    |
| **Estabelecimento** | ✅ Pode  | ✅ Pode | ✅ Pode | ✅ Pode | ✅ Pode | ❌ Não    |

### Regras Especiais

1. **Cliente cancela em "Pendente"**
   - Sem custo
   - Sem penalidade
   - Sem necessidade de justificativa

2. **Cliente cancela em "Aceito"**
   - Sem custo
   - Sem penalidade
   - Motivo opcional (para analytics)

3. **Cliente tenta cancelar em "Preparo" ou posterior**
   - ❌ Bloqueado no sistema
   - Mostrar mensagem: "Entre em contato pelo WhatsApp"
   - Estabelecimento decide se aceita (manualmente)

4. **Estabelecimento cancela (qualquer status)**
   - ✅ Sempre permitido (até "Entrega")
   - Motivo obrigatório
   - Cliente é notificado

5. **Pedido "Concluído"**
   - ❌ Ninguém pode cancelar
   - Se houver problema, criar novo pedido ou reembolso manual

---

## 🔒 Validações no Backend

### RPC para Cliente Cancelar

```sql
CREATE OR REPLACE FUNCTION cancelar_pedido_cliente(
  p_pedido_id UUID,
  p_motivo TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_status status_pedido;
  v_numero INTEGER;
BEGIN
  -- Buscar status atual
  SELECT status, numero
  INTO v_status, v_numero
  FROM pedidos
  WHERE id = p_pedido_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Pedido não encontrado'
    );
  END IF;

  -- Validar se pode cancelar
  IF v_status NOT IN ('pendente', 'aceito') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Não é possível cancelar este pedido. Ele já está sendo preparado.',
      'status_atual', v_status
    );
  END IF;

  -- Cancelar pedido
  UPDATE pedidos
  SET
    status = 'cancelado',
    cancelado_em = now(),
    motivo_cancelamento = COALESCE(p_motivo, 'Cancelado pelo cliente'),
    updated_at = now()
  WHERE id = p_pedido_id;

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
    v_status,
    'cancelado',
    NULL, -- Cliente não tem usuario_id
    'Cliente',
    COALESCE(p_motivo, 'Cancelado pelo cliente')
  );

  RETURN jsonb_build_object(
    'success', true,
    'numero', v_numero,
    'status_anterior', v_status
  );
END;
$$;
```

---

## 📱 Textos para o Cliente (UX Writing)

### Botão de Cancelar

**Quando pode cancelar:**

```
[Cancelar Pedido]
```

**Quando NÃO pode cancelar:**

```
❌ Não é possível cancelar
Seu pedido já está sendo preparado
```

### Modal de Confirmação

**Título:**

```
Cancelar Pedido #123?
```

**Descrição:**

```
Tem certeza que deseja cancelar este pedido?
Esta ação não pode ser desfeita.
```

**Botões:**

```
[Voltar]  [Sim, Cancelar Pedido]
```

### Mensagens de Feedback

**Sucesso:**

```
✅ Pedido cancelado com sucesso
Você pode fazer um novo pedido a qualquer momento.
```

**Erro (já em preparo):**

```
❌ Não foi possível cancelar
Seu pedido já está sendo preparado.
Entre em contato pelo WhatsApp: (XX) XXXXX-XXXX
```

### Avisos Preventivos

**Em "Pendente":**

```
ℹ️ Você pode cancelar seu pedido até ele ser aceito pelo estabelecimento.
```

**Em "Aceito":**

```
⚠️ Última chance de cancelar!
Após iniciar o preparo, não será mais possível cancelar.
```

**Em "Preparo":**

```
🍳 Seu pedido está sendo preparado
Não é mais possível cancelar. Em caso de dúvidas, entre em contato.
```

---

## 📊 Analytics e Métricas

### Dados para Coletar

1. **Taxa de cancelamento por status**

   ```sql
   SELECT
     status_anterior,
     COUNT(*) as total_cancelamentos,
     ROUND(COUNT(*)::numeric / (SELECT COUNT(*) FROM pedidos) * 100, 2) as taxa_pct
   FROM pedido_historico
   WHERE status_novo = 'cancelado'
     AND usuario_nome = 'Cliente'
   GROUP BY status_anterior;
   ```

2. **Motivos de cancelamento**

   ```sql
   SELECT
     motivo_cancelamento,
     COUNT(*) as total
   FROM pedidos
   WHERE status = 'cancelado'
     AND motivo_cancelamento IS NOT NULL
   GROUP BY motivo_cancelamento
   ORDER BY total DESC;
   ```

3. **Tempo médio até cancelamento**
   ```sql
   SELECT
     AVG(EXTRACT(EPOCH FROM (cancelado_em - created_at)) / 60) as minutos_ate_cancelar
   FROM pedidos
   WHERE status = 'cancelado';
   ```

---

## ✅ Resumo das Regras

### Para o Cliente:

1. ✅ **Pode cancelar:** Até status "Aceito"
2. ❌ **Não pode cancelar:** A partir de "Preparo"
3. 📱 **Como cancelar:** Botão na página de acompanhamento
4. 💬 **Motivo:** Opcional (ajuda o estabelecimento a melhorar)
5. 📞 **Após preparo:** Entrar em contato pelo WhatsApp

### Para o Estabelecimento:

1. ✅ **Pode cancelar:** Até status "Entrega"
2. ❌ **Não pode cancelar:** Após "Concluído"
3. 📝 **Motivo:** Obrigatório
4. 🔄 **Pode reativar:** Pedidos cancelados (se cliente ligar)
5. 🔔 **Notificação:** Quando cliente cancela

### Implementação:

1. **Frontend:** Validação client-side + avisos visuais
2. **Backend:** RPC `cancelar_pedido_cliente()` com validação
3. **Histórico:** Registrar todas as tentativas
4. **UX:** Mensagens claras em cada status

**Está de acordo com essas regras? Posso implementar agora?**
