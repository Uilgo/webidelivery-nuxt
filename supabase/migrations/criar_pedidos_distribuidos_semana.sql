-- =====================================================
-- Migração: Criar Pedidos Distribuídos pela Semana
-- =====================================================
-- Objetivo: Criar pedidos variados em diferentes dias da semana
--           para melhorar visualização do gráfico de Faturamento
-- Data: 2026-01-19
-- =====================================================

-- Buscar IDs necessários
DO $$
DECLARE
    v_estabelecimento_id UUID;
    v_cliente_ids UUID[];
    v_produto_ids UUID[];
    v_variacao_ids UUID[];
    v_endereco_id UUID;
    v_dia_offset INT;
    v_hora INT;
    v_minuto INT;
    v_timestamp TIMESTAMPTZ;
    v_pedido_id UUID;
    v_item_id UUID;
    v_total DECIMAL(10,2);
    v_status TEXT;
    v_aceito_em TIMESTAMPTZ;
    v_preparo_em TIMESTAMPTZ;
    v_pronto_em TIMESTAMPTZ;
    v_entrega_em TIMESTAMPTZ;
    v_concluido_em TIMESTAMPTZ;
BEGIN
    -- Buscar estabelecimento
    SELECT id INTO v_estabelecimento_id
    FROM estabelecimentos
    LIMIT 1;

    IF v_estabelecimento_id IS NULL THEN
        RAISE EXCEPTION 'Nenhum estabelecimento encontrado';
    END IF;

    -- Buscar clientes (array) através dos pedidos existentes
    SELECT ARRAY_AGG(DISTINCT cliente_id) INTO v_cliente_ids
    FROM pedidos
    WHERE estabelecimento_id = v_estabelecimento_id
    AND cliente_id IS NOT NULL
    LIMIT 10;

    -- Buscar produtos e variações
    SELECT ARRAY_AGG(p.id) INTO v_produto_ids
    FROM produtos p
    WHERE p.estabelecimento_id = v_estabelecimento_id
    AND p.ativo = true;

    SELECT ARRAY_AGG(v.id) INTO v_variacao_ids
    FROM variacoes v
    JOIN produtos p ON v.produto_id = p.id
    WHERE p.estabelecimento_id = v_estabelecimento_id
    AND v.ativo = true;

    -- Buscar endereço de entrega
    SELECT id INTO v_endereco_id
    FROM enderecos_entrega
    WHERE cliente_id = v_cliente_ids[1]
    LIMIT 1;

    RAISE NOTICE '=== Criando pedidos distribuídos pela semana ===';
    RAISE NOTICE 'Estabelecimento: %', v_estabelecimento_id;
    RAISE NOTICE 'Clientes: %', array_length(v_cliente_ids, 1);
    RAISE NOTICE 'Produtos: %', array_length(v_produto_ids, 1);

    -- =====================================================
    -- SEGUNDA-FEIRA (hoje - 6 dias): 8 pedidos
    -- =====================================================
    FOR i IN 1..8 LOOP
        v_dia_offset := 6;
        v_hora := 18 + (i % 5); -- 18h-22h
        v_minuto := (i * 7) % 60;
        v_timestamp := (CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo' - INTERVAL '6 days')::DATE 
                      + (v_hora || ' hours')::INTERVAL 
                      + (v_minuto || ' minutes')::INTERVAL;
        
        v_total := 35.00 + (i * 5.50);
        v_status := 'concluido';
        
        -- Timestamps intermediários
        v_aceito_em := v_timestamp + INTERVAL '2 minutes';
        v_preparo_em := v_aceito_em + INTERVAL '3 minutes';
        v_pronto_em := v_preparo_em + INTERVAL '18 minutes';
        v_entrega_em := v_pronto_em + INTERVAL '5 minutes';
        v_concluido_em := v_entrega_em + INTERVAL '25 minutes';

        INSERT INTO pedidos (
            estabelecimento_id, cliente_id, endereco_entrega_id,
            numero, status, tipo_entrega, metodo_pagamento,
            subtotal, taxa_entrega, total,
            created_at, aceito_em, preparo_em, pronto_em, entrega_em, concluido_em
        ) VALUES (
            v_estabelecimento_id,
            v_cliente_ids[1 + (i % array_length(v_cliente_ids, 1))],
            v_endereco_id,
            1000 + i,
            v_status,
            'delivery',
            CASE (i % 4)
                WHEN 0 THEN 'dinheiro'
                WHEN 1 THEN 'pix'
                WHEN 2 THEN 'credito'
                ELSE 'debito'
            END,
            v_total - 5.00,
            5.00,
            v_total,
            v_timestamp,
            v_aceito_em,
            v_preparo_em,
            v_pronto_em,
            v_entrega_em,
            v_concluido_em
        ) RETURNING id INTO v_pedido_id;

        -- Adicionar item ao pedido
        INSERT INTO pedidos_itens (
            pedido_id, variacao_id, quantidade, preco_unitario, subtotal
        ) VALUES (
            v_pedido_id,
            v_variacao_ids[1 + (i % array_length(v_variacao_ids, 1))],
            1 + (i % 3),
            v_total / (1 + (i % 3)),
            v_total - 5.00
        );
    END LOOP;

    -- =====================================================
    -- TERÇA-FEIRA (hoje - 5 dias): 6 pedidos
    -- =====================================================
    FOR i IN 1..6 LOOP
        v_dia_offset := 5;
        v_hora := 19 + (i % 4);
        v_minuto := (i * 11) % 60;
        v_timestamp := (CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo' - INTERVAL '5 days')::DATE 
                      + (v_hora || ' hours')::INTERVAL 
                      + (v_minuto || ' minutes')::INTERVAL;
        
        v_total := 42.00 + (i * 6.00);
        v_status := 'concluido';
        
        v_aceito_em := v_timestamp + INTERVAL '1 minute';
        v_preparo_em := v_aceito_em + INTERVAL '4 minutes';
        v_pronto_em := v_preparo_em + INTERVAL '20 minutes';
        v_entrega_em := v_pronto_em + INTERVAL '4 minutes';
        v_concluido_em := v_entrega_em + INTERVAL '28 minutes';

        INSERT INTO pedidos (
            estabelecimento_id, cliente_id, endereco_entrega_id,
            numero, status, tipo_entrega, metodo_pagamento,
            subtotal, taxa_entrega, total,
            created_at, aceito_em, preparo_em, pronto_em, entrega_em, concluido_em
        ) VALUES (
            v_estabelecimento_id,
            v_cliente_ids[1 + (i % array_length(v_cliente_ids, 1))],
            v_endereco_id,
            2000 + i,
            v_status,
            'delivery',
            CASE (i % 3) WHEN 0 THEN 'pix' WHEN 1 THEN 'credito' ELSE 'dinheiro' END,
            v_total - 5.00,
            5.00,
            v_total,
            v_timestamp,
            v_aceito_em,
            v_preparo_em,
            v_pronto_em,
            v_entrega_em,
            v_concluido_em
        ) RETURNING id INTO v_pedido_id;

        INSERT INTO pedidos_itens (
            pedido_id, variacao_id, quantidade, preco_unitario, subtotal
        ) VALUES (
            v_pedido_id,
            v_variacao_ids[1 + (i % array_length(v_variacao_ids, 1))],
            2,
            (v_total - 5.00) / 2,
            v_total - 5.00
        );
    END LOOP;

    -- =====================================================
    -- QUARTA-FEIRA (hoje - 4 dias): 10 pedidos
    -- =====================================================
    FOR i IN 1..10 LOOP
        v_dia_offset := 4;
        v_hora := 18 + (i % 5);
        v_minuto := (i * 6) % 60;
        v_timestamp := (CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo' - INTERVAL '4 days')::DATE 
                      + (v_hora || ' hours')::INTERVAL 
                      + (v_minuto || ' minutes')::INTERVAL;
        
        v_total := 38.00 + (i * 4.50);
        v_status := 'concluido';
        
        v_aceito_em := v_timestamp + INTERVAL '2 minutes';
        v_preparo_em := v_aceito_em + INTERVAL '3 minutes';
        v_pronto_em := v_preparo_em + INTERVAL '22 minutes';
        v_entrega_em := v_pronto_em + INTERVAL '6 minutes';
        v_concluido_em := v_entrega_em + INTERVAL '30 minutes';

        INSERT INTO pedidos (
            estabelecimento_id, cliente_id, endereco_entrega_id,
            numero, status, tipo_entrega, metodo_pagamento,
            subtotal, taxa_entrega, total,
            created_at, aceito_em, preparo_em, pronto_em, entrega_em, concluido_em
        ) VALUES (
            v_estabelecimento_id,
            v_cliente_ids[1 + (i % array_length(v_cliente_ids, 1))],
            v_endereco_id,
            3000 + i,
            v_status,
            'delivery',
            CASE (i % 4) WHEN 0 THEN 'credito' WHEN 1 THEN 'pix' WHEN 2 THEN 'debito' ELSE 'dinheiro' END,
            v_total - 5.00,
            5.00,
            v_total,
            v_timestamp,
            v_aceito_em,
            v_preparo_em,
            v_pronto_em,
            v_entrega_em,
            v_concluido_em
        ) RETURNING id INTO v_pedido_id;

        INSERT INTO pedidos_itens (
            pedido_id, variacao_id, quantidade, preco_unitario, subtotal
        ) VALUES (
            v_pedido_id,
            v_variacao_ids[1 + (i % array_length(v_variacao_ids, 1))],
            1 + (i % 2),
            (v_total - 5.00) / (1 + (i % 2)),
            v_total - 5.00
        );
    END LOOP;

    -- =====================================================
    -- QUINTA-FEIRA (hoje - 3 dias): 7 pedidos
    -- =====================================================
    FOR i IN 1..7 LOOP
        v_dia_offset := 3;
        v_hora := 19 + (i % 4);
        v_minuto := (i * 9) % 60;
        v_timestamp := (CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo' - INTERVAL '3 days')::DATE 
                      + (v_hora || ' hours')::INTERVAL 
                      + (v_minuto || ' minutes')::INTERVAL;
        
        v_total := 45.00 + (i * 5.00);
        v_status := 'concluido';
        
        v_aceito_em := v_timestamp + INTERVAL '1 minute';
        v_preparo_em := v_aceito_em + INTERVAL '4 minutes';
        v_pronto_em := v_preparo_em + INTERVAL '19 minutes';
        v_entrega_em := v_pronto_em + INTERVAL '5 minutes';
        v_concluido_em := v_entrega_em + INTERVAL '27 minutes';

        INSERT INTO pedidos (
            estabelecimento_id, cliente_id, endereco_entrega_id,
            numero, status, tipo_entrega, metodo_pagamento,
            subtotal, taxa_entrega, total,
            created_at, aceito_em, preparo_em, pronto_em, entrega_em, concluido_em
        ) VALUES (
            v_estabelecimento_id,
            v_cliente_ids[1 + (i % array_length(v_cliente_ids, 1))],
            v_endereco_id,
            4000 + i,
            v_status,
            'delivery',
            CASE (i % 3) WHEN 0 THEN 'pix' WHEN 1 THEN 'credito' ELSE 'debito' END,
            v_total - 5.00,
            5.00,
            v_total,
            v_timestamp,
            v_aceito_em,
            v_preparo_em,
            v_pronto_em,
            v_entrega_em,
            v_concluido_em
        ) RETURNING id INTO v_pedido_id;

        INSERT INTO pedidos_itens (
            pedido_id, variacao_id, quantidade, preco_unitario, subtotal
        ) VALUES (
            v_pedido_id,
            v_variacao_ids[1 + (i % array_length(v_variacao_ids, 1))],
            2,
            (v_total - 5.00) / 2,
            v_total - 5.00
        );
    END LOOP;

    -- =====================================================
    -- SEXTA-FEIRA (hoje - 2 dias): 12 pedidos (dia de pico!)
    -- =====================================================
    FOR i IN 1..12 LOOP
        v_dia_offset := 2;
        v_hora := 18 + (i % 6);
        v_minuto := (i * 5) % 60;
        v_timestamp := (CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo' - INTERVAL '2 days')::DATE 
                      + (v_hora || ' hours')::INTERVAL 
                      + (v_minuto || ' minutes')::INTERVAL;
        
        v_total := 50.00 + (i * 7.00);
        v_status := 'concluido';
        
        v_aceito_em := v_timestamp + INTERVAL '2 minutes';
        v_preparo_em := v_aceito_em + INTERVAL '5 minutes';
        v_pronto_em := v_preparo_em + INTERVAL '25 minutes';
        v_entrega_em := v_pronto_em + INTERVAL '7 minutes';
        v_concluido_em := v_entrega_em + INTERVAL '32 minutes';

        INSERT INTO pedidos (
            estabelecimento_id, cliente_id, endereco_entrega_id,
            numero, status, tipo_entrega, metodo_pagamento,
            subtotal, taxa_entrega, total,
            created_at, aceito_em, preparo_em, pronto_em, entrega_em, concluido_em
        ) VALUES (
            v_estabelecimento_id,
            v_cliente_ids[1 + (i % array_length(v_cliente_ids, 1))],
            v_endereco_id,
            5000 + i,
            v_status,
            'delivery',
            CASE (i % 4) WHEN 0 THEN 'credito' WHEN 1 THEN 'pix' WHEN 2 THEN 'debito' ELSE 'dinheiro' END,
            v_total - 5.00,
            5.00,
            v_total,
            v_timestamp,
            v_aceito_em,
            v_preparo_em,
            v_pronto_em,
            v_entrega_em,
            v_concluido_em
        ) RETURNING id INTO v_pedido_id;

        INSERT INTO pedidos_itens (
            pedido_id, variacao_id, quantidade, preco_unitario, subtotal
        ) VALUES (
            v_pedido_id,
            v_variacao_ids[1 + (i % array_length(v_variacao_ids, 1))],
            2 + (i % 2),
            (v_total - 5.00) / (2 + (i % 2)),
            v_total - 5.00
        );
    END LOOP;

    -- =====================================================
    -- SÁBADO (ontem): 9 pedidos
    -- =====================================================
    FOR i IN 1..9 LOOP
        v_dia_offset := 1;
        v_hora := 19 + (i % 5);
        v_minuto := (i * 7) % 60;
        v_timestamp := (CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo' - INTERVAL '1 day')::DATE 
                      + (v_hora || ' hours')::INTERVAL 
                      + (v_minuto || ' minutes')::INTERVAL;
        
        v_total := 40.00 + (i * 6.50);
        v_status := 'concluido';
        
        v_aceito_em := v_timestamp + INTERVAL '1 minute';
        v_preparo_em := v_aceito_em + INTERVAL '3 minutes';
        v_pronto_em := v_preparo_em + INTERVAL '21 minutes';
        v_entrega_em := v_pronto_em + INTERVAL '6 minutes';
        v_concluido_em := v_entrega_em + INTERVAL '29 minutes';

        INSERT INTO pedidos (
            estabelecimento_id, cliente_id, endereco_entrega_id,
            numero, status, tipo_entrega, metodo_pagamento,
            subtotal, taxa_entrega, total,
            created_at, aceito_em, preparo_em, pronto_em, entrega_em, concluido_em
        ) VALUES (
            v_estabelecimento_id,
            v_cliente_ids[1 + (i % array_length(v_cliente_ids, 1))],
            v_endereco_id,
            6000 + i,
            v_status,
            'delivery',
            CASE (i % 3) WHEN 0 THEN 'pix' WHEN 1 THEN 'credito' ELSE 'dinheiro' END,
            v_total - 5.00,
            5.00,
            v_total,
            v_timestamp,
            v_aceito_em,
            v_preparo_em,
            v_pronto_em,
            v_entrega_em,
            v_concluido_em
        ) RETURNING id INTO v_pedido_id;

        INSERT INTO pedidos_itens (
            pedido_id, variacao_id, quantidade, preco_unitario, subtotal
        ) VALUES (
            v_pedido_id,
            v_variacao_ids[1 + (i % array_length(v_variacao_ids, 1))],
            1 + (i % 3),
            (v_total - 5.00) / (1 + (i % 3)),
            v_total - 5.00
        );
    END LOOP;

    -- =====================================================
    -- DOMINGO (hoje): 5 pedidos (dia mais fraco)
    -- =====================================================
    FOR i IN 1..5 LOOP
        v_hora := 19 + (i % 3);
        v_minuto := (i * 12) % 60;
        v_timestamp := CURRENT_DATE AT TIME ZONE 'America/Sao_Paulo'
                      + (v_hora || ' hours')::INTERVAL 
                      + (v_minuto || ' minutes')::INTERVAL;
        
        v_total := 35.00 + (i * 8.00);
        v_status := 'concluido';
        
        v_aceito_em := v_timestamp + INTERVAL '2 minutes';
        v_preparo_em := v_aceito_em + INTERVAL '4 minutes';
        v_pronto_em := v_preparo_em + INTERVAL '18 minutes';
        v_entrega_em := v_pronto_em + INTERVAL '5 minutes';
        v_concluido_em := v_entrega_em + INTERVAL '26 minutes';

        INSERT INTO pedidos (
            estabelecimento_id, cliente_id, endereco_entrega_id,
            numero, status, tipo_entrega, metodo_pagamento,
            subtotal, taxa_entrega, total,
            created_at, aceito_em, preparo_em, pronto_em, entrega_em, concluido_em
        ) VALUES (
            v_estabelecimento_id,
            v_cliente_ids[1 + (i % array_length(v_cliente_ids, 1))],
            v_endereco_id,
            7000 + i,
            v_status,
            'delivery',
            CASE (i % 2) WHEN 0 THEN 'pix' ELSE 'credito' END,
            v_total - 5.00,
            5.00,
            v_total,
            v_timestamp,
            v_aceito_em,
            v_preparo_em,
            v_pronto_em,
            v_entrega_em,
            v_concluido_em
        ) RETURNING id INTO v_pedido_id;

        INSERT INTO pedidos_itens (
            pedido_id, variacao_id, quantidade, preco_unitario, subtotal
        ) VALUES (
            v_pedido_id,
            v_variacao_ids[1 + (i % array_length(v_variacao_ids, 1))],
            1,
            v_total - 5.00,
            v_total - 5.00
        );
    END LOOP;

    RAISE NOTICE '=== ✅ Pedidos criados com sucesso! ===';
    RAISE NOTICE 'Segunda: 8 pedidos | Terça: 6 | Quarta: 10 | Quinta: 7';
    RAISE NOTICE 'Sexta: 12 (pico!) | Sábado: 9 | Domingo: 5';
    RAISE NOTICE 'Total: 57 novos pedidos distribuídos pela semana';
END $$;
