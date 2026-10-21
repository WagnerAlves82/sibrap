"use server";

import { revalidatePath } from "next/cache";
import { criarClienteSupabaseServer } from "@/lib/supabase-server";

/** Marca ou desmarca um capítulo do plano de estudos; concluir rende o crédito de estudo do cronograma. */
export async function marcarItemPlanoAction(
  slugApostila: string,
  item: string,
  concluido: boolean
): Promise<{ ok: true } | { erro: string }> {
  const supabase = await criarClienteSupabaseServer();
  const { error } = await supabase.rpc("marcar_item_plano", { p_slug: slugApostila, p_item: item, p_concluido: concluido });
  if (error) return { erro: error.message };
  if (concluido) {
    await supabase.rpc("creditar_estudo", { p_slug: slugApostila, p_motivo: "cronograma", p_ref: item });
  }
  revalidatePath(`/minha-area/apostilas/${slugApostila}/cronograma`);
  return { ok: true };
}
