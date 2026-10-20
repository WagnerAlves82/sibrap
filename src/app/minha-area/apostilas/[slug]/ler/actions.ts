"use server";

import { criarClienteSupabaseServer } from "@/lib/supabase-server";

/** Capítulo lido até o fim: rende crédito de ajuda (uma vez por capítulo, com teto diário no servidor). */
export async function registrarLeituraAction(slugApostila: string, numero: number): Promise<{ saldo: number } | { erro: string }> {
  if (!Number.isInteger(numero) || numero < 1 || numero > 999) return { erro: "capítulo inválido" };
  const supabase = await criarClienteSupabaseServer();
  const { data, error } = await supabase.rpc("creditar_estudo", {
    p_slug: slugApostila,
    p_motivo: "capitulo_lido",
    p_ref: `cap${numero}`,
  });
  if (error) return { erro: error.message };
  return { saldo: data ?? 0 };
}

/** Capítulo aberto a partir de uma questão do simulado (estudar o assunto): crédito maior, também uma vez por capítulo. */
export async function registrarLeituraAposQuestaoAction(slugApostila: string, numero: number): Promise<{ saldo: number } | { erro: string }> {
  if (!Number.isInteger(numero) || numero < 1 || numero > 999) return { erro: "capítulo inválido" };
  const supabase = await criarClienteSupabaseServer();
  const { data, error } = await supabase.rpc("creditar_estudo", {
    p_slug: slugApostila,
    p_motivo: "capitulo_apos_erro",
    p_ref: `cap${numero}`,
  });
  if (error) return { erro: error.message };
  return { saldo: data ?? 0 };
}
