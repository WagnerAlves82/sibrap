// src/lib/redacao-dados.ts
//
// Leituras do Treinamento de Redação com a chave de serviço. Só para Server Components
// e server actions (nunca exportar daqui como action: recebem o id do usuário).

import { criarClienteSupabaseAdmin } from "@/lib/supabase-admin";

/** Apostilas com redação que o aluno tem (id, slug, título). */
export async function apostilasComRedacao(userId: string) {
  const admin = criarClienteSupabaseAdmin();
  const { data: acessos } = await admin.from("acessos").select("produto_id").eq("user_id", userId);
  const ids = (acessos ?? []).map((a) => a.produto_id);
  if (!ids.length) return [];
  const { data } = await admin
    .from("apostilas")
    .select("id, slug, titulo, uf, redacao_nota_max")
    .in("produto_id", ids)
    .eq("tem_redacao", true)
    .order("titulo");
  return data ?? [];
}

export async function saldoRedacao(userId: string): Promise<number | null> {
  const { data, error } = await criarClienteSupabaseAdmin().rpc("saldo_redacao", { p_user: userId });
  if (error) return null;
  return data;
}

