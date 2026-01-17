-- Adiciona campo permite_multiplas_unidades na tabela adicionais
-- Este campo controla se o adicional pode ter quantidade > 1 no cardápio público

ALTER TABLE adicionais
ADD COLUMN permite_multiplas_unidades BOOLEAN NOT NULL DEFAULT false;

-- Comentário explicativo
COMMENT ON COLUMN adicionais.permite_multiplas_unidades IS 'Define se o adicional permite seleção de múltiplas unidades (ex: 2x queijo, 3x bacon). Se false, só permite 1 unidade.';
