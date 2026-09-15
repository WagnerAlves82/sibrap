// src/lib/supabase-server.ts
//
// Cliente Supabase usado em Server Components e Server Actions (roda
// no servidor, lê/escreve os cookies de sessão).

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./database.types";

export async function criarClienteSupabaseServer() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesParaSalvar) {
          try {
            cookiesParaSalvar.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Chamado de dentro de um Server Component — pode ser
            // ignorado se já existe um proxy renovando a sessão
          }
        },
      },
    }
  );
}
