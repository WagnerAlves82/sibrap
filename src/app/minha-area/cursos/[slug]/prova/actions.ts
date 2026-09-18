"use server";

import { criarClienteSupabaseServer } from "@/lib/supabase-server";

export type Alternativa = { letra: string; texto: string };

export type QuestaoProva = {
  tentativa_id: string;
  questao_id: string;
  ordem: number;
  enunciado: string;
  alternativas: Alternativa[];
};

export type ResultadoProva = {
  nota: number;
  total: number;
  acertos: number;
  aprovado: boolean;
  nota_minima: number;
};

export type ItemRevisao = {
  ordem: number;
  enunciado: string;
  alternativas: Alternativa[];
  marcada: string | null;
  gabarito: string;
  comentario: string | null;
};

export async function iniciarProvaAction(
  cursoId: string
): Promise<{ erro: string } | { questoes: QuestaoProva[] }> {
  const supabase = await criarClienteSupabaseServer();
  const { data, error } = await supabase.rpc("iniciar_quiz", { p_curso_id: cursoId });
  if (error) return { erro: error.message };
  if (!data?.length) return { erro: "Ainda não há questões de prova disponíveis." };
  return {
    questoes: data.map((q) => ({
      ...q,
      alternativas: q.alternativas as unknown as Alternativa[],
    })),
  };
}

export async function finalizarProvaAction(
  tentativaId: string,
  respostas: Record<string, string>
): Promise<{ erro: string } | { resultado: ResultadoProva }> {
  const supabase = await criarClienteSupabaseServer();
  const { data, error } = await supabase.rpc("finalizar_quiz", {
    p_tentativa_id: tentativaId,
    p_respostas: respostas,
  });
  if (error) return { erro: error.message };
  const resultado = data?.[0];
  if (!resultado) return { erro: "Não foi possível calcular o resultado." };
  return { resultado };
}

export async function revisaoProvaAction(
  tentativaId: string
): Promise<{ erro: string } | { itens: ItemRevisao[] }> {
  const supabase = await criarClienteSupabaseServer();
  const { data, error } = await supabase.rpc("revisao_quiz", {
    p_tentativa_id: tentativaId,
  });
  if (error) return { erro: error.message };
  return {
    itens: (data ?? []).map((i) => ({
      ...i,
      alternativas: i.alternativas as unknown as Alternativa[],
    })),
  };
}
