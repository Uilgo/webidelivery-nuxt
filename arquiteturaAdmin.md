📋 Estrutura da Feature Admin (incluindo Super Admin)
Baseado no PRD e nas regras do projeto, aqui está a estrutura completa da feature admin:

🏗️ Arquitetura por Features - Admin
app/features/admin/
├── components/
│ ├── layout/
│ │ ├── AdminSidebar.vue # Menu lateral fixo 100vh
│ │ ├── AdminTopbar.vue # Barra superior com título + controles
│ │ ├── AdminBreadcrumbs.vue # Navegação breadcrumb
│ │ └── AdminUserDropdown.vue # Dropdown do usuário (perfil, sair)
│ │
│ ├── dashboard/
│ │ ├── StatsCards.vue # Cards de KPIs (vendas, pedidos, etc.)
│ │ ├── ChartsGrid.vue # Gráficos de performance
│ │ ├── RecentOrders.vue # Pedidos recentes
│ │ ├── QuickActions.vue # Ações rápidas
│ │ ├── OnboardingWizard.vue # Wizard de onboarding integrado
│ │ └── ActivityFeed.vue # Feed de atividades
│ │
│ ├── pedidos/
│ │ ├── OrdersTable.vue # Tabela de pedidos
│ │ ├── OrderCard.vue # Card individual do pedido
│ │ ├── OrderStatusTabs.vue # Tabs por status (pendente, aceito, etc.)
│ │ ├── OrderFilters.vue # Filtros de pedidos
│ │ └── OrderModal.vue # Modal de detalhes do pedido
│ │
│ ├── cardapio/
│ │ ├── CategoriesManager.vue # Gerenciador de categorias
│ │ ├── ProductsManager.vue # Gerenciador de produtos
│ │ ├── AdditionalsManager.vue # Gerenciador de adicionais
│ │ ├── CategoryForm.vue # Formulário de categoria
│ │ ├── ProductForm.vue # Formulário de produto
│ │ └── ProductVariations.vue # Gerenciador de variações
│ │
│ ├── marketing/
│ │ ├── CouponsManager.vue # Gerenciador de cupons
│ │ ├── BannersManager.vue # Gerenciador de banners
│ │ ├── PromotionsManager.vue # Gerenciador de promoções
│ │ ├── CouponForm.vue # Formulário de cupom
│ │ └── BannerForm.vue # Formulário de banner
│ │
│ ├── equipe/
│ │ ├── TeamMembersList.vue # Lista de membros da equipe
│ │ ├── TeamMemberCard.vue # Card de membro
│ │ ├── InviteForm.vue # Formulário de convite
│ │ ├── PendingInvites.vue # Convites pendentes
│ │ └── TeamMemberModal.vue # Modal de detalhes/edição
│ │
│ ├── relatorios/
│ │ ├── ReportsNavigation.vue # Navegação entre relatórios
│ │ ├── SalesReport.vue # Relatório de vendas
│ │ ├── OrdersReport.vue # Relatório de pedidos
│ │ ├── ProductsReport.vue # Relatório de produtos
│ │ └── ReportFilters.vue # Filtros de relatórios
│ │
│ ├── configuracoes/
│ │ ├── SettingsTabs.vue # Tabs de configurações
│ │ ├── CompanySettings.vue # Dados da empresa
│ │ ├── ScheduleSettings.vue # Horários de funcionamento
│ │ ├── PaymentSettings.vue # Métodos de pagamento
│ │ ├── DeliverySettings.vue # Frete e entrega
│ │ ├── ThemeSettings.vue # Personalização visual
│ │ └── SecuritySettings.vue # Configurações de segurança
│ │
│ └── shared/
│ ├── AdminPageHeader.vue # Cabeçalho padrão das páginas
│ ├── AdminEmptyState.vue # Estado vazio customizado
│ ├── AdminDataTable.vue # Tabela de dados reutilizável
│ ├── AdminModal.vue # Modal padrão do admin
│ └── AdminConfirmDialog.vue # Dialog de confirmação
│
├── composables/
│ ├── useDashboard.ts # Dados do dashboard
│ ├── useOrders.ts # Gerenciamento de pedidos
│ ├── useMenu.ts # Gerenciamento do cardápio
│ ├── useMarketing.ts # Campanhas e promoções
│ ├── useTeam.ts # Gerenciamento da equipe
│ ├── useReports.ts # Relatórios e analytics
│ ├── useSettings.ts # Configurações do estabelecimento
│ ├── useOnboarding.ts # Fluxo de onboarding
│ └── usePermissions.ts # Controle de permissões RBAC
│
├── stores/
│ ├── dashboard.ts # Estado do dashboard
│ ├── orders.ts # Estado dos pedidos
│ ├── menu.ts # Estado do cardápio
│ └── settings.ts # Estado das configurações
│
├── types/
│ ├── dashboard.ts # Tipos do dashboard
│ ├── orders.ts # Tipos de pedidos
│ ├── menu.ts # Tipos do cardápio
│ ├── marketing.ts # Tipos de marketing
│ ├── team.ts # Tipos da equipe
│ ├── reports.ts # Tipos de relatórios
│ └── settings.ts # Tipos de configurações
│
└── utils/
├── orderHelpers.ts # Helpers para pedidos
├── menuHelpers.ts # Helpers para cardápio
├── reportHelpers.ts # Helpers para relatórios
└── permissionHelpers.ts # Helpers para permissões
🏗️ Feature Super Admin (Plataforma)
app/features/super-admin/
├── components/
│ ├── layout/
│ │ ├── SuperAdminSidebar.vue # Menu lateral da plataforma
│ │ ├── SuperAdminTopbar.vue # Barra superior da plataforma
│ │ └── SuperAdminUserDropdown.vue # Dropdown do super admin
│ │
│ ├── dashboard/
│ │ ├── PlatformStats.vue # Estatísticas da plataforma
│ │ ├── EstablishmentsOverview.vue # Visão geral dos estabelecimentos
│ │ ├── RevenueCharts.vue # Gráficos de receita
│ │ └── SystemHealth.vue # Status do sistema
│ │
│ ├── estabelecimentos/
│ │ ├── EstablishmentsList.vue # Lista de estabelecimentos
│ │ ├── EstablishmentCard.vue # Card de estabelecimento
│ │ ├── EstablishmentModal.vue # Modal de detalhes
│ │ ├── EstablishmentFilters.vue # Filtros de estabelecimentos
│ │ └── EstablishmentActions.vue # Ações (ativar, suspender, etc.)
│ │
│ ├── usuarios/
│ │ ├── UsersList.vue # Lista de usuários
│ │ ├── UserCard.vue # Card de usuário
│ │ ├── UserModal.vue # Modal de usuário
│ │ └── UserFilters.vue # Filtros de usuários
│ │
│ ├── financeiro/
│ │ ├── FinancialOverview.vue # Visão geral financeira
│ │ ├── RevenueReport.vue # Relatório de receita
│ │ ├── PaymentMethods.vue # Métodos de pagamento
│ │ └── Transactions.vue # Transações
│ │
│ ├── suporte/
│ │ ├── SupportTickets.vue # Tickets de suporte
│ │ ├── TicketCard.vue # Card de ticket
│ │ ├── TicketModal.vue # Modal de ticket
│ │ └── SupportStats.vue # Estatísticas de suporte
│ │
│ ├── equipe/
│ │ ├── InternalTeamList.vue # Lista da equipe interna
│ │ ├── TeamMemberCard.vue # Card de membro
│ │ ├── InviteManagerForm.vue # Formulário de convite gerente
│ │ └── TeamPermissions.vue # Permissões da equipe
│ │
│ └── configuracoes/
│ ├── PlatformSettings.vue # Configurações da plataforma
│ ├── SystemConfig.vue # Configurações do sistema
│ ├── SecurityConfig.vue # Configurações de segurança
│ └── MaintenanceMode.vue # Modo de manutenção
│
├── composables/
│ ├── usePlatformDashboard.ts # Dashboard da plataforma
│ ├── useEstablishments.ts # Gerenciamento de estabelecimentos
│ ├── usePlatformUsers.ts # Usuários da plataforma
│ ├── useFinancial.ts # Dados financeiros
│ ├── useSupport.ts # Sistema de suporte
│ ├── useInternalTeam.ts # Equipe interna
│ └── usePlatformSettings.ts # Configurações da plataforma
│
├── stores/
│ ├── platformDashboard.ts # Estado do dashboard
│ ├── establishments.ts # Estado dos estabelecimentos
│ └── platformSettings.ts # Estado das configurações
│
└── types/
├── platform.ts # Tipos da plataforma
├── establishments.ts # Tipos de estabelecimentos
├── financial.ts # Tipos financeiros
└── support.ts # Tipos de suporte
📄 Páginas (Routes)
app/pages/admin/
├── index.vue # Dashboard admin (DashboardPage.vue)
├── pedidos.vue # Página de pedidos
├── cardapio.vue # Página do cardápio
├── marketing.vue # Página de marketing
├── equipe.vue # Página da equipe
├── relatorios.vue # Página de relatórios
├── configuracoes.vue # Página de configurações
├── perfil.vue # Página do perfil
└── entregas.vue # Página de entregas (só entregador)

