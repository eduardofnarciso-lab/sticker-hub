# Figurinhas Copa 2026 — Resumo de Sessão
**Data:** 26/05/2026

---

## ✅ O que foi feito hoje

### Catálogo público
- Ordenação dos grupos e figurinhas pela **sequência exata do álbum** (Intro → Grupos A→L, figurinhas 1→20 numérica)
- Carrinho ordenado por código também

### Banco de dados (Supabase)
- Corrigido `approve_order` — faltava `SECURITY DEFINER` e `SET search_path`
- Corrigida constraint `orders_status_check` — adicionado `'aprovado'` nos valores permitidos (antes só tinha `'pendente'`, `'confirmado'`, `'cancelado'`)
- `pg_cron` habilitado (Extensions) — **PENDENTE: ainda não agendamos o cleanup de cart_reservations**

### n8n
- Workflow **"Figurinhas — Pedido novo → PIX WhatsApp"** configurado e ativado
  - API key da Evolution preenchida nos dois nós (cliente + vendedor)
- Workflow **"Figurinhas — Lista WhatsApp → Verifica Estoque"** importado (configurar ainda)

---

## ⏳ Pendente para amanhã

### 1. pg_cron — limpeza automática de reservas expiradas
Roda no **Supabase → SQL Editor**:
```sql
SELECT cron.schedule(
  'cleanup-cart-reservations',
  '* * * * *',
  $$DELETE FROM cart_reservations WHERE expires_at < NOW()$$
);
```
Confirma com: `SELECT * FROM cron.job;`

### 2. Trigger no Supabase → n8n (workflow PIX)
Roda no **Supabase → SQL Editor**:
```sql
CREATE OR REPLACE FUNCTION notify_n8n_new_order()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://empresaedu-n8n.53lfzc.easypanel.host/webhook/figurinhas-pedido',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := json_build_object('record', row_to_json(NEW))::jsonb
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_order
  AFTER INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION notify_n8n_new_order();
```

### 3. Workflow 2 — Lista WhatsApp → Estoque
No n8n, abrir **"Figurinhas — Lista WhatsApp → Verifica Estoque"** e configurar:
- Nó **"Supabase — Consulta estoque"**: trocar `SUA_SUPABASE_ANON_KEY_AQUI` pela anon key do Supabase
- Nó **"Evolution — Responde lista"**: trocar `SUA_API_KEY_AQUI` pela API key da Evolution
- Ativar o workflow
- Configurar webhook na Evolution API (instância IPC) → POST para:
  `https://empresaedu-n8n.53lfzc.easypanel.host/webhook/figurinhas-lista`

### 4. Testar fluxo completo
- [ ] Cliente faz pedido no catálogo → PIX chega no WhatsApp via n8n
- [ ] Cliente manda lista de códigos no WhatsApp → n8n responde com disponibilidade
- [ ] Vendedor confirma pagamento na tela de Vendas → status muda para Aprovado

---

## 🔑 Referências rápidas

| Item | Valor |
|------|-------|
| App (EasyPanel) | `https://empresaedu.eduprojeto.89.116.74.182.sslip.io` |
| n8n | `https://empresaedu-n8n.53lfzc.easypanel.host` |
| Evolution API | `https://evolutionapi.imctatui.online` |
| Instância Evolution | `IPC` |
| Supabase Project | `ruqkuwnxsjiadkhqfmvx` |
| PIX / WhatsApp vendedor | `5515991460543` |
| Webhook PIX (n8n) | `/webhook/figurinhas-pedido` |
| Webhook Lista (n8n) | `/webhook/figurinhas-lista` |

---

## 🏗️ Arquitetura resumida

```
Cliente (celular)
  → Catálogo SPA (React + TanStack Router)
  → Supabase (stickers, orders, cart_reservations)
  → n8n (trigger via DB function notify_n8n_new_order)
  → Evolution API → WhatsApp do cliente (PIX)
  → WhatsApp do vendedor (aviso de novo pedido)

Cliente manda lista no WhatsApp
  → Evolution API webhook → n8n
  → Supabase (consulta estoque)
  → Evolution API → responde no WhatsApp
```

---

## 🐛 Bugs corrigidos hoje
1. `approve_order` retornava 400 — faltava SECURITY DEFINER
2. `orders_status_check` constraint não incluía `'aprovado'`
3. Catálogo ordenava grupos alfabeticamente — corrigido para ordem do álbum
4. Figurinhas dentro do time ordenavam 1, 10, 11, 2... — corrigido para 1, 2, 3... 20
5. Cart_reservations não limpavam ao fechar o browser — solução: pg_cron (pendente ativar)
