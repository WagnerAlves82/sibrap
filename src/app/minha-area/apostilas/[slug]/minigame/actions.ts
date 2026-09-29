"use server";

import { criarClienteSupabaseServer } from "@/lib/supabase-server";
import { dentroDoLimite, MSG_MUITAS_TENTATIVAS } from "@/lib/limite";

export type PerguntaVF = {
  enunciado: string;
  alternativa: string;
  correta: boolean;
};

export async function sortearPerguntasVFAction(
  produtoId: string,
  cargoId: string
): Promise<{ erro: string } | { perguntas: PerguntaVF[] }> {
  const supabase = await criarClienteSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: "Você precisa estar logado." };

  if (!(await dentroDoLimite(`minigame:vf:${user.id}`, 30, 3600))) {
    return { erro: MSG_MUITAS_TENTATIVAS };
  }

  const { data, error } = await supabase.rpc("sortear_perguntas_vf", {
    p_produto_id: produtoId,
    p_cargo_id: cargoId,
    p_quantidade: 5,
  });

  if (error) return { erro: error.message };
  if (!data?.length) return { erro: "Ainda não há questões suficientes pra esse minigame." };

  return { perguntas: data };
}
