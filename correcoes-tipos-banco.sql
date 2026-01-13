-- ========================================
-- CORREÇÕES DE TIPOS NO BANCO DE DADOS
-- ========================================

-- PASSO 1: Dropar views que dependem das colunas que vamos alterar
DROP VIEW IF EXISTS vw_banners_por_tipo;
DROP VIEW IF EXISTS vw_cupons_estatisticas;

-- PASSO 2: Criar ENUMs que estão como VARCHAR com CHECK constraints
DO $$ 
BEGIN
    -- Criar tipo_cupom se não existir
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_cupom') THEN
        CREATE TYPE tipo_cupom AS ENUM ('percentual', 'valor_fixo', 'frete_gratis');
    END IF;
    
    -- Criar tipo_banner se não existir
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_banner') THEN
        CREATE TYPE tipo_banner AS ENUM ('carrossel', 'destaque', 'popup');
    END IF;
    
    -- Criar tipo_conteudo_banner se não existir
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_conteudo_banner') THEN
        CREATE TYPE tipo_conteudo_banner AS ENUM ('imagem', 'texto', 'misto');
    END IF;
    
    -- Criar tipo_posicao_texto se não existir
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_posicao_texto') THEN
        CREATE TYPE tipo_posicao_texto AS ENUM ('centro', 'esquerda', 'direita', 'superior', 'inferior');
    END IF;
    
    -- Criar tipo_promocao se não existir
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_promocao') THEN
        CREATE TYPE tipo_promocao AS ENUM ('desconto_produto', 'desconto_categoria', 'combo_promocional', 'leve_pague');
    END IF;
END $$;

-- PASSO 3: Alterar campos VARCHAR para TEXT onde apropriado (sem defaults)
ALTER TABLE banners 
  ALTER COLUMN titulo TYPE text,
  ALTER COLUMN texto_cta TYPE text;

ALTER TABLE promocoes 
  ALTER COLUMN nome TYPE text;

-- PASSO 4: Remover defaults temporariamente das colunas que vão virar ENUMs
ALTER TABLE banners 
  ALTER COLUMN tipo DROP DEFAULT,
  ALTER COLUMN tipo_conteudo DROP DEFAULT,
  ALTER COLUMN texto_posicao DROP DEFAULT;

-- PASSO 5: Alterar campos VARCHAR para ENUMs (agora sem defaults)
-- CUPONS (não tem default, pode converter direto)
ALTER TABLE cupons 
  ALTER COLUMN tipo TYPE tipo_cupom USING tipo::tipo_cupom;

-- BANNERS (agora sem defaults)
ALTER TABLE banners 
  ALTER COLUMN tipo TYPE tipo_banner USING tipo::tipo_banner,
  ALTER COLUMN tipo_conteudo TYPE tipo_conteudo_banner USING 
    CASE 
      WHEN tipo_conteudo = 'imagem_texto' THEN 'misto'::tipo_conteudo_banner
      ELSE tipo_conteudo::tipo_conteudo_banner 
    END,
  ALTER COLUMN texto_posicao TYPE tipo_posicao_texto USING 
    CASE 
      WHEN texto_posicao = 'center' THEN 'centro'::tipo_posicao_texto
      WHEN texto_posicao = 'top-left' THEN 'superior'::tipo_posicao_texto
      WHEN texto_posicao = 'top-center' THEN 'superior'::tipo_posicao_texto
      WHEN texto_posicao = 'top-right' THEN 'superior'::tipo_posicao_texto
      WHEN texto_posicao = 'center-left' THEN 'esquerda'::tipo_posicao_texto
      WHEN texto_posicao = 'center-right' THEN 'direita'::tipo_posicao_texto
      WHEN texto_posicao = 'bottom-left' THEN 'inferior'::tipo_posicao_texto
      WHEN texto_posicao = 'bottom-center' THEN 'inferior'::tipo_posicao_texto
      WHEN texto_posicao = 'bottom-right' THEN 'inferior'::tipo_posicao_texto
      ELSE 'centro'::tipo_posicao_texto
    END;

