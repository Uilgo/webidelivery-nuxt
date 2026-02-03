📋 PLANEJAMENTO: Sistema Dinâmico de Divisão de Sabores
🎯 Objetivo
Permitir que o admin configure se um produto pode ser dividido em múltiplos sabores e quantas divisões são permitidas (2, 3 ou 4 sabores).

📊 1. ALTERAÇÕES NO BANCO DE DADOS
Tabela: produtos

Adicionar novos campos:

ALTER TABLE produtos ADD COLUMN permite_divisao_sabores BOOLEAN DEFAULT false;
ALTER TABLE produtos ADD COLUMN max_sabores_divisao INTEGER DEFAULT 2 CHECK (max_sabores_divisao IN (2, 3, 4));
Campos:

permite_divisao_sabores (boolean) - Se o produto permite divisão
max_sabores_divisao (integer) - Quantidade máxima de sabores (2, 3 ou 4)
📝 2. ALTERAÇÕES NOS SCHEMAS
Arquivo:
produto.ts

Adicionar nos schemas createProdutoSchema e updateProdutoSchema:

permite_divisao_sabores: z.boolean().default(false),
max_sabores_divisao: z.number().int().min(2).max(4).default(2),
Com validação:

.refine((data) => {
// Se permite divisão, max_sabores deve estar entre 2-4
if (data.permite_divisao_sabores) {
return data.max_sabores_divisao >= 2 && data.max_sabores_divisao <= 4;
}
return true;
}, {
message: "Quantidade de sabores deve ser 2, 3 ou 4",
path: ["max_sabores_divisao"],
})
🎨 3. ALTERAÇÕES NO FORMULÁRIO DE PRODUTO (Admin)
Arquivo:
ProdutoForm.vue

Adicionar nova seção após "Promoção":

<!-- Divisão de Sabores -->
<div class="space-y-4">
  <div class="flex items-center justify-between">
    <div>
      <h4>Permite dividir sabores?</h4>
      <p class="text-sm text-muted">Ideal para pizzas e produtos similares</p>
    </div>
    <UiSwitch v-model="form.permite_divisao_sabores" />
  </div>
  
  <!-- Quantidade de sabores (só aparece se ativado) -->
  <div v-if="form.permite_divisao_sabores">
    <label>Quantos sabores podem ser divididos?</label>
    <div class="flex gap-2">
      <button @click="form.max_sabores_divisao = 2">2 sabores</button>
      <button @click="form.max_sabores_divisao = 3">3 sabores</button>
      <button @click="form.max_sabores_divisao = 4">4 sabores</button>
    </div>
  </div>
</div>
🔄 4. ALTERAÇÕES NOS TYPES
Arquivo: 
cardapio.ts

Adicionar na interface Produto:

readonly permite_divisao_sabores: boolean;
readonly max_sabores_divisao: number; // 2, 3 ou 4
Arquivo:
cardapio-publico.ts

Adicionar na interface ProdutoPublico:

permite_divisao_sabores: boolean;
max_sabores_divisao: number;
🎭 5. ALTERAÇÕES NO CARDÁPIO PÚBLICO
Arquivo:
CardapioProdutoDrawer.vue

Mudanças:

Remover hardcoded:
// ❌ ANTES
const quantidadeSabores = ref<2 | 3 | 4>(2);

// ✅ DEPOIS
const quantidadeSabores = ref<number>(2);
Computed para opções dinâmicas:
const opcoesSabores = computed(() => {
if (!props.produto?.permite_divisao_sabores) return [];

const max = props.produto.max_sabores_divisao;
const opcoes = [];

for (let i = 2; i <= max; i++) {
opcoes.push({
value: i,
label: `${i} sabores`
});
}

return opcoes;
});
Mostrar seção apenas se permitido:

<!-- ❌ ANTES: Sempre mostra -->
<div class="p-4">
  <h3>Quer dividir seu sabor?</h3>
  ...
</div>

<!-- ✅ DEPOIS: Condicional -->
<div v-if="produto?.permite_divisao_sabores" class="p-4">
  <h3>Quer dividir seu sabor?</h3>
  ...
</div>
Botões dinâmicos:
<button
  v-for="opcao in opcoesSabores"
  :key="opcao.value"
  @click="quantidadeSabores = opcao.value"
>
  {{ opcao.label }}
</button>
Mesmo para: CardapioProdutoBottomSheet.vue

🔌 6. ALTERAÇÕES NO PLUGIN DE CACHE
Arquivo:
cardapio-publico-cache.server.ts

Adicionar campos no SELECT:

.select(`  id, nome, descricao, imagem_url, destaque, em_promocao, categoria_id,
  permite_divisao_sabores, max_sabores_divisao,  // ✅ ADICIONAR
  produto_variacoes (id, nome, preco, preco_promocional)`)
E no mapeamento:

return (data ?? []).map((produto) => ({
// ... campos existentes
permite_divisao_sabores: produto.permite_divisao_sabores,
max_sabores_divisao: produto.max_sabores_divisao,
}));
✅ 7. VALIDAÇÕES E REGRAS DE NEGÓCIO
Se permite_divisao_sabores = false:

Não mostrar seção de divisão no drawer/bottomsheet
Não permitir seleção de múltiplos sabores
Se permite_divisao_sabores = true:

Mostrar toggle "Quer dividir seu sabor?"
Mostrar botões de 2 até max_sabores_divisao
Validar que quantidade de sabores selecionados ≤ max_sabores_divisao
Valores padrão:

permite_divisao_sabores: false
max_sabores_divisao: 2
📦 8. MIGRAÇÃO DE DADOS EXISTENTES
-- Produtos existentes ficam sem divisão por padrão
UPDATE produtos
SET permite_divisao_sabores = false,
max_sabores_divisao = 2
WHERE permite_divisao_sabores IS NULL;
🎯 9. ORDEM DE IMPLEMENTAÇÃO
✅ Criar migration no banco
✅ Atualizar types e schemas
✅ Atualizar formulário de produto (admin)
✅ Atualizar plugin de cache
✅ Atualizar drawer/bottomsheet (público)
⏳ Testar fluxo completo (aguardando teste manual)
✅ Migrar dados existentes (migration já inclui UPDATE)

✨ **STATUS: IMPLEMENTAÇÃO CONCLUÍDA!**

Todas as alterações foram implementadas com sucesso:

- ✅ Migration aplicada no banco de dados via MCP Supabase
- ✅ Schemas atualizados com validação
- ✅ Types atualizados (Produto e ProdutoPublico)
- ✅ Formulário de produto com seção de divisão de sabores
- ✅ Plugin de cache incluindo novos campos
- ✅ Drawer e BottomSheet com lógica dinâmica

**Próximo passo:** Testar o fluxo completo no ambiente de desenvolvimento!
Resumo: Sistema totalmente dinâmico onde o admin controla se o produto permite divisão e quantos sabores (2, 3 ou 4). No cardápio público, a seção só aparece se configurado, e as opções são geradas dinamicamente baseadas na configuração do produto! 🎉
