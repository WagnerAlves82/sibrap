"use server";

import { criarClienteSupabaseServer } from "@/lib/supabase-server";

export type Alternativa = { letra: string; texto: string };

export type QuestaoSimulado = {
  tentativa_id: string;
  questao_id: string;
  ordem: number;
  disciplina_nome: string;
  enunciado: string;
  alternativas: Alternativa[];
  diagrama_svg: string | null;
  inspirada_em: string | null;
};

export async function iniciarSimuladoAction(
  produtoId: string,
  cargoId: string
): Promise<{ erro: string } | { questoes: QuestaoSimulado[] }> {
  const supabase = await criarClienteSupabaseServer();
  const { data, error } = await supabase.rpc("iniciar_simulado", {
    p_produto_id: produtoId,
    p_cargo_id: cargoId,
  });

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

export type ResultadoSimulado = { nota: number; total: number; acertos: number };

export async function finalizarSimuladoAction(
  tentativaId: string,
  respostas: Record<string, string>
): Promise<{ erro: string } | { resultado: ResultadoSimulado }> {
  const supabase = await criarClienteSupabaseServer();
  const { data, error } = await supabase.rpc("finalizar_simulado", {
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

export type DesempenhoDisciplina = {
  disciplina_nome: string;
  acertos: number;
  total: number;
};

export async function desempenhoSimuladoAction(
  tentativaId: string
): Promise<{ erro: string } | { desempenho: DesempenhoDisciplina[] }> {
  const supabase = await criarClienteSupabaseServer();
  const { data, error } = await supabase.rpc("desempenho_simulado", {
    p_tentativa_id: tentativaId,
  });

  if (error) {
    return { erro: error.message };
  }

  return { desempenho: data ?? [] };
}
