// src/lib/supabase-publico.ts
//
// Cliente Supabase SEM cookies, só com a chave anônima: para ler dados
// públicos (apostilas, notícias, cursos) em páginas que a Vercel guarda em
// cache (ISR). Usar o cliente com cookies (supabase-server.ts) obriga o Next a
// montar a página do zero a cada visita — e isso gastava a cota de CPU.
// Nunca use este cliente para dados do aluno: ele não sabe quem está logado.

import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

export function criarClienteSupabasePublico() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } }
  );
}
