📋 Planejamento da Feature de Marketing - WebiDelivery
🎯 Visão Geral
A feature de Marketing permitirá que estabelecimentos criem e gerenciem:

Cupons (percentual, valor fixo, frete grátis)
Banners (carrossel, destaque, popup)
Promoções (desconto produto, categoria, combo, leve e pague)
📁 Estrutura de Arquivos
app/features/admin/marketing/
├── components/
│ ├── MarketingManager.vue # Componente principal orquestrador
│ ├── MarketingTabs.vue # Navegação entre abas
│ ├── MarketingStats.vue # Estatísticas gerais
│ │
│ ├── cupons/
│ │ ├── CupomCard.vue # Card de cupom
│ │ ├── CupomDrawer.vue # Drawer para criar/editar
│ │ ├── CupomForm.vue # Formulário de cupom
│ │ ├── CupomDeleteModal.vue # Modal de confirmação
│ │ ├── CupomsList.vue # Lista de cupons
│ │ ├── CupomValidador.vue # Validador de cupom
│ │ └── CupomStats.vue # Estatísticas de cupons
│ │
│ ├── banners/
│ │ ├── BannerCard.vue # Card de banner
│ │ ├── BannerDrawer.vue # Drawer para criar/editar
│ │ ├── BannerForm.vue # Formulário de banner
│ │ ├── BannerDeleteModal.vue # Modal de confirmação
│ │ ├── BannersList.vue # Lista de banners
│ │ ├── BannerPreview.vue # Preview do banner
│ │ ├── BannerColorPicker.vue # Seletor de cores
│ │ └── BannerStats.vue # Estatísticas de banners
│ │
│ ├── promocoes/
│ │ ├── PromocaoCard.vue # Card de promoção
│ │ ├── PromocaoDrawer.vue # Drawer para criar/editar
│ │ ├── PromocaoForm.vue # Formulário de promoção
│ │ ├── PromocaoDeleteModal.vue # Modal de confirmação
│ │ ├── PromocoesList.vue # Lista de promoções
│ │ ├── PromocaoDatePicker.vue # Seletor de período
│ │ └── PromocaoStats.vue # Estatísticas de promoções
│ │
│ └── shared/
│ ├── MarketingEmptyState.vue # Estado vazio
│ ├── MarketingFilters.vue # Filtros compartilhados
│ ├── MarketingSearch.vue # Busca compartilhada
│ └── MarketingViewToggle.vue # Toggle card/list
│
├── composables/
│ ├── useMarketing.ts # Composable orquestrador
│ ├── useCupons.ts # Gerenciamento de cupons
│ ├── useBanners.ts # Gerenciamento de banners
│ ├── usePromocoes.ts # Gerenciamento de promoções
│ ├── useMarketingStats.ts # Estatísticas de marketing
│ ├── useMarketingValidation.ts # Validações específicas
│ └── useMarketingFilters.ts # Filtros e busca
│
├── pages/
│ └── MarketingPage.vue # Página principal
│
├── types/
│ ├── marketing.ts # Tipos específicos da feature
│ ├── cupons.ts # Tipos de cupons
│ ├── banners.ts # Tipos de banners
│ └── promocoes.ts # Tipos de promoções
│
└── utils/
├── marketingHelpers.ts # Helpers gerais
├── cupomValidators.ts # Validadores de cupom
├── bannerHelpers.ts # Helpers de banner
└── promocaoCalculators.ts # Calculadores de promoção
🔧 Schemas de Validação
// shared/schemas/marketing.ts

/\*\*

- Schema: Cupom
  \*/
  export const cupomSchema = z.object({
  codigo: z
  .string()
  .min(3, "Código deve ter no mínimo 3 caracteres")
  .max(20, "Código deve ter no máximo 20 caracteres")
  .regex(/^[A-Z0-9]+$/, "Código deve conter apenas letras maiúsculas e números"),
  tipo: z.enum(["percentual", "valor_fixo", "frete_gratis"]),
  valor_desconto: z.number().min(0.01, "Valor deve ser maior que zero"),
  valor_minimo: z.number().min(0, "Valor mínimo não pode ser negativo").optional(),
  limite_uso: z.number().min(1, "Limite deve ser pelo menos 1").optional(),
  data_expiracao: z.string().optional(),
  descricao: z.string().max(200, "Descrição deve ter no máximo 200 caracteres").optional(),
  })
  .refine((data) => {
  if (data.tipo === "percentual") {
  return data.valor_desconto >= 1 && data.valor_desconto <= 100;
  }
  return data.valor_desconto > 0;
  }, {
  message: "Percentual deve estar entre 1% e 100%",
  path: ["valor_desconto"],
  });

