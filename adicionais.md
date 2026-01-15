📋 PLANEJAMENTO - Feature de Adicionais
🎯 Objetivo
Criar a feature completa de gerenciamento de Grupos de Adicionais e seus Adicionais (itens), seguindo o mesmo padrão das features de Categorias e Produtos.

📊 Estrutura do Banco de Dados
Tabelas:

grupos_adicionais (5 registros) - Grupos reutilizáveis (ex: Bordas, Extras)
adicionais (31 registros) - Itens individuais com preço
Funções RPC disponíveis:

fn_grupos_adicionais_criar(p_nome, p_descricao, p_min_selecao, p_max_selecao, p_obrigatorio)
fn_grupos_adicionais_atualizar(p_grupo_id, p_nome, p_descricao, p_min_selecao, p_max_selecao, p_obrigatorio, p_ativo)
fn_grupos_adicionais_excluir(p_grupo_id)
fn_grupos_adicionais_reordenar(p_grupo_ids[])
fn_adicionais_criar(p_grupo_id, p_nome, p_descricao, p_preco)
fn_adicionais_atualizar(p_adicional_id, p_nome, p_descricao, p_preco, p_ativo)
fn_adicionais_excluir(p_adicional_id)
fn_adicionais_reordenar(p_grupo_id, p_adicional_ids[])
📁 Arquivos a Criar

1. Tipos (app/features/admin/B-admin/types/adicional.ts)

- GrupoAdicional
- GrupoAdicionalComputado
- GrupoAdicionalCreateData
- GrupoAdicionalUpdateData
- Adicional
- AdicionalComputado
- AdicionalCreateData
- AdicionalUpdateData
- GrupoAdicionalFilters
- GrupoAdicionalStats

2. Composables (app/features/admin/B-admin/cardapio/C-adicionais/composables/)
   useGruposAdicionaisFetch.ts - Busca dados do Supabase
   useGruposAdicionaisActions.ts - CRUD via RPC
   useGruposAdicionaisFilters.ts - Filtros e ordenação
   useGruposAdicionaisModal.ts - Controle de modal
   useGruposAdicionais.ts - Orquestrador principal
3. Componentes (app/features/admin/B-admin/cardapio/C-adicionais/components/)
   GruposAdicionaisCard.vue - Card para modo grid
   GruposAdicionaisList.vue - Item para modo lista
   GruposAdicionaisView.vue - Orquestrador de visualização
   🎨 Configuração de Filtros e Ordenação
   Filtros:

Status: Ativos / Inativos
Obrigatórios / Opcionais
Ordenação:

Nome (A-Z / Z-A)
Mais recentes
Mais antigas
📊 Campos Exibidos nos Cards/Lista
GrupoAdicional:

Nome
Descrição
Badge de status (Ativo/Inativo)
Badge de obrigatoriedade (Obrigatório/Opcional)
Contador de adicionais (ex: "5 itens")
Min/Max seleção (ex: "Min: 0 | Max: 3")
Ações: Editar, Excluir
Informações Computadas:

adicionais_count - Total de adicionais no grupo
adicionais_ativos_count - Total de adicionais ativos
preco_minimo - Menor preço entre os adicionais
preco_maximo - Maior preço entre os adicionais
status_display - "Ativo" ou "Inativo"
obrigatorio_display - "Obrigatório" ou "Opcional"
🔄 Integração com CardapioManager
Atualizar:

CardapioFilters.vue - Adicionar configuração para tab "adicionais"
CardapioManager.vue - Adicionar handlers e integração com useGruposAdicionais
CardapioTabSection.vue - Já está preparado para receber GruposAdicionaisView
✅ Checklist de Implementação
✅ Criar tipos em types/adicional.ts
✅ Criar useGruposAdicionaisFetch.ts
✅ Criar useGruposAdicionaisActions.ts
✅ Criar useGruposAdicionaisFilters.ts
✅ Criar useGruposAdicionaisModal.ts
✅ Criar useGruposAdicionais.ts (orquestrador)
✅ Criar GruposAdicionaisCard.vue
✅ Criar GruposAdicionaisList.vue
✅ Criar GruposAdicionaisView.vue
✅ Integrar em CardapioFilters.vue
✅ Integrar em CardapioManager.vue
✅ Testar funcionalidades
📝 Observações Importantes
Não criar modal ainda - focar apenas na listagem e toggle ativo/inativo
Reutilizar componentes genéricos - CardapioCard e CardapioList já estão prontos
Seguir padrão DRY - Aproveitar estrutura de Categorias e Produtos
Tipos rigorosos - Corresponder exatamente às assinaturas das RPCs
Overflow-x-hidden - Aplicar desde o início em GruposAdicionaisView
