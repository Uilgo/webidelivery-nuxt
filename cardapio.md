📋 Planejamento: Cardápio Público (/{slug})
Visão Geral
Página pública acessível via /{slug} onde clientes visualizam o cardápio do estabelecimento e fazem pedidos.

🏗️ Estrutura de Componentes
app/features/public/cardapio/
├── components/
│ ├── CardapioHeader.vue # Logo, nome, status (Aberto/Fechado)
│ ├── CardapioBanners.vue # Carrossel de banners promocionais
│ ├── CardapioCategorias.vue # Menu horizontal com scroll (categorias)
│ ├── CardapioBusca.vue # Campo de busca + filtros
│ ├── CardapioProdutos.vue # Grid de produtos
│ ├── CardapioProdutoCard.vue # Card individual do produto
│ ├── CardapioCombos.vue # Seção de combos em destaque
│ ├── CardapioComboCard.vue # Card individual do combo
│ ├── ProdutoModal.vue # Modal: variação + adicionais + observação
│ ├── ComboModal.vue # Modal: detalhes do combo
│ ├── CarrinhoFlutuante.vue # Botão flutuante com contador
│ ├── CarrinhoDrawer.vue # Drawer lateral com itens do carrinho
│ └── CheckoutModal.vue # Modal de finalização do pedido
├── composables/
│ ├── useCardapioPublico.ts # Fetch de dados do estabelecimento
│ ├── useCarrinho.ts # Gerenciamento do carrinho (localStorage)
│ ├── useHorarioFuncionamento.ts # Verificar se está aberto/fechado
│ └── usePedido.ts # Criar pedido no banco
├── stores/
│ └── carrinhoStore.ts # Estado global do carrinho (Pinia)
└── types/
└── cardapio-publico.ts # Tipos específicos da página pública
📱 Layout da Página
┌─────────────────────────────────────┐
│ [Logo] Nome do Estabelecimento │
│ 🟢 Aberto agora │
├─────────────────────────────────────┤
│ ┌─────┐ ┌─────┐ ┌─────┐ │ ← Carrossel Banners
│ │ │ │ │ │ │ │
│ └─────┘ └─────┘ └─────┘ │
├─────────────────────────────────────┤
│ [🔍 Buscar produtos...] │ ← Campo de busca
├─────────────────────────────────────┤
│ Pizzas | Lanches | Bebidas | ... │ ← Categorias (scroll horizontal)
├─────────────────────────────────────┤
│ ┌─────┐ ┌─────┐ ┌─────┐ │
│ │Prod1│ │Prod2│ │Prod3│ │ ← Grid de produtos
│ │R$25 │ │R$30 │ │R$15 │ │
│ └─────┘ └─────┘ └─────┘ │
│ ┌─────┐ ┌─────┐ │
│ │Prod4│ │Prod5│ │
│ └─────┘ └─────┘ │
├─────────────────────────────────────┤
│ ┌───────────────┐│
│ │ 🛒 3 | R$75 ││ ← Carrinho flutuante
│ └───────────────┘│
└─────────────────────────────────────┘
🔄 Fluxo do Usuário
Acessa /{slug} → Carrega dados do estabelecimento
Visualiza cardápio → Categorias, produtos, combos
Clica em produto → Abre modal com variações + adicionais
Adiciona ao carrinho → Atualiza contador flutuante
Abre carrinho → Drawer lateral com itens
Finaliza pedido → Modal de checkout (dados + pagamento)
Confirma → Pedido criado no banco + redirecionamento
🗃️ Dados Necessários (RLS público)
Tabela Campos Públicos
estabelecimentos nome, slug, logo_url, status, horarios
categorias nome, descricao, imagem_url, ordem (ativo=true)
produtos nome, descricao, imagem_url, destaque (ativo=true)
produto_variacoes nome, preco, preco_promocional
grupos_adicionais nome, min_selecao, max_selecao
adicionais nome, preco
combos nome, descricao, preco_combo, preco_original
banners imagem_url, link, tipo (ativo=true)
📦 Fases de Implementação
Fase 1 - Estrutura Base

Criar rota dinâmica pages/[slug].vue
Composable useCardapioPublico (fetch estabelecimento + cardápio)
RLS para acesso público aos dados
Layout básico com header + categorias
Fase 2 - Listagem de Produtos

Grid de produtos por categoria
Card de produto com imagem, nome, preço
Filtro por categoria (scroll horizontal)
Campo de busca
Fase 3 - Modal de Produto

Seleção de variação (tamanho)
Seleção de adicionais (grupos)
Campo de observação
Botão "Adicionar ao carrinho"
Fase 4 - Carrinho

Store do carrinho (Pinia + localStorage)
Botão flutuante com contador
Drawer lateral com itens
Editar quantidade / remover item
Fase 5 - Checkout

Modal de finalização
Dados do cliente (nome, telefone, endereço)
Seleção de pagamento
Tipo de entrega (delivery/retirada)
Criar pedido no banco
Fase 6 - Extras

Carrossel de banners
Seção de combos em destaque
Verificação de horário (aberto/fechado)
Bloqueio de checkout se fechado
🎨 Considerações de UX
Mobile-first - 90% dos acessos serão mobile
Performance - Lazy loading de imagens
Offline - Carrinho persiste no localStorage
Feedback - Toast ao adicionar item
Acessibilidade - Navegação por teclado, contraste
O que acha? Quer começar pela Fase 1 (estrutura base + fetch de dados)?
