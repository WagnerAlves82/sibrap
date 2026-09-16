"use server";

import { criarClienteSupabaseServer } from "@/lib/supabase-server";

export type Alternativa = { letra: string; texto: string };

export type QuestaoGratis = {
  tentativa_id: string;
  questao_id: string;
  ordem: number;
  disciplina_nome: string;
  enunciado: string;
  alternativas: Alternativa[];
  diagrama_svg: string | null;
  inspirada_em: string | null;
};

export async function iniciarSimuladoGratisAction(): Promise<
  { erro: string } | { questoes: QuestaoGratis[] }
> {
  const supabase = await criarClienteSupabaseServer();
  const { data, error } = await supabase.rpc("iniciar_simulado_gratis");

  if (error) {
    return { erro: error.message };
  }

  return {
    questoes: (data ?? []).map((q) => ({
      ...q,
      alternativas: q.alternativas as unknown as Alternativa[],
    })),
  };
}

export type ResultadoSimuladoGratis = {
  nota: number;
  total: number;
  acertos: number;
};

export async function finalizarSimuladoGratisAction(
  tentativaId: string,
  respostas: Record<string, string>
): Promise<{ erro: string } | { resultado: ResultadoSimuladoGratis }> {
  const supabase = await criarClienteSupabaseServer();
  const { data, error } = await supabase.rpc("finalizar_simulado_gratis", {
    p_tentativa_id: tentativaId,
    p_respostas: respostas,
  });

  if (error) {
    return { erro: error.message };
  }

  const resultado = data?.[0];
  if (!resultado) {
    return { erro: "Não foi possível calcular o resultado." };
  }

  return { resultado };
}