app/pages/super-admin/
├── index.vue # Dashboard super admin
├── estabelecimentos.vue # Página de estabelecimentos
├── usuarios.vue # Página de usuários
├── financeiro.vue # Página financeira
├── suporte.vue # Página de suporte
├── equipe.vue # Página da equipe interna
├── relatorios.vue # Página de relatórios
└── configuracoes.vue # Página de configurações
🎨 Layouts
app/layouts/
├── admin.vue # Layout do painel admin
└── super-admin.vue # Layout do painel super admin
🔧 Composables Globais Adicionais
app/composables/core/
└── usePermissions.ts # Controle RBAC global

app/composables/ui/
├── useSidebar.ts # Controle do menu lateral
├── useDataTable.ts # Tabelas de dados
└── useConfirmDialog.ts # Diálogos de confirmação

🎯 Características Principais:

Separação Clara: Admin e Super Admin são features distintas
RBAC Integrado: Componentes respeitam permissões automaticamente
Reutilização: Componentes shared entre features
Responsividade: Menu lateral colapsável para mobile
Performance: Lazy loading de componentes pesados
Acessibilidade: Navegação por teclado e ARIA labels
Onboarding: Integrado no dashboard (não rota separada)
Multi-tenant: RLS garante isolamento de dados
Esta estrutura segue exatamente o PRD e as regras do projeto, mantendo a arquitetura por features e separação de responsabilidades!
