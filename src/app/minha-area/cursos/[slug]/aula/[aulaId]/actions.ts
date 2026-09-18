"use server";

import { criarClienteSupabaseServer } from "@/lib/supabase-server";

export type ResultadoMiniquiz = {
  correta: boolean;
  gabarito: string;
  comentario: string | null;
};

export async function conferirMiniquizAction(
  questaoId: string,
  letra: string
): Promise<ResultadoMiniquiz | { erro: string }> {
  const supabase = await criarClienteSupabaseServer();
  const { data, error } = await supabase.rpc("conferir_miniquiz", {
    p_questao_id: questaoId,
    p_letra: letra,
  });
  const r = data?.[0];
  if (error || !r) return { erro: "Não deu pra conferir agora. Tenta de novo." };
  return { correta: r.correta, gabarito: r.gabarito, comentario: r.comentario };
}

export async function concluirAulaAction(
  aulaId: string
): Promise<{ ok: true } | { erro: string }> {
  const supabase = await criarClienteSupabaseServer();
  const { error } = await supabase.rpc("concluir_aula", { p_aula_id: aulaId });
  if (error) return { erro: error.message };
  return { ok: true };
}