/\*\*

- Schema: Banner
  \*/
  export const bannerSchema = z.object({
  titulo: z
  .string()
  .min(3, "Título deve ter no mínimo 3 caracteres")
  .max(100, "Título deve ter no máximo 100 caracteres"),
  descricao: z.string().max(200, "Descrição deve ter no máximo 200 caracteres").optional(),
  tipo: z.enum(["carrossel", "destaque", "popup"]),
  tipo_conteudo: z.enum(["imagem", "texto", "misto"]),
  imagem_url: z.string().url("URL inválida").optional(),
  link_url: z.string().url("URL inválida").optional(),
  cor_fundo: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Cor inválida").optional(),
  cor_texto: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Cor inválida").optional(),
  texto_cta: z.string().max(50, "CTA deve ter no máximo 50 caracteres").optional(),
  texto_posicao: z.enum(["centro", "esquerda", "direita", "superior", "inferior"]).optional(),
  });

/\*\*

- Schema: Promoção
  \*/
  export const promocaoSchema = z.object({
  nome: z
  .string()
  .min(3, "Nome deve ter no mínimo 3 caracteres")
  .max(100, "Nome deve ter no máximo 100 caracteres"),
  descricao: z.string().max(200, "Descrição deve ter no máximo 200 caracteres").optional(),
  tipo: z.enum(["desconto_produto", "desconto_categoria", "combo_promocional", "leve_pague"]),
  desconto: z.number().min(0.01, "Desconto deve ser maior que zero"),
  data_inicio: z.string().min(1, "Data de início é obrigatória"),
  data_fim: z.string().optional(),
  })
  .refine((data) => {
  if (data.data_fim) {
  return new Date(data.data_fim) > new Date(data.data_inicio);
  }
  return true;
  }, {
  message: "Data fim deve ser posterior à data início",
  path: ["data_fim"],
  });
  🎨 Componentes Principais

1. MarketingManager.vue
<template>
  <div class="marketing-manager">
    <!-- Header com estatísticas gerais -->
    <MarketingStats 
      :cupons-count="cuponsCount"
      :banners-count="bannersCount" 
      :promocoes-count="promocoesCount"
    />
    
    <!-- Navegação por abas -->
    <MarketingTabs 
      :active-tab="activeTab"
      :tab-counts="tabCounts"
      @tab-change="handleTabChange"
    />
    
    <!-- Filtros e busca -->
    <MarketingFilters
      :search-value="currentSearchValue"
      :sort-value="currentSortValue"
      :filters="currentFilters"
      @search="handleSearch"
      @sort="handleSort"
      @filter="handleFilter"
    />
    
    <!-- Conteúdo das abas -->
    <div class="tab-content">
      <CuponsView v-if="activeTab === 'cupons'" />
      <BannersView v-if="activeTab === 'banners'" />
      <PromocoesView v-if="activeTab === 'promocoes'" />
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 📌 MarketingManager
 * 
 * Componente orquestrador principal da feature de marketing.
 * Gerencia navegação entre abas, filtros e estado global.
 */

const { 
  activeTab,
  tabCounts,
  currentSearchValue,
  currentSortValue, 
  currentFilters,
  handleTabChange,
  handleSearch,
  handleSort,
  handleFilter
} = useMarketing();

const { cuponsCount } = useCupons();
const { bannersCount } = useBanners();  
const { promocoesCount } = usePromocoes();
</script>

2. useMarketing.ts (Composable Orquestrador)
   /\*\*

- 📌 useMarketing - Composable Orquestrador Global do Marketing
-
- Gerencia estado global do módulo de marketing:
- - Navegação entre abas (cupons, banners, promoções)
- - Filtros, busca e ordenação por aba
- - Contadores das tabs
- - Sincronização com URL e cookies
    \*/

export type MarketingTab = "cupons" | "banners" | "promocoes";
export type MarketingViewMode = "card" | "list";

