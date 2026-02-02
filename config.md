Analize:

📊 ANÁLISE COMPLETA
✅ DadosEmpresaTab (JÁ IMPLEMENTADO CORRETAMENTE)
✅ Armazena valoresIniciais para comparação
✅ Compara campo por campo no onSubmit
✅ Envia apenas campos modificados para o backend
✅ Exibe toast "Nenhuma alteração" se nada mudou
❌ FALTA: Botão desabilitado quando não há alterações
⚠️ FreteEntregaTab (PARCIALMENTE IMPLEMENTADO)
✅ Tem hasUnsavedChanges para detectar mudanças
✅ Watch detecta alterações nos campos
❌ PROBLEMA: Envia TODOS os campos, não apenas os modificados
❌ FALTA: Botão desabilitado quando não há alterações
⚠️ HorariosTab (NÃO IMPLEMENTADO)
❌ Não tem comparação de valores iniciais
❌ Envia todos os horários sempre
❌ Botão sempre habilitado
⚠️ PagamentosTab (NÃO IMPLEMENTADO)
❌ Não tem comparação de valores iniciais
❌ Envia todos os campos sempre
❌ Botão sempre habilitado
🎯 RESPOSTA ÀS SUAS PERGUNTAS

1. Dá pra fazer uma única vez e refletir para todos?
   NÃO. Cada tab tem:

Estrutura de dados diferente
Composables diferentes
Lógica de salvamento diferente
Precisa implementar um por um, mas podemos criar um padrão reutilizável:

Computed hasChanges que compara valores
Computed isButtonDisabled = !hasChanges || saving 2. Está salvando apenas o dado alterado?
FRONT:

✅ DadosEmpresaTab: SIM - compara e envia apenas modificados
❌ FreteEntregaTab: NÃO - envia tudo
❌ HorariosTab: NÃO - envia tudo
❌ PagamentosTab: NÃO - envia tudo
BACK (RPC):

Preciso verificar as funções RPC para confirmar se elas fazem UPDATE apenas dos campos enviados ou se sobrescrevem tudo
📋 O QUE PRECISA SER FEITO
Para cada tab:
✅ Armazenar valoresIniciais no watch de carregamento
✅ Criar computed hasChanges comparando values com valoresIniciais
✅ Adicionar :disabled="!hasChanges || saving" no botão
✅ No onSubmit, comparar e enviar apenas campos modificados
✅ Verificar/ajustar funções RPC para aceitar Partial<T>

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

# � PLANEJAMENTO - Otimização de Salvamento nas Tabs de Configurações

## 🎯 OBJETIVO

Implementar salvamento inteligente em todas as tabs de configurações:

- Botão desabilitado quando não há alterações
- Enviar apenas campos modificados para o backend
- Validar funções RPC para aceitar `Partial<T>`

---

## 📊 STATUS ATUAL

### ✅ **DadosEmpresaTab** (JÁ IMPLEMENTADO CORRETAMENTE)

- ✅ Armazena `valoresIniciais` para comparação
- ✅ Compara campo por campo no `onSubmit`
- ✅ Envia apenas campos modificados para o backend
- ✅ Exibe toast "Nenhuma alteração" se nada mudou
- ❌ **FALTA**: Botão desabilitado quando não há alterações

### ⚠️ **FreteEntregaTab** (PARCIALMENTE IMPLEMENTADO)

- ✅ Tem `hasUnsavedChanges` para detectar mudanças
- ✅ Watch detecta alterações nos campos
- ❌ **PROBLEMA**: Envia TODOS os campos, não apenas os modificados
- ❌ **FALTA**: Botão desabilitado quando não há alterações

### ⚠️ **HorariosTab** (NÃO IMPLEMENTADO)

- ❌ Não tem comparação de valores iniciais
- ❌ Envia todos os horários sempre
- ❌ Botão sempre habilitado

### ⚠️ **PagamentosTab** (NÃO IMPLEMENTADO)

- ❌ Não tem comparação de valores iniciais
- ❌ Envia todos os campos sempre
- ❌ Botão sempre habilitado

### ℹ️ **PersonalizarTab, SegurancaTab, LogsTab**

- Status a verificar

---

## � IMPLEMENTAÇÃO POR TAB

### 1️⃣ **DadosEmpresaTab** (Finalizar)

**Arquivo**: `app/features/admin/configuracoes/components/tabs/DadosEmpresaTab.vue`

**Tarefas**:

