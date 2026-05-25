-- ═══════════════════════════════════════════════════════════════════════
--  ORDERS SETUP — Pedidos do Catálogo Público
--  Cole e rode no SQL Editor do Supabase
-- ═══════════════════════════════════════════════════════════════════════

-- 1. Tabela de pedidos
CREATE TABLE IF NOT EXISTS public.orders (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id       uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  buyer_name      text NOT NULL,
  buyer_whatsapp  text NOT NULL,
  status          text NOT NULL DEFAULT 'pendente'
                    CHECK (status IN ('pendente', 'aprovado', 'cancelado')),
  total_value     numeric(10,2) NOT NULL DEFAULT 0,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- 2. Itens do pedido
CREATE TABLE IF NOT EXISTS public.order_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  sticker_id      uuid REFERENCES public.stickers(id) ON DELETE SET NULL,
  sticker_code    text,
  sticker_name    text,
  quantity        integer NOT NULL DEFAULT 1,
  unit_price      numeric(10,2) NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- 3. Índices de performance
CREATE INDEX IF NOT EXISTS orders_seller_id_idx ON public.orders(seller_id);
CREATE INDEX IF NOT EXISTS orders_status_idx    ON public.orders(status);
CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON public.order_items(order_id);

-- 4. RPC: Aprovar pedido e debitar estoque
CREATE OR REPLACE FUNCTION public.approve_order(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item record;
  new_qty integer;
BEGIN
  -- Atualiza status do pedido
  UPDATE public.orders SET status = 'aprovado' WHERE id = p_order_id;

  -- Debita estoque de cada item
  FOR item IN
    SELECT * FROM public.order_items WHERE order_id = p_order_id
  LOOP
    SELECT quantity INTO new_qty
      FROM public.stickers WHERE id = item.sticker_id;

    new_qty := GREATEST(0, COALESCE(new_qty, 0) - item.quantity);

    UPDATE public.stickers
      SET quantity = new_qty,
          status   = CASE WHEN new_qty = 0 THEN 'vendida' ELSE 'disponivel' END
    WHERE id = item.sticker_id;
  END LOOP;
END;
$$;

-- 5. RPC: Cancelar pedido
CREATE OR REPLACE FUNCTION public.cancel_order(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.orders SET status = 'cancelado' WHERE id = p_order_id;
END;
$$;

-- 6. RLS
ALTER TABLE public.orders      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Vendedor vê seus pedidos
DROP POLICY IF EXISTS "orders_seller"      ON public.orders;
DROP POLICY IF EXISTS "orders_admin"       ON public.orders;
DROP POLICY IF EXISTS "order_items_seller" ON public.order_items;

CREATE POLICY "orders_seller" ON public.orders
  FOR ALL USING (auth.uid() = seller_id);

CREATE POLICY "orders_admin" ON public.orders
  FOR ALL USING (public.is_admin());

-- Itens: visíveis se o usuário for dono do pedido
CREATE POLICY "order_items_seller" ON public.order_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
        AND (orders.seller_id = auth.uid() OR public.is_admin())
    )
  );

-- Anon pode INSERIR pedidos (catálogo público)
DROP POLICY IF EXISTS "orders_public_insert"      ON public.orders;
DROP POLICY IF EXISTS "order_items_public_insert" ON public.order_items;

CREATE POLICY "orders_public_insert" ON public.orders
  FOR INSERT WITH CHECK (true);

CREATE POLICY "order_items_public_insert" ON public.order_items
  FOR INSERT WITH CHECK (true);

-- Grants
GRANT ALL ON public.orders      TO authenticated;
GRANT ALL ON public.order_items TO authenticated;
GRANT INSERT ON public.orders      TO anon;
GRANT INSERT ON public.order_items TO anon;
GRANT SELECT ON public.orders      TO anon;
GRANT SELECT ON public.order_items TO anon;
