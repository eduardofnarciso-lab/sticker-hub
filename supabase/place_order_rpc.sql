-- RPC: place_order
-- Cria pedido + itens + dá baixa no estoque atomicamente.
-- SECURITY DEFINER para que clientes anônimos consigam executar a operação.
-- Executar no Supabase → SQL Editor

CREATE OR REPLACE FUNCTION place_order(
  p_seller_id      uuid,
  p_buyer_name     text,
  p_buyer_whatsapp text,
  p_total_value    numeric,
  p_items          jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id uuid;
  v_item     jsonb;
BEGIN
  -- 1. Cria o pedido (status pendente = aguardando confirmação do vendedor)
  INSERT INTO orders (seller_id, buyer_name, buyer_whatsapp, status, total_value)
  VALUES (p_seller_id, p_buyer_name, p_buyer_whatsapp, 'pendente', p_total_value)
  RETURNING id INTO v_order_id;

  -- 2. Para cada item: insere order_item e deduz do estoque
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP

    INSERT INTO order_items (
      order_id, sticker_id, sticker_code, sticker_name, quantity, unit_price
    ) VALUES (
      v_order_id,
      (v_item->>'sticker_id')::uuid,
       v_item->>'sticker_code',
       v_item->>'sticker_name',
      (v_item->>'quantity')::int,
      (v_item->>'unit_price')::numeric
    );

    -- Deduz quantidade (mínimo 0) — confirma que a figurinha pertence ao vendedor
    UPDATE stickers
    SET quantity = GREATEST(0, quantity - (v_item->>'quantity')::int)
    WHERE id      = (v_item->>'sticker_id')::uuid
      AND user_id = p_seller_id;

  END LOOP;

  RETURN v_order_id;
END;
$$;

-- Permite chamada pelo cliente anônimo (catálogo público)
GRANT EXECUTE ON FUNCTION place_order(uuid, text, text, numeric, jsonb) TO anon;
GRANT EXECUTE ON FUNCTION place_order(uuid, text, text, numeric, jsonb) TO authenticated;
