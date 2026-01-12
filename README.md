# 🍕 WebiDelivery

**Micro SaaS Multi-tenant para Cardápios Digitais e Gestão de Delivery**

Uma plataforma completa que permite estabelecimentos criarem cardápios digitais personalizados com URL única, gerenciarem pedidos em tempo real e controlarem suas operações através de painéis administrativos intuitivos.

---

## 🎯 Proposta de Valor

O WebiDelivery transforma qualquer estabelecimento (restaurante, lanchonete, pizzaria, etc.) em uma operação digital moderna, oferecendo:

- **Cardápio Digital Personalizado** - URL única `/{slug}` para cada estabelecimento
- **Gestão Completa de Pedidos** - Controle em tempo real com status detalhados
- **Sistema RBAC Avançado** - Controle granular de permissões por cargo
- **Marketing Integrado** - Cupons, promoções e campanhas automatizadas
- **Relatórios Inteligentes** - Insights sobre vendas e performance
- **Multi-tenant Seguro** - Isolamento completo entre estabelecimentos

---

## 🚀 Tecnologias e Arquitetura

### **Stack Principal**

- **Nuxt 4** - Framework Vue.js com renderização híbrida e TypeScript rigoroso
- **Supabase** - Backend-as-a-Service com PostgreSQL, autenticação e RLS
- **Tailwind CSS v4** - Design system moderno com variáveis CSS semânticas
- **TypeScript** - Tipagem rigorosa (zero `any` permitido)

### **Ferramentas de Desenvolvimento**

- **VeeValidate + Zod** - Validação de formulários robusta
- **ESLint + Prettier** - Qualidade e formatação de código
- **Nuxt SEO** - Otimização automática para motores de busca
- **Nuxt Icon (Lucide)** - Ícones otimizados
- **Nuxt Image** - Otimização automática de imagens

### **Arquitetura de Segurança**

- **Row Level Security (RLS)** - Isolamento multi-tenant no banco
- **RBAC Completo** - 6 níveis hierárquicos de permissão
- **Auditoria Completa** - Logs detalhados de todas as ações
- **LGPD Compliance** - Consentimentos e portabilidade de dados

---

## 🏗️ Estrutura do Sistema

### **Dois Painéis Distintos**

#### 🏪 **Painel Admin (Estabelecimento)**

Para donos e equipes gerenciarem seus negócios:

- **Dashboard** - KPIs, pedidos em andamento, atalhos rápidos
- **Pedidos** - Gestão completa do fluxo (pendente → concluído)
- **Cardápio** - Categorias, produtos, variações e adicionais
- **Marketing** - Cupons, banners e promoções
- **Equipe** - Gestão de usuários e permissões RBAC
- **Relatórios** - Vendas, produtos, marketing e financeiro
- **Configurações** - Dados da empresa, horários, pagamentos

#### 🌐 **Painel Super Admin (Plataforma)**

Para a equipe WebiDelivery gerenciar a plataforma:

- **Dashboard** - Métricas globais da plataforma
- **Estabelecimentos** - Gestão de todos os clientes
- **Usuários** - Controle de acessos e permissões
- **Financeiro** - Faturamento e cobrança
- **Suporte** - Tickets e atendimento
- **Relatórios** - Analytics da plataforma

---

## 👥 Sistema RBAC (Controle de Acesso)

### **Hierarquia de Cargos**

```
super_admin → gerente_plataforma → admin → gerente → staff → entregador
```

### **Permissões por Cargo**

| Funcionalidade     | Super Admin | Gerente Plat. | Admin | Gerente     | Staff       | Entregador |
| ------------------ | ----------- | ------------- | ----- | ----------- | ----------- | ---------- |
| Dashboard Completo | ✅          | ✅            | ✅    | ✅          | 🔸 Limitado | ⛔         |
| Gestão de Pedidos  | ✅          | ✅            | ✅    | ✅          | ✅          | ⛔         |
| Gestão de Cardápio | ✅          | ✅            | ✅    | ✅          | ✅          | ⛔         |
| Marketing          | ✅          | ✅            | ✅    | ✅          | ✅          | ⛔         |
| Gestão de Equipe   | ✅          | ✅            | ✅    | ✅          | ⛔          | ⛔         |
| Relatórios         | ✅          | ✅            | ✅    | ✅          | ⛔          | ⛔         |
| Configurações      | ✅          | 🔸 Limitado   | ✅    | 🔸 Limitado | ⛔          | ⛔         |
| Entregas           | ⛔          | ⛔            | ⛔    | ⛔          | ⛔          | ✅         |

**Regra de Interface**: Se o usuário não tem permissão, o item **não é exibido**.

---

## 🗺️ Mapeamento de Rotas

### **Rotas Públicas**

- `/` - Redirecionador inteligente baseado em autenticação
- `/{slug}` - **Cardápio público** com SEO dinâmico
- `/login` - Autenticação de estabelecimentos
- `/signup` - Cadastro de novos estabelecimentos
- `/forgot-password` - Recuperação de senha
- `/signup-equipe` - Cadastro via código de equipe
- `/super-admin/login` - Acesso à plataforma
- `/super-admin/signup` - Cadastro via código WEBI