export interface UseMarketingReturn {
// Estado das abas
activeTab: Ref<MarketingTab>;
tabCounts: ComputedRef<{
cuponsCount: number;
bannersCount: number;
promocoesCount: number;
}>;

// Modo de visualização
viewMode: Ref<MarketingViewMode>;

// Estados de loading
loadingStates: Ref<Record<MarketingTab, boolean>>;
currentLoading: ComputedRef<boolean>;

// Filtros por aba
searchValues: Ref<Record<MarketingTab, string>>;
sortValues: Ref<Record<MarketingTab, string>>;
filterValues: Ref<Record<MarketingTab, Record<string, unknown>>>;
currentSearchValue: ComputedRef<string>;
currentSortValue: ComputedRef<string>;
currentFilters: ComputedRef<Record<string, unknown>>;

// Handlers
handleTabChange: (tab: string) => void;
handleViewModeChange: (mode: MarketingViewMode) => void;
handleSearch: (value: string) => void;
handleSort: (value: string) => void;
handleFilter: (filters: Record<string, unknown>) => void;
handleRefresh: () => void;
}

export const useMarketing = (): UseMarketingReturn => {
// Implementação similar ao useCardapio.ts
// mas adaptada para marketing
};
🔄 Composables Específicos

1. useCupons.ts
   /\*\*

- 📌 useCupons - Gerenciamento de Cupons
-
- Responsável por:
- - CRUD de cupons
- - Validação de cupons
- - Estatísticas de uso
- - Filtros e busca
    \*/

export interface UseCuponsReturn {
// Estado
cupons: Ref<CupomCompleto[]>;
loading: Ref<boolean>;
error: Ref<string | null>;

// Estatísticas
cuponsCount: ComputedRef<number>;
cuponsAtivos: ComputedRef<number>;
cuponsExpirados: ComputedRef<number>;
totalUsos: ComputedRef<number>;

// CRUD
createCupom: (data: CupomFormData) => Promise<void>;
updateCupom: (id: string, data: CupomFormData) => Promise<void>;
deleteCupom: (id: string) => Promise<void>;
toggleCupomStatus: (id: string) => Promise<void>;

// Validação
validateCupom: (codigo: string) => Promise<ValidacaoCupom>;
checkCodigoDisponivel: (codigo: string) => Promise<boolean>;

// Filtros
filteredCupons: ComputedRef<CupomCompleto[]>;
applyFilters: (filters: CupomFilters) => void;

// Utilitários
refreshCupons: () => Promise<void>;
duplicateCupom: (id: string) => Promise<void>;
} 2. useBanners.ts
/\*\*

- 📌 useBanners - Gerenciamento de Banners
-
- Responsável por:
- - CRUD de banners
- - Ordenação drag & drop
- - Preview em tempo real
- - Upload de imagens
    \*/

export interface UseBannersReturn {
// Estado
banners: Ref<BannerCompleto[]>;
loading: Ref<boolean>;
error: Ref<string | null>;

// Estatísticas
bannersCount: ComputedRef<number>;
bannersAtivos: ComputedRef<number>;
bannersPorTipo: ComputedRef<Record<TipoBanner, number>>;

// CRUD
createBanner: (data: BannerFormData) => Promise<void>;
updateBanner: (id: string, data: BannerFormData) => Promise<void>;
deleteBanner: (id: string) => Promise<void>;
toggleBannerStatus: (id: string) => Promise<void>;

// Ordenação
reorderBanners: (banners: BannerCompleto[]) => Promise<void>;
moveBannerUp: (id: string) => Promise<void>;
moveBannerDown: (id: string) => Promise<void>;

// Upload
uploadBannerImage: (file: File) => Promise<string>;

// Filtros
filteredBanners: ComputedRef<BannerCompleto[]>;
applyFilters: (filters: BannerFilters) => void;

// Utilitários
refreshBanners: () => Promise<void>;
duplicateBanner: (id: string) => Promise<void>;
generateBannerPreview: (data: BannerFormData) => BannerPreview;
} 3. usePromocoes.ts
/\*\*

- 📌 usePromocoes - Gerenciamento de Promoções
-
- Responsável por:
- - CRUD de promoções
- - Validação de períodos
- - Cálculo de descontos
- - Aplicação automática
    \*/

