-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Tabela de pedidos
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  buyer_name     text        NOT NULL,
  buyer_whatsapp text        NOT NULL,
  status         text        NOT NULL DEFAULT 'pendente'
                             CHECK (status IN ('pendente', 'confirmado', 'cancelado')),
  total_value    numeric     NOT NULL DEFAULT 0,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id  ON orders (user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status   ON orders (status);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Itens do pedido
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
  id           uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     uuid    NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  sticker_id   uuid    REFERENCES stickers(id) ON DELETE SET NULL,
  sticker_code text,
  sticker_name text,
  quantity     int     NOT NULL DEFAULT 1,
  unit_price   numeric NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items (order_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. RLS
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE orders     ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Vendedor vê/gerencia os próprios pedidos
CREATE POLICY "vendedor vê seus pedidos"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "vendedor atualiza seus pedidos"
  ON orders FOR UPDATE
  USING (auth.uid() = user_id);

-- Anon pode inserir (via RPC SECURITY DEFINER — não precisa de policy direta)
-- Mas deixamos aberta para leitura de itens pelo vendedor autenticado
CREATE POLICY "vendedor vê itens dos seus pedidos"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_id AND o.user_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. RPC place_order  (SECURITY DEFINER — roda como dono da função)
--    Usa user_id (não seller_id) para bater com a tabela orders
-- ─────────────────────────────────────────────────────────────────────────────
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
  -- Cria pedido com status pendente (aguardando confirmação do vendedor)
  INSERT INTO orders (user_id, buyer_name, buyer_whatsapp, status, total_value)
  VALUES (p_seller_id, p_buyer_name, p_buyer_whatsapp, 'pendente', p_total_value)
  RETURNING id INTO v_order_id;

  -- Cria itens e dá baixa no estoque atomicamente
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

    -- Deduz estoque (mínimo 0); só afeta figurinhas do vendedor correto
    UPDATE stickers
    SET quantity = GREATEST(0, quantity - (v_item->>'quantity')::int)
    WHERE id      = (v_item->>'sticker_id')::uuid
      AND user_id = p_seller_id;

  END LOOP;

  RETURN v_order_id;
END;
$$;

-- Permite chamada por clientes não autenticados (catálogo público)
GRANT EXECUTE ON FUNCTION place_order(uuid, text, text, numeric, jsonb) TO anon;
GRANT EXECUTE ON FUNCTION place_order(uuid, text, text, numeric, jsonb) TO authenticated;
