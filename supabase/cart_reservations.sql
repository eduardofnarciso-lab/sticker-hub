-- Tabela de reservas temporárias do carrinho
-- Executar no Supabase → SQL Editor

CREATE TABLE IF NOT EXISTS cart_reservations (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text        NOT NULL,
  sticker_id uuid        NOT NULL REFERENCES stickers(id) ON DELETE CASCADE,
  quantity   int         NOT NULL DEFAULT 1 CHECK (quantity > 0),
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),

  UNIQUE (session_id, sticker_id)
);

-- Índice para consultas rápidas por validade
CREATE INDEX IF NOT EXISTS idx_cart_res_expires ON cart_reservations (expires_at);
CREATE INDEX IF NOT EXISTS idx_cart_res_sticker ON cart_reservations (sticker_id);

-- RLS: público pode inserir/atualizar/deletar suas próprias reservas (por session_id)
ALTER TABLE cart_reservations ENABLE ROW LEVEL SECURITY;

-- Qualquer pessoa (anon) pode gerenciar reservas — controlamos por session_id no app
CREATE POLICY "anon pode inserir reservas"  ON cart_reservations FOR INSERT WITH CHECK (true);
CREATE POLICY "anon pode atualizar reservas" ON cart_reservations FOR UPDATE USING (true);
CREATE POLICY "anon pode deletar reservas"  ON cart_reservations FOR DELETE USING (true);
CREATE POLICY "anon pode ler reservas"      ON cart_reservations FOR SELECT USING (true);

-- Limpeza automática de reservas expiradas (opcional — roda via cron ou manualmente)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- SELECT cron.schedule('limpar-reservas', '*/5 * * * *',
--   $$DELETE FROM cart_reservations WHERE expires_at < now()$$);
