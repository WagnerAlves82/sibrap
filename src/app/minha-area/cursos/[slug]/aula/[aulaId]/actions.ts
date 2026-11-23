"use server";

import { criarClienteSupabaseServer } from "@/lib/supabase-server";
import { dentroDoLimite, MSG_MUITAS_TENTATIVAS } from "@/lib/limite";

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
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: "Você precisa estar logado." };

  // 600/h: aluno rápido faz ~200 respostas por hora em cursos longos (Juliene, Secretariado, 18/11/2026: travou com 120/h)
  if (!(await dentroDoLimite(`miniquiz:conferir:${user.id}`, 600, 3600))) {
    return { erro: MSG_MUITAS_TENTATIVAS };
  }

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

// Tempo de estudo (cursos com controle de tempo). Roda no servidor: desde 21/11/2026 a sessão fica em
// cookies httpOnly e o cliente do navegador chamava o banco como anônimo (401), então o relógio nunca
// somava e a tela voltava para o tempo cheio a cada 30 s (Kauã, Formação Eletricista, 23/11/2026).
export async function registrarTempoAulaAction(aulaId: string): Promise<number | null> {
  const supabase = await criarClienteSupabaseServer();
  const { data, error } = await supabase.rpc("registrar_tempo_aula", { p_aula_id: aulaId });
  if (error || typeof data !== "number") return null;
  return data;
}
