// Validação de sessão do admin que consulta o banco (revogação global).
// Fica separada de admin-auth.ts (só HMAC) e sem next/headers para poder ser
// usada pelo proxy.

import { criarClienteSupabaseAdmin } from "@/lib/supabase-admin";
import { SESSAO_MS, tokenAdminValido } from "@/lib/admin-auth";

let cache: { valor: number; ate: number } | null = null;

/** Momento a partir do qual as sessões valem (o "encerrar todas as sessões"). */
export async function sessoesValidasDesde(forcar = false): Promise<number> {
  if (!forcar && cache && cache.ate > Date.now()) return cache.valor;
  const { data } = await criarClienteSupabaseAdmin()
    .from("admin_config")
    .select("sessoes_validas_desde")
    .eq("id", true)
    .maybeSingle();
  const valor = data ? new Date(data.sessoes_validas_desde).getTime() : 0;
  cache = { valor, ate: Date.now() + 15_000 };
  return valor;
}

export function invalidarCacheDeSessoes() {
  cache = null;
}

/** Instante em que a sessão foi criada (a validade é fixa, então dá para derivar). */
export function emissaoDoToken(token: string): number {
  const expira = Number(token.split(".")[0]);
  return expira - SESSAO_MS;
}

/** Assinatura válida, dentro do prazo e emitida depois da última revogação. */
export async function sessaoAdminValida(token: string | undefined | null): Promise<boolean> {
  if (!tokenAdminValido(token)) return false;
  try {
    return emissaoDoToken(token!) >= (await sessoesValidasDesde());
  } catch {
    return false; // sem banco, sem admin: falha fechada
  }
}
