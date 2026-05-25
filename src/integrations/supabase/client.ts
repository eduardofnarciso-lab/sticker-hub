import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Em produção (Docker), as vars são injetadas em runtime via env-config.js → window.__env
// Em desenvolvimento local, usa import.meta.env normalmente
declare global {
  interface Window {
    __env?: Record<string, string>;
  }
}

const SUPABASE_URL = (window.__env?.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL) as string;
const SUPABASE_ANON_KEY = (window.__env?.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) as string;

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true },
});

// Alias para compatibilidade — usa o mesmo cliente anon (permissões liberadas via SQL no banco)
export const supabaseAdmin = supabase;