export interface UsePromocoesReturn {
// Estado
promocoes: Ref<PromocaoCompleta[]>;
loading: Ref<boolean>;
error: Ref<string | null>;

// Estatísticas
promocoesCount: ComputedRef<number>;
promocoesAtivas: ComputedRef<number>;
promocoesExpiradas: ComputedRef<number>;
economiaTotal: ComputedRef<number>;

// CRUD
createPromocao: (data: PromocaoFormData) => Promise<void>;
updatePromocao: (id: string, data: PromocaoFormData) => Promise<void>;
deletePromocao: (id: string) => Promise<void>;
togglePromocaoStatus: (id: string) => Promise<void>;

// Validação
validatePromocao: (id: string) => Promise<ValidacaoPromocao>;
checkPeriodoValido: (dataInicio: string, dataFim?: string) => boolean;

// Cálculos
calculateDesconto: (promocao: PromocaoCompleta, valor: number) => number;
getPromocoesAplicaveis: (produtos: string[], categorias: string[]) => PromocaoCompleta[];

// Filtros
filteredPromocoes: ComputedRef<PromocaoCompleta[]>;
applyFilters: (filters: PromocaoFilters) => void;

// Utilitários
refreshPromocoes: () => Promise<void>;
duplicatePromocao: (id: string) => Promise<void>;
extendPromocao: (id: string, novaDataFim: string) => Promise<void>;
}
🎯 Funcionalidades por Aba
Cupons
✅ Criar cupom (percentual, valor fixo, frete grátis)
✅ Editar cupom existente
✅ Ativar/desativar cupom
✅ Excluir cupom
✅ Duplicar cupom
✅ Validar código único
✅ Visualizar estatísticas de uso
✅ Filtrar por tipo, status, período
✅ Buscar por código ou descrição
✅ Exportar lista de cupons
Banners
✅ Criar banner (carrossel, destaque, popup)
✅ Editar banner existente
✅ Reordenar banners (drag & drop)
✅ Ativar/desativar banner
✅ Excluir banner
✅ Duplicar banner
✅ Upload de imagens
✅ Preview em tempo real
✅ Personalizar cores e textos
✅ Filtrar por tipo e status
✅ Buscar por título
Promoções
✅ Criar promoção (produto, categoria, combo, leve e pague)
✅ Editar promoção existente
✅ Definir período de validade
✅ Ativar/desativar promoção
✅ Excluir promoção
✅ Duplicar promoção
✅ Estender período
✅ Visualizar economia gerada
✅ Filtrar por tipo, status, período
✅ Buscar por nome
🔐 Permissões RBAC
Ação Admin Gerente Staff Entregador
Visualizar Marketing ✅ ✅ ✅ ⛔
Criar Cupons ✅ ✅ ✅ ⛔
Editar Cupons ✅ ✅ ✅ ⛔
Excluir Cupons ✅ ✅ ⛔ ⛔
Criar Banners ✅ ✅ ✅ ⛔
Editar Banners ✅ ✅ ✅ ⛔
Excluir Banners ✅ ✅ ⛔ ⛔
Criar Promoções ✅ ✅ ✅ ⛔
Editar Promoções ✅ ✅ ✅ ⛔
Excluir Promoções ✅ ✅ ⛔ ⛔
Ver Estatísticas ✅ ✅ ⛔ ⛔
📊 Integração com Cardápio Público
Cupons
Validação automática no checkout
Aplicação de desconto em tempo real
Verificação de valor mínimo
Controle de limite de uso
Banners
Exibição no carrossel principal
Banners de destaque em categorias
Popups promocionais
Responsividade mobile
Promoções
Aplicação automática por produto/categoria
Destaque visual nos produtos
Cálculo de economia
Combinação com cupons
🚀 Cronograma de Implementação
Fase 1: Estrutura Base (3 dias)
Criar estrutura de pastas
Implementar tipos TypeScript
Criar schemas de validação
Configurar composable orquestrador
Fase 2: Cupons (4 dias)
Implementar CRUD de cupons
Criar componentes de interface
Adicionar validações
Implementar estatísticas
Fase 3: Banners (4 dias)
Implementar CRUD de banners
Criar editor visual
Adicionar upload de imagens
Implementar preview
Fase 4: Promoções (4 dias)
Implementar CRUD de promoções
Criar calculadora de descontos
Adicionar validação de períodos
Implementar aplicação automática
Fase 5: Integração (3 dias)
Integrar com cardápio público
Implementar aplicação no checkout
Adicionar testes
Documentar funcionalidades
Total: 18 dias de desenvolvimento

✅ Critérios de Aceitação
Cupons
Criar cupom com código único
Validar cupom no checkout
Aplicar desconto corretamente
Controlar limite de uso
Exibir estatísticas de uso
Banners
Criar banner com preview
Reordenar banners por drag & drop
Exibir no cardápio público
Responsividade mobile
Upload de imagens funcionando
Promoções
Criar promoção com período
Aplicar automaticamente
Calcular economia correta
Combinar com cupons
Exibir estatísticas
Este planejamento segue rigorosamente as diretrizes do projeto, utilizando a arquitetura por features, TypeScript rigoroso, Tailwind CSS e os padrões estabelecidos no guia de desenvolvimento.
