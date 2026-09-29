"use server";

import { revalidatePath } from "next/cache";
import { criarClienteSupabaseServer } from "@/lib/supabase-server";

export async function marcarTopicoCronogramaAction(
  topicoId: string,
  concluido: boolean,
  slugApostila: string
): Promise<{ ok: true } | { erro: string }> {
  const supabase = await criarClienteSupabaseServer();
  const { error } = await supabase.rpc("marcar_topico_cronograma", {
    p_topico_id: topicoId,
    p_concluido: concluido,
  });
  if (error) return { erro: error.message };
  revalidatePath(`/minha-area/apostilas/${slugApostila}/cronograma`);
  return { ok: true };
}