### **Rotas Protegidas - Estabelecimento**

- `/onboarding` - Configuração inicial obrigatória (5 etapas)
- `/admin/dashboard` - Painel principal
- `/admin/pedidos` - Gestão de pedidos
- `/admin/cardapio` - Gestão de cardápio
- `/admin/marketing` - Campanhas e promoções
- `/admin/equipe` - Gestão de usuários
- `/admin/relatorios` - Analytics e relatórios
- `/admin/configuracoes` - Configurações do estabelecimento
- `/admin/perfil` - Perfil do usuário
- `/admin/entregas` - Painel do entregador

### **Rotas Protegidas - Plataforma**

- `/super-admin/dashboard` - Dashboard da plataforma
- `/super-admin/estabelecimentos` - Gestão de clientes
- `/super-admin/usuarios` - Controle de usuários
- `/super-admin/financeiro` - Faturamento
- `/super-admin/suporte` - Atendimento
- `/super-admin/equipe` - Equipe interna
- `/super-admin/relatorios` - Analytics globais
- `/super-admin/configuracoes` - Configurações da plataforma

---

## 🛠️ Configuração e Desenvolvimento

### **Pré-requisitos**

- Node.js 20+
- npm ou pnpm (recomendado)
- Conta no [Supabase](https://supabase.com) (gratuita)

### **Instalação**

```bash
# Clone o repositório
git clone https://github.com/igorelias/webidelivery.git
cd webidelivery

# Instale as dependências
pnpm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com suas credenciais

# Execute o servidor de desenvolvimento
pnpm run dev
```

### **Configuração do Supabase**

1. Crie um projeto no [Supabase Dashboard](https://app.supabase.com)
2. Configure as variáveis no arquivo `.env`:

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-publishable-key
SUPABASE_SECRET_KEY=your-secret-key

# Configurações do Site
NUXT_PUBLIC_APP_URL=http://localhost:3000
NUXT_PUBLIC_SITE_URL=https://www.webidelivery.com.br
NUXT_PUBLIC_SITE_NAME=WebiDelivery
NUXT_PUBLIC_SITE_DESCRIPTION="Crie seu cardápio digital e receba pedidos"
```

---

## 🎨 Design System e UI/UX

### **Princípios de Design**

- **Mobile-First** - Responsividade completa
- **Dark/Light Mode** - Tema automático com persistência
- **Acessibilidade** - WCAG 2.1 AA compliant
- **Performance** - Lazy loading e otimizações

### **Layout do Painel Admin**

- **Menu Lateral Fixo** - 100vh, sem scroll, com logo e navegação
- **Header Fixo** - Título da página, controles e notificações
- **Área de Conteúdo** - Responsiva com tabs organizadas
- **Card do Usuário** - Avatar, nome, dropdown com perfil/sair

### **Cores e Variáveis (OKLCH)**

- **Brand** - Laranja moderno (primary)
- **Accent** - Slate azulado (secondary)
- **Success** - Verde (confirmações)
- **Warning** - Âmbar (alertas)
- **Error** - Vermelho (erros)
- **Neutral** - Escala de cinzas moderna

---

## 📊 Módulos Funcionais

### **🍽️ Cardápio Digital**

Estrutura hierárquica completa:

```
Estabelecimento
└── Categorias
    └── Produtos (flags: ativo, destaque, promoção)
        ├── Variações (tamanhos/sabores com preços)
        └── Grupos de Adicionais (min/max, obrigatório)
            └── Adicionais (itens extras)
```

### **🎁 Sistema de Combos**

- Itens fixos inclusos no combo
- Grupos de escolha com opções selecionáveis
- Cálculo automático de economia vs preço original
- Período de validade configurável

### **📈 Marketing Avançado**

- **Cupons** - Percentual, valor fixo, frete grátis
- **Banners** - Carrossel, destaque, popup
- **Promoções** - Desconto por produto/categoria, leve e pague

### **📦 Gestão de Pedidos**

Fluxo completo com status:

```
pendente → aceito → preparo → pronto → entrega → concluído
                                    ↘ cancelado
```

### **👥 Gestão de Equipe**

- Convites por código único
- Definição automática de cargo e estabelecimento
- Controle granular de permissões RBAC

---

## 🔒 Segurança e Compliance

### **Multi-tenant Seguro**

- **Row Level Security (RLS)** - Isolamento completo no banco
- **Políticas Granulares** - Controle por tabela e operação
- **Auditoria Completa** - Logs de todas as ações com metadados

### **LGPD Compliance**

- **Consentimentos Versionados** - Termos, privacidade, marketing
- **Portabilidade de Dados** - Exportação completa
- **Direito ao Esquecimento** - Anonimização (não exclusão física)
- **Transparência** - Logs de acesso e uso de dados

### **Validações Rigorosas**

| Campo    | Regra                                |
| -------- | ------------------------------------ |
| E-mail   | RFC compliant, único, normalizado    |
| Senha    | ≥8 chars, letra + número + especial  |
| WhatsApp | DDI+DDD+Número normalizado           |
| Slug     | a-z, 0-9, hífen, 3-50 chars, único   |
| Preços   | Numéricos, 2 decimais, não negativos |

---

## 📋 Status de Desenvolvimento

### ✅ **Base Técnica Implementada**

- [x] **Nuxt 4** configurado com TypeScript rigoroso
- [x] **Supabase** integrado com RLS e multi-tenant
- [x] **Database Schema** completo (19 tabelas, 21 funções RPC, 7 views)
- [x] **Sistema RBAC** com 6 níveis hierárquicos
- [x] **Auditoria e Logs** completos
- [x] **LGPD Compliance** implementado
- [x] **Design System** com Tailwind CSS v4
- [x] **SEO Dinâmico** para páginas `/{slug}`
- [x] **Validação Rigorosa** (VeeValidate + Zod)

### 🚧 **Próximas Implementações**

- [ ] Interface de autenticação completa
- [ ] Onboarding obrigatório (5 etapas)
- [ ] Painel administrativo responsivo
- [ ] Gestão completa de cardápio
- [ ] Sistema de marketing (cupons/banners)
- [ ] Cardápio público otimizado
- [ ] Checkout via WhatsApp
- [ ] Painel Super Admin
- [ ] Sistema de relatórios
- [ ] Configurações avançadas

### 🎯 **Metas de Qualidade**

- [x] **TypeScript Rigoroso** - Zero `any`, preferir `unknown` com type guards
- [x] **Lighthouse Score** otimizado
- [x] **Acessibilidade** (WCAG 2.1 AA)
- [x] **SEO Técnico** implementado
- [x] **Performance** otimizada
- [x] **Responsividade** completa

---

## 🎯 Padrões de Desenvolvimento

### **Regras Obrigatórias**

- ✅ **TypeScript Rigoroso** - Zero `any`, usar `unknown` + type guards
- ✅ **Tailwind CSS Apenas** - Proibido Sass/SCSS/CSS Modules
- ✅ **Composition API** - Options API proibida
- ✅ **Princípio DRY** - Reutilização máxima de componentes/composables
- ✅ **Comentários em Português** - Documentação clara e objetiva
- ✅ **Validações Duplas** - Server-side e client-side
- ✅ **SEO Dinâmico** - Meta tags personalizadas por página

### **Arquitetura Feature-Based**

```
app/
├── features/           # Organização por funcionalidade
│   ├── auth/          # Autenticação completa
│   ├── onboarding/    # Configuração inicial
│   ├── dashboard/     # Painel principal
│   ├── cardapio/      # Gestão de cardápio
│   ├── pedidos/       # Gestão de pedidos
│   ├── marketing/     # Campanhas e promoções
│   └── configuracoes/ # Configurações
├── components/        # Componentes reutilizáveis
│   ├── ui/           # Componentes base
│   ├── layout/       # Componentes de layout
│   └── shared/       # Componentes compartilhados
├── composables/      # Lógica reutilizável
└── stores/          # Estado global (Pinia)
```

---

## 📄 Licença e Copyright

**Copyright © 2025 Igor Elias**

Este código é disponibilizado exclusivamente para fins de **portfólio** e **demonstração profissional**.

### 🚫 **Restrições de Uso**

- É **expressamente proibido** copiar, usar, modificar, distribuir ou vender este código sem autorização
- O acesso público tem apenas objetivo de **visualização do trabalho** por recrutadores
- **Nenhum direito de uso** é concedido além da visualização
- Este projeto é **protegido por direitos autorais**

### 📞 **Contato**

**Desenvolvedor:** Igor Elias  
**LinkedIn:** https://www.linkedin.com/in/igor-elias-de-lima/  
**Domínio:** www.webidelivery.com.br

### ⚖️ **Aviso Legal**

O uso não autorizado deste código pode resultar em ações legais. Este projeto serve como **demonstração de habilidades técnicas** e implementação de arquitetura robusta para um SaaS profissional.

---

## 🏆 Diferenciais Técnicos

- **Arquitetura Multi-tenant Segura** com RLS nativo
- **Arquitetura Híbrida Otimizada** - Funções RPC para CUD (Create/Update/Delete) e RLS para leitura (Read)
- **Sistema RBAC Granular** com 6 níveis hierárquicos
- **Auditoria Completa** de todas as ações do sistema
- **LGPD Compliance** nativo com portabilidade de dados
- **Performance Otimizada** com lazy loading e cache inteligente
- **SEO Dinâmico** com meta tags personalizadas por estabelecimento
- **TypeScript Rigoroso** com zero tolerância a `any`
- **Design System Moderno** com variáveis CSS semânticas
- **Responsividade Completa** mobile-first
- **Acessibilidade WCAG 2.1 AA** compliant