- [x] ✅ Armazenar `valoresIniciais`
- [x] ✅ Comparar e enviar apenas modificados
- [ ] ❌ Adicionar computed `hasChanges`
- [ ] ❌ Desabilitar botão quando `!hasChanges || saving`

**Código a adicionar**:

```typescript
// Computed para detectar mudanças
const hasChanges = computed(() => {
	if (!valoresIniciais.value) return false;

	return (
		values.nome !== valoresIniciais.value.nome ||
		values.slug !== valoresIniciais.value.slug ||
		values.descricao !== valoresIniciais.value.descricao ||
		values.logo_url !== valoresIniciais.value.logo_url ||
		values.logo_url_dark !== valoresIniciais.value.logo_url_dark ||
		values.whatsapp !== valoresIniciais.value.whatsapp
	);
});
```

**Template**:

```vue
<UiButton
  type="submit"
  :loading="saving"
  :disabled="!hasChanges || saving"
>
```

---

### 2️⃣ **FreteEntregaTab** (Refatorar)

**Arquivo**: `app/features/admin/configuracoes/components/tabs/FreteEntregaTab.vue`

**Tarefas**:

- [ ] Armazenar `valoresIniciais` no watch de carregamento
- [ ] Refatorar `salvarManual` para comparar e enviar apenas modificados
- [ ] Usar `hasUnsavedChanges` existente ou criar `hasChanges`
- [ ] Desabilitar botão quando `!hasChanges || saving`

**Estrutura de dados**:

```typescript
interface ValoresIniciaisFreteEntrega {
	tipo_taxa_entrega: TipoTaxaEntrega;
	taxa_entrega: number;
	cidades_atendidas: string[];
	tempo_entrega_min: number;
	tempo_entrega_max: number;
	valor_minimo_pedido: number;
	taxas_por_localizacao: TaxaLocalizacao[];
	taxa_padrao_outros_bairros?: number;
}
```

**Lógica de comparação**:

- Comparar campos primitivos diretamente
- Comparar arrays com `JSON.stringify()` ou comparação profunda
- Enviar apenas campos que mudaram

---

### 3️⃣ **HorariosTab** (Implementar do zero)

**Arquivo**: `app/features/admin/configuracoes/components/tabs/HorariosTab.vue`

**Tarefas**:

- [ ] Armazenar `valoresIniciais` (horários + exceções)
- [ ] Criar computed `hasChanges` comparando horários
- [ ] Refatorar salvamento para enviar apenas horários modificados
- [ ] Desabilitar botão quando `!hasChanges || saving`

**Desafio**: Comparar arrays de objetos complexos (`HorarioFuncionamento[]`)

**Solução**:

```typescript
const hasChanges = computed(() => {
	if (!valoresIniciais.value) return false;
	return JSON.stringify(horarios.value) !== JSON.stringify(valoresIniciais.value);
});
```

---

### 4️⃣ **PagamentosTab** (Implementar do zero)

**Arquivo**: `app/features/admin/configuracoes/components/tabs/PagamentosTab.vue`

**Tarefas**:

- [ ] Armazenar `valoresIniciais` no watch de carregamento
- [ ] Criar computed `hasChanges`
- [ ] Refatorar `onSubmit` para enviar apenas modificados
- [ ] Desabilitar botão quando `!hasChanges || saving`

**Estrutura de dados**:

```typescript
interface ValoresIniciaisPagamentos {
	aceita_dinheiro: boolean;
	aceita_pix: boolean;
	tipo_chave_pix?: string;
	chave_pix?: string;
	aceita_cartao_credito: boolean;
	aceita_cartao_debito: boolean;
}
```

---

### 5️⃣ **PersonalizarTab** (Verificar e implementar)

**Arquivo**: `app/features/admin/configuracoes/components/tabs/PersonalizarTab.vue`

**Tarefas**:

- [ ] Verificar estrutura atual
- [ ] Implementar padrão de salvamento inteligente
- [ ] Desabilitar botão quando não há alterações

---

### 6️⃣ **SegurancaTab** (Verificar e implementar)

**Arquivo**: `app/features/admin/configuracoes/components/tabs/SegurancaTab.vue`

**Tarefas**:

- [ ] Verificar estrutura atual
- [ ] Implementar padrão de salvamento inteligente
- [ ] Desabilitar botão quando não há alterações

---

### 7️⃣ **LogsTab** (Apenas leitura - não precisa)

**Arquivo**: `app/features/admin/configuracoes/components/tabs/LogsTab.vue`

**Status**: Provavelmente apenas visualização, sem salvamento

---

## 🗄️ BACKEND - FUNÇÕES RPC

