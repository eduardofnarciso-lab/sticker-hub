import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Em produção (Docker/EasyPanel): vars injetadas em runtime via docker-entrypoint.sh → window.__env
// Em desenvolvimento local: import.meta.env (arquivo .env)
declare global {
  interface Window {
    __env?: Record<string, string>;
  }
}

const SUPABASE_URL =
  (typeof window !== 'undefined' && window.__env?.VITE_SUPABASE_URL) ||
  import.meta.env.VITE_SUPABASE_URL ||
  '';

const SUPABASE_ANON_KEY =
  (typeof window !== 'undefined' && window.__env?.VITE_SUPABASE_PUBLISHABLE_KEY) ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn(
    '[Supabase] Variáveis de ambiente não encontradas. ' +
    'Configure VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY no EasyPanel → Environment.'
  );
}

// Usa placeholder para não jogar erro em nível de módulo e travar o app
export const supabase = createClient<Database>(
  SUPABASE_URL || 'https://placeholder.supabase.co',
  SUPABASE_ANON_KEY || 'placeholder-anon-key',
  { auth: { persistSession: true, autoRefreshToken: true } }
);

// Alias para compatibilidade — usa o mesmo cliente anon
export const supabaseAdmin = supabase;
