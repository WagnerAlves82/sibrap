// src/lib/redacao-dados.ts
//
// Leituras do Treinamento de Redação com a chave de serviço. Só para Server Components
// e server actions (nunca exportar daqui como action: recebem o id do usuário).

import { criarClienteSupabaseAdmin } from "@/lib/supabase-admin";

export const CONTATO_ADMIN = "wagnerjuniorsouza@gmail.com";
export const MSG_INDISPONIVEL = `Módulo indisponível: o bônus de redação vale até a data da prova do seu concurso. Dúvidas? Fale com o admin: ${CONTATO_ADMIN}`;

/** Data de hoje em Brasília, AAAA-MM-DD (o bônus vale até o dia da prova, inclusive). */
export function hojeBrasilia(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
}

/** Apostilas com redação que o aluno tem; `vigente` = prova ainda não passou. */
export async function apostilasComRedacao(userId: string) {
  const admin = criarClienteSupabaseAdmin();
  const { data: acessos } = await admin.from("acessos").select("produto_id").eq("user_id", userId);
  const ids = (acessos ?? []).map((a) => a.produto_id);
  if (!ids.length) return [];
  const { data } = await admin
    .from("apostilas")
    .select("id, slug, titulo, uf, redacao_nota_max, data_prova")
    .in("produto_id", ids)
    .eq("tem_redacao", true)
    .order("titulo");
  const hoje = hojeBrasilia();
  return (data ?? []).map((a) => ({ ...a, vigente: !a.data_prova || a.data_prova >= hoje }));
}

export async function saldoRedacao(userId: string): Promise<number | null> {
  const { data, error } = await criarClienteSupabaseAdmin().rpc("saldo_redacao", { p_user: userId });
  if (error) return null;
  return data;
}