### Verificar e ajustar funções RPC:

#### 1. `fn_rpc_admin_atualizar_estabelecimento`

**Arquivo**: Supabase Functions

**Verificar**:

- [ ] Aceita `Partial<DadosEmpresa>`?
- [ ] Faz UPDATE apenas dos campos enviados?
- [ ] Não sobrescreve campos não enviados com NULL?

**Ajuste necessário** (se não estiver correto):

```sql
CREATE OR REPLACE FUNCTION fn_rpc_admin_atualizar_estabelecimento(
  p_dados JSONB
)
RETURNS void AS $$
BEGIN
  -- UPDATE apenas campos presentes no JSONB
  UPDATE estabelecimentos
  SET
    nome = COALESCE(p_dados->>'nome', nome),
    slug = COALESCE(p_dados->>'slug', slug),
    descricao = COALESCE(p_dados->>'descricao', descricao),
    -- ... outros campos
    updated_at = NOW()
  WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### 2. `fn_rpc_admin_atualizar_frete_entrega`

**Verificar**:

- [ ] Aceita `Partial<ConfigFreteEntrega>`?
- [ ] Atualiza apenas campos modificados no JSONB `config_geral`?

#### 3. `fn_rpc_admin_atualizar_horarios`

**Verificar**:

- [ ] Aceita array parcial de horários?
- [ ] Atualiza apenas horários modificados?

#### 4. `fn_rpc_admin_atualizar_pagamentos`

**Verificar**:

- [ ] Aceita `Partial<ConfigPagamento>`?
- [ ] Atualiza apenas campos modificados no JSONB `config_pagamento`?

---

## 📐 PADRÃO REUTILIZÁVEL

### Composable Helper (Opcional)

Criar `useFormChanges.ts` para reutilizar lógica:

```typescript
/**
 * Composable para detectar mudanças em formulários
 */
export const useFormChanges = <T extends Record<string, any>>(
	currentValues: Ref<T>,
	initialValues: Ref<T | null>,
) => {
	const hasChanges = computed(() => {
		if (!initialValues.value) return false;

		return Object.keys(currentValues.value).some(
			(key) => currentValues.value[key] !== initialValues.value![key],
		);
	});

	const getChangedFields = (): Partial<T> => {
		if (!initialValues.value) return {};

		const changed: Partial<T> = {};

		Object.keys(currentValues.value).forEach((key) => {
			if (currentValues.value[key] !== initialValues.value![key]) {
				changed[key as keyof T] = currentValues.value[key];
			}
		});

		return changed;
	};

	return {
		hasChanges,
		getChangedFields,
	};
};
```

**Uso**:

```typescript
const { hasChanges, getChangedFields } = useFormChanges(values, valoresIniciais);

const onSubmit = async () => {
	const camposModificados = getChangedFields();
	if (Object.keys(camposModificados).length === 0) {
		// Nenhuma alteração
		return;
	}
	await salvar(camposModificados);
};
```

---

## 🎯 ORDEM DE EXECUÇÃO RECOMENDADA

### Fase 1 - Finalizar DadosEmpresaTab (5 min)

1. ✅ Adicionar computed `hasChanges`
2. ✅ Desabilitar botão

### Fase 2 - PagamentosTab (15 min)

1. ✅ Implementar padrão completo (mais simples)
2. ✅ Testar salvamento

### Fase 3 - FreteEntregaTab (20 min)

1. ✅ Refatorar para enviar apenas modificados
2. ✅ Ajustar lógica de comparação (arrays)

### Fase 4 - HorariosTab (25 min)

1. ✅ Implementar do zero (mais complexo)
2. ✅ Comparação de arrays de objetos

### Fase 5 - Verificar outras tabs (10 min)

1. ✅ PersonalizarTab
2. ✅ SegurancaTab

### Fase 6 - Backend RPC (30 min)

1. ✅ Verificar todas as funções RPC
2. ✅ Ajustar para aceitar `Partial<T>`
3. ✅ Testar UPDATE seletivo

### Fase 7 - Testes finais (15 min)

1. ✅ Testar cada tab individualmente
2. ✅ Verificar no banco se apenas campos modificados foram atualizados
3. ✅ Testar botão desabilitado/habilitado

---

## ⏱️ TEMPO ESTIMADO TOTAL

- **Frontend**: ~1h30min
- **Backend**: ~30min
- **Testes**: ~15min
- **TOTAL**: ~2h15min

---

## 🚀 PRONTO PARA COMEÇAR?

Aguardando confirmação para iniciar a implementação! 🎯
