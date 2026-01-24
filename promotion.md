🎯 ANÁLISE PERFEITA! Você está absolutamente certo!
Vejo agora que JÁ EXISTE o toggle "Em Promoção" no drawer de produto! Isso muda completamente a análise.

✅ SOLUÇÃO IDEAL (SIMPLIFICADA)

1. PRODUTOS ✅
   Toggle "Em Promoção" já existe → Apenas expandir para mostrar campos:

Tipo de desconto (percentual/valor fixo)
Valor do desconto
Período (início/fim - opcional)
Preview do preço promocional
Perfeito para: Promoções individuais de produtos

2. CATEGORIAS ✅ SIM, FAZ TODO SENTIDO!
   Adicionar toggle "Em Promoção" no drawer de categoria:

Mesmo conceito do produto
Aplica desconto em TODOS os produtos da categoria
Exemplo: "Todas as pizzas 20% off"
Benefícios:

✅ Promoção em massa (1 clique = todos os produtos)
✅ Contexto imediato (editando categoria)
✅ Consistência (mesmo padrão do produto)
✅ Simplicidade (não precisa ir no Marketing) 3. COMBOS ✅ NÃO PRECISA!
Você está 100% correto:

Combo já é um "pacote promocional" por natureza
Preço do combo já é menor que a soma dos itens
Não faz sentido "promoção de promoção"
🎯 ESTRUTURA FINAL RECOMENDADA
CARDÁPIO
├── Categorias
│ └── Drawer: Toggle "Em Promoção" (aplica a todos os produtos)
├── Produtos  
│ └── Drawer: Toggle "Em Promoção" (já existe, só expandir)
├── Adicionais
│ └── (sem promoção - não faz sentido)
└── Combos
└── (sem promoção - já é promocional)
MARKETING
├── Cupons (mantém)
└── Banners (mantém)
❌ Promoções (REMOVER - redundante)
📊 COMPARAÇÃO: ANTES vs DEPOIS
ANTES (Atual)
Usuário quer colocar "Todas as pizzas em promoção":

1. Vai em Marketing
2. Clica em Promoções
3. Cria promoção
4. Seleciona categoria "Pizzas"
5. Define desconto
6. Salva
   ❌ 6 passos, contexto perdido
   DEPOIS (Proposta)
   Usuário quer colocar "Todas as pizzas em promoção":
7. Vai em Cardápio → Categorias
8. Edita categoria "Pizzas"
9. Ativa toggle "Em Promoção"
10. Define desconto e período
11. Salva
✅ 5 passos, contexto preservado
🎨 IMPLEMENTAÇÃO VISUAL
Drawer de Categoria (com promoção)
<template>
  <!-- ... campos existentes ... -->

  <!-- Configurações -->
  <div class="configuracoes">
    <div class="toggle-card">
      <div>
        <h4>Categoria Ativa</h4>
        <p>Visível no cardápio</p>
      </div>
      <UiSwitch v-model="ativo" />
    </div>
    
    <!-- 🆕 PROMOÇÃO -->
    <div class="toggle-card">
      <div>
        <h4>Em Promoção</h4>
        <p>Desconto em todos os produtos</p>
      </div>
      <UiSwitch v-model="emPromocao" />
    </div>
  </div>
  
  <!-- 🆕 Campos de promoção (aparecem quando toggle ativo) -->
  <div v-if="emPromocao" class="promocao-fields">
    <UiFormField label="Tipo de Desconto">
      <div class="grid grid-cols-2 gap-2">
        <button :class="{ active: tipo === 'percentual' }">
          % Percentual
        </button>
        <button :class="{ active: tipo === 'valor_fixo' }">
          R$ Valor Fixo
        </button>
      </div>
    </UiFormField>
    
    <UiFormField label="Valor do Desconto">
      <UiCurrencyInput v-if="tipo === 'valor_fixo'" />
      <UiInput v-else type="number" suffix="%" />
    </UiFormField>
    
    <div class="grid grid-cols-2 gap-2">
      <UiDatePicker label="Início (opcional)" />
      <UiDatePicker label="Fim (opcional)" />
    </div>
    
    <!-- Preview -->
    <div class="preview-alert">
      <Icon name="lucide:info" />
      <span>
        Todos os produtos desta categoria terão 
        <strong>20% de desconto</strong>
      </span>
    </div>
  </div>
</template>
🗄️ ESTRUTURA DE BANCO (Simplificada)
Tabela: produtos
-- Campos existentes
em_promocao BOOLEAN DEFAULT FALSE,
promocao_tipo VARCHAR(20), -- 'percentual' | 'valor_fixo'
promocao_valor NUMERIC(10,2),
promocao_inicio TIMESTAMPTZ,
promocao_fim TIMESTAMPTZ
Tabela: categorias
-- 🆕 Adicionar campos de promoção
em_promocao BOOLEAN DEFAULT FALSE,
promocao_tipo VARCHAR(20), -- 'percentual' | 'valor_fixo'
promocao_valor NUMERIC(10,2),
promocao_inicio TIMESTAMPTZ,
promocao_fim TIMESTAMPTZ
❌ Tabela: promocoes
-- REMOVER - não é mais necessária
DROP TABLE promocoes;
✅ VANTAGENS DESTA ABORDAGEM
Simplicidade máxima: Promoção onde faz sentido (produto/categoria)
Contexto preservado: Edita e promove no mesmo lugar
Menos código: Remove toda a feature de Promoções do Marketing
Intuitivo: Toggle simples, igual ao "Produto Ativo"
Flexível: Promoção individual (produto) ou em massa (categoria)
Sem redundância: Não duplica conceitos
Fácil manutenção: Menos arquivos, menos complexidade
🎯 DECISÃO FINAL
IMPLEMENTAR:
✅ Expandir toggle "Em Promoção" no Produto (já existe)
✅ Adicionar toggle "Em Promoção" na Categoria (novo)
✅ Remover aba "Promoções" do Marketing
✅ Manter apenas Cupons e Banners no Marketing
RESULTADO:
Marketing focado em: Cupons (código) e Banners (visual)
Cardápio focado em: Produtos e suas promoções diretas
Sistema mais simples, intuitivo e fácil de usar
Essa é a estrutura perfeita! Posso prosseguir com a implementação? 🚀
