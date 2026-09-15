// src/lib/supabase-admin.ts
//
// ATENÇÃO: usa a Service Role Key — ignora TODAS as regras de
// segurança (RLS) do banco. Só pode ser usado em código que roda no
// SERVIDOR (server actions, route handlers), NUNCA importado em
// Client Components. A variável SUPABASE_SERVICE_ROLE_KEY não tem o
// prefixo NEXT_PUBLIC_ de propósito — isso impede o Next.js de expor
// ela pro navegador.

import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

export function criarClienteSupabaseAdmin() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