-- PROMOÇÕES (não tem default, pode converter direto)
ALTER TABLE promocoes 
  ALTER COLUMN tipo TYPE tipo_promocao USING 
    CASE 
      WHEN tipo = 'combo' THEN 'combo_promocional'::tipo_promocao
      ELSE tipo::tipo_promocao 
    END;

-- PASSO 6: Recriar os defaults com os novos tipos ENUMs
ALTER TABLE banners 
  ALTER COLUMN tipo SET DEFAULT 'carrossel'::tipo_banner,
  ALTER COLUMN tipo_conteudo SET DEFAULT 'imagem'::tipo_conteudo_banner,
  ALTER COLUMN texto_posicao SET DEFAULT 'centro'::tipo_posicao_texto;

-- PASSO 7: Remover CHECK constraints antigos (agora desnecessários com ENUMs)
ALTER TABLE cupons DROP CONSTRAINT IF EXISTS cupons_tipo_check;
ALTER TABLE banners DROP CONSTRAINT IF EXISTS banners_tipo_check;
ALTER TABLE banners DROP CONSTRAINT IF EXISTS banners_tipo_conteudo_check;
ALTER TABLE banners DROP CONSTRAINT IF EXISTS banners_texto_posicao_check;
ALTER TABLE promocoes DROP CONSTRAINT IF EXISTS promocoes_tipo_check;

-- PASSO 8: Recriar as views que foram dropadas
CREATE VIEW vw_banners_por_tipo AS
SELECT 
    b.estabelecimento_id,
    b.tipo,
    b.id,
    b.titulo,
    b.descricao,
    b.imagem_url,
    b.link_url,
    b.texto_cta,
    b.tipo_conteudo,
    b.cor_fundo,
    b.cor_texto,
    b.texto_posicao,
    b.texto_cor_fundo,
    b.ordem,
    b.ativo,
    b.created_at,
    b.updated_at,
    e.nome AS estabelecimento_nome,
    row_number() OVER (PARTITION BY b.estabelecimento_id, b.tipo ORDER BY b.ordem, b.created_at) AS ranking_tipo
FROM banners b
JOIN estabelecimentos e ON e.id = b.estabelecimento_id
WHERE b.ativo = true
ORDER BY b.estabelecimento_id, b.tipo, b.ordem;

CREATE VIEW vw_cupons_estatisticas AS
SELECT 
    cp.id,
    cp.estabelecimento_id,
    cp.codigo,
    cp.descricao,
    cp.tipo,
    cp.valor_desconto,
    cp.valor_minimo,
    cp.limite_uso,
    cp.usos_realizados,
    cp.data_expiracao,
    cp.ativo,
    cp.ordem,
    cp.created_at,
    e.nome AS estabelecimento_nome,
    CASE
        WHEN NOT cp.ativo THEN 'inativo'::text
        WHEN cp.data_expiracao IS NOT NULL AND cp.data_expiracao < now() THEN 'expirado'::text
        WHEN cp.limite_uso IS NOT NULL AND cp.usos_realizados >= cp.limite_uso THEN 'esgotado'::text
        ELSE 'ativo'::text
    END AS status_cupom,
    CASE
        WHEN cp.limite_uso IS NOT NULL THEN cp.limite_uso - cp.usos_realizados
        ELSE NULL::integer
    END AS usos_restantes,
    CASE
        WHEN cp.limite_uso IS NOT NULL AND cp.limite_uso > 0 THEN round(cp.usos_realizados::numeric / cp.limite_uso::numeric * 100::numeric, 2)
        ELSE NULL::numeric
    END AS percentual_uso,
    CASE
        WHEN cp.data_expiracao IS NULL THEN true
        ELSE cp.data_expiracao >= now()
    END AS periodo_valido
FROM cupons cp
JOIN estabelecimentos e ON e.id = cp.estabelecimento_id
ORDER BY cp.estabelecimento_id, cp.ordem, cp.created_at DESC;