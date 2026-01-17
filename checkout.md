Perfeito! Entendi tudo. Vou criar a estrutura completa do checkout. Resumindo:

✅ SEM autenticação - cliente guest ✅ Dados salvos em localStorage - reutilizar em próximos pedidos ✅ SEM pagamento online - tudo na entrega/retirada ⚠️ PIX: Aviso obrigatório sobre enviar comprovante 🚧 Taxa de entrega: Placeholder (implementar depois no painel) 🚧 Tempo estimado: Placeholder (implementar depois no painel) ❌ SEM notificações por enquanto

📁 Estrutura que vou criar:
app/features/public/checkout/
├── pages/
│ └── CheckoutPage.vue # Página principal
├── components/
│ ├── CheckoutStepper.vue # Progress bar (1/4, 2/4...)
│ ├── CheckoutDadosCliente.vue # Etapa 1: Dados
│ ├── CheckoutTipoEntrega.vue # Etapa 2: Delivery/Retirada
│ ├── CheckoutFormaPagamento.vue # Etapa 3: Pagamento
│ └── CheckoutResumo.vue # Etapa 4: Revisão
├── composables/
│ ├── useCheckout.ts # Lógica principal
│ └── useCheckoutStorage.ts # Persistência localStorage
├── types/
│ └── checkout.ts # Tipos TypeScript
└── utils/
└── validations.ts # Validações de formulário
E também:

app/pages/
└── [slug]/
└── checkout.vue # Rota pública
Vou começar a implementar. Pode confirmar?

Boa pergunta! Depois de enviar o pedido, o fluxo ideal seria:

🎯 Fluxo Pós-Checkout

1. Ao clicar em "Confirmar Pedido"
   Criar pedido no banco (via RPC)
   Limpar carrinho
   Redirecionar para página de confirmação
2. Página de Confirmação (/{slug}/pedido/{id})
   ✅ Pedido Confirmado!

Número do pedido: #12345
Status: Aguardando confirmação do estabelecimento

⏱️ Tempo estimado: 40-50 minutos

📋 Resumo do Pedido

- Itens
- Endereço de entrega
- Forma de pagamento
- Total

💬 Precisa de ajuda?
[Botão: Falar no WhatsApp]

[Botão: Voltar ao cardápio] 3. Estrutura a criar
app/features/public/pedido/
├── pages/
│ └── PedidoConfirmacaoPage.vue
├── components/
│ ├── PedidoStatus.vue
│ ├── PedidoResumo.vue
│ └── PedidoAcoes.vue
└── types/
└── pedido.ts

app/pages/[slug]/
└── pedido/
└── [id].vue 4. Dados do Pedido (Banco)
interface Pedido {
id: string
numero: number // #12345
estabelecimento_id: string
cliente: DadosCliente
tipo_entrega: 'delivery' | 'retirada'
endereco?: EnderecoEntrega
forma_pagamento: FormaPagamento
troco_para?: number
itens: ItemPedido[]
subtotal: number
taxa_entrega: number
desconto: number
total: number
observacoes?: string
status: 'pendente' | 'aceito' | 'preparo' | 'pronto' | 'entrega' | 'concluido' | 'cancelado'
created_at: timestamp
}
❓ Decisões Necessárias
Acompanhamento em tempo real?

Cliente pode acompanhar status do pedido?
Atualização automática (realtime) ou manual (refresh)?
Histórico de pedidos?

Cliente pode ver pedidos anteriores?
Precisa de autenticação ou só por número do pedido?
Cancelamento?

Cliente pode cancelar pedido?
Até qual status?
Quer que eu implemente a página de confirmação agora ou prefere focar em outra coisa primeiro?
