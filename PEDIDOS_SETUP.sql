-- ═══════════════════════════════════════════════════════════════
--  SISTEMA DE PEDIDOS — Figurinhas Copa 2026
--  Execute no SQL Editor do Supabase
-- ═══════════════════════════════════════════════════════════════

-- Tabela principal de pedidos
CREATE TABLE IF NOT EXISTS public.orders (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_name    text        NOT NULL,
  buyer_whatsapp text       NOT NULL,
  status        text        NOT NULL DEFAULT 'pendente',
    -- pendente: aguardando aprovação do vendedor
    -- aprovado: confirmado, estoque debitado
    -- cancelado: rejeitado, estoque restaurado
  total_value   numeric(10,2) DEFAULT 0,
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- Itens de cada pedido
CREATE TABLE IF NOT EXISTS public.order_items (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      uuid        NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  sticker_id    uuid        REFERENCES public.stickers(id),
  sticker_code  text,
  sticker_name  text,
  quantity      int         NOT NULL DEFAULT 1,
  unit_price    numeric(10,2) DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS orders_status_idx ON public.orders(status);
CREATE INDEX IF NOT EXISTS orders_created_at_idx ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON public.order_items(order_id);

-- Desabilita RLS (uso interno)
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items DISABLE ROW LEVEL SECURITY;

-- ── Função: aprovar pedido ────────────────────────────────────────────
-- Debita estoque e marca pedido como aprovado
CREATE OR REPLACE FUNCTION public.approve_order(p_order_id uuid)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  item RECORD;
BEGIN
  -- Verifica se pedido existe e está pendente
  IF NOT EXISTS (
    SELECT 1 FROM orders WHERE id = p_order_id AND status = 'pendente'
  ) THEN
    RAISE EXCEPTION 'Pedido não encontrado ou já processado';
  END IF;

  -- Debita estoque de cada item
  FOR item IN
    SELECT sticker_id, quantity FROM order_items WHERE order_id = p_order_id
  LOOP
    UPDATE stickers
    SET quantity = GREATEST(0, quantity - item.quantity)
    WHERE id = item.sticker_id;
  END LOOP;

  -- Marca pedido como aprovado
  UPDATE orders
  SET status = 'aprovado', updated_at = now()
  WHERE id = p_order_id;
END;
$$;

-- ── Função: cancelar pedido ───────────────────────────────────────────
-- Restaura estoque e marca pedido como cancelado
CREATE OR REPLACE FUNCTION public.cancel_order(p_order_id uuid)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM orders WHERE id = p_order_id AND status = 'pendente'
  ) THEN
    RAISE EXCEPTION 'Pedido não encontrado ou já processado';
  END IF;

  -- Marca como cancelado (estoque já não foi debitado no pendente)
  UPDATE orders
  SET status = 'cancelado', updated_at = now()
  WHERE id = p_order_id;
END;
$$;

-- ── Verificação ───────────────────────────────────────────────────────
SELECT 'Tabelas orders e order_items criadas com sucesso!' as resultado;
