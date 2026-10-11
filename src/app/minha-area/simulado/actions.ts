"use server";

import { criarClienteSupabaseServer } from "@/lib/supabase-server";
import { dentroDoLimite, MSG_MUITAS_TENTATIVAS } from "@/lib/limite";

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
  cargoId: string,
  quantidade?: number
): Promise<{ erro: string } | { questoes: QuestaoSimulado[] }> {
  const supabase = await criarClienteSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: "Você precisa estar logado." };

  if (!(await dentroDoLimite(`simulado:iniciar:${user.id}`, 30, 3600))) {
    return { erro: MSG_MUITAS_TENTATIVAS };
  }

  const { data, error } = await supabase.rpc("iniciar_simulado", {
    p_produto_id: produtoId,
    p_cargo_id: cargoId,
    ...(quantidade ? { p_quantidade: Math.floor(quantidade) } : {}),
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
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: "Você precisa estar logado." };

  if (!(await dentroDoLimite(`simulado:finalizar:${user.id}`, 30, 3600))) {
    return { erro: MSG_MUITAS_TENTATIVAS };
  }

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

export type QuestaoRetomada = QuestaoSimulado & { resposta: string | null };

/** Tentativa em aberto (se houver), com as respostas já salvas. */
export async function retomarSimuladoAction(
  produtoId: string
): Promise<{ erro: string } | { questoes: QuestaoRetomada[] }> {
  const supabase = await criarClienteSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: "Você precisa estar logado." };

  const { data, error } = await supabase.rpc("retomar_simulado", { p_produto_id: produtoId });
  if (error) return { erro: error.message };

  return {
    questoes: (data ?? []).map((q) => ({
      ...q,
      alternativas: q.alternativas as unknown as Alternativa[],
    })),
  };
}

/** Salva uma resposta na hora, para a pessoa poder parar e continuar depois. */
export async function salvarRespostaSimuladoAction(
  tentativaId: string,
  questaoId: string,
  letra: string
): Promise<{ erro: string } | { ok: true }> {
  const supabase = await criarClienteSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: "Você precisa estar logado." };

  const { error } = await supabase.rpc("salvar_resposta_simulado", {
    p_tentativa_id: tentativaId,
    p_questao_id: questaoId,
    p_letra: letra,
  });
  if (error) return { erro: error.message };
  return { ok: true };
}

export type ParcialDisciplina = { disciplina_nome: string; respondidas: number; acertos: number };

/** Acertos até agora, sem encerrar a tentativa. */
export async function parcialSimuladoAction(
  tentativaId: string
): Promise<{ erro: string } | { parcial: ParcialDisciplina[] }> {
  const supabase = await criarClienteSupabaseServer();
  const { data, error } = await supabase.rpc("parcial_simulado", { p_tentativa_id: tentativaId });
  if (error) return { erro: error.message };
  return { parcial: data ?? [] };
}
