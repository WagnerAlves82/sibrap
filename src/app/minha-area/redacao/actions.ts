"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Anthropic from "@anthropic-ai/sdk";
import type { Json } from "@/lib/database.types";
import { criarClienteSupabaseServer } from "@/lib/supabase-server";
import { criarClienteSupabaseAdmin } from "@/lib/supabase-admin";
import { dentroDoLimite, MSG_MUITAS_TENTATIVAS } from "@/lib/limite";
import { apostilasComRedacao, MSG_INDISPONIVEL, saldoRedacao } from "@/lib/redacao-dados";
import { gerarPixParaPedido, type EstadoPix } from "@/lib/pix";
import { corrigir, sugerir, type Avaliacao, type Sugestao } from "@/lib/redacao";
import {
  bancaDa,
  contarLinhas,
  MAX_CARACTERES,
  MAX_SUGESTOES_POR_REDACAO,
  MIN_LINHAS_CORRECAO,
} from "@/lib/redacao-bancas";

const UUID = /^[0-9a-f-]{36}$/i;

async function usuario() {
  const supabase = await criarClienteSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

async function redacaoDoAluno(id: string, userId: string) {
  if (!UUID.test(id)) return null;
  const { data } = await criarClienteSupabaseAdmin()
    .from("redacoes")
    .select("id, user_id, tema, texto, status, sugestoes_usadas, modo, apostilas(slug)")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();
  return data;
}

export async function criarRedacaoAction(formData: FormData) {
  const { user } = await usuario();
  if (!user) redirect("/login");

  const apostilaId = String(formData.get("apostila") ?? "");
  const temaLista = String(formData.get("tema") ?? "").trim();
  const temaLivre = String(formData.get("tema_livre") ?? "").trim();
  const modo = formData.get("modo") === "simulado" ? "simulado" : "treino";
  const tema = (temaLivre || temaLista).slice(0, 300);

  const minhas = (await apostilasComRedacao(user.id)).filter((a) => a.vigente);
  const apostila = minhas.find((a) => a.id === apostilaId) ?? minhas[0];
  if (!apostila) redirect("/minha-area/redacao?erro=indisponivel");
  if (tema.length < 8) redirect("/minha-area/redacao?erro=tema");

  if (!(await dentroDoLimite(`redacao-nova:${user.id}`, 15, 3600))) redirect("/minha-area/redacao?erro=limite");

  const { data, error } = await criarClienteSupabaseAdmin()
    .from("redacoes")
    .insert({ user_id: user.id, apostila_id: apostila.id, tema, modo, nota_max: apostila.redacao_nota_max })
    .select("id")
    .single();
  if (error || !data) redirect("/minha-area/redacao?erro=criar");
  redirect(`/minha-area/redacao/${data.id}`);
}

/** Copia uma redação corrigida para um novo rascunho (reescrever depois da correção). */
export async function reescreverAction(id: string) {
  const { user } = await usuario();
  if (!user) return;
  const atual = await redacaoDoAluno(id, user.id);
  if (!atual || (await saldoRedacao(user.id)) === null) return;
  const { data: completa } = await criarClienteSupabaseAdmin()
    .from("redacoes")
    .select("apostila_id, nota_max")
    .eq("id", id)
    .single();
  const { data } = await criarClienteSupabaseAdmin()
    .from("redacoes")
    .insert({
      user_id: user.id,
      apostila_id: completa?.apostila_id ?? null,
      nota_max: completa?.nota_max ?? null,
      tema: atual.tema,
      texto: atual.texto,
      modo: "treino",
    })
    .select("id")
    .single();
  if (data) redirect(`/minha-area/redacao/${data.id}`);
}

export async function salvarRascunhoAction(id: string, texto: string): Promise<{ ok: boolean }> {
  const { user } = await usuario();
  if (!user) return { ok: false };
  const { error } = await criarClienteSupabaseAdmin()
    .from("redacoes")
    .update({ texto: texto.slice(0, MAX_CARACTERES), atualizado_em: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("status", "rascunho");
  return { ok: !error };
}

export async function excluirRascunhoAction(id: string) {
  const { user } = await usuario();
  if (!user || !UUID.test(id)) return;
  await criarClienteSupabaseAdmin()
    .from("redacoes")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("status", "rascunho");
  revalidatePath("/minha-area/redacao");
}

export type RespostaSugestoes =
  | { sugestoes: Sugestao[]; comentario: string; restantes: number }
  | { erro: string };

export async function sugerirAction(id: string, texto: string, ignoradas: string[]): Promise<RespostaSugestoes> {
  const { user } = await usuario();
  if (!user) return { erro: "Sua sessão expirou. Entre de novo." };
  const r = await redacaoDoAluno(id, user.id);
  if (!r || r.status !== "rascunho") return { erro: "Redação não encontrada." };
  if (r.modo === "simulado") return { erro: "No modo simulado não há sugestões durante a escrita." };
  if (r.sugestoes_usadas >= MAX_SUGESTOES_POR_REDACAO) {
    return { erro: "Você usou todas as análises ao vivo desta redação. Envie para a correção final." };
  }
  if ((await saldoRedacao(user.id)) === null) return { erro: MSG_INDISPONIVEL };
  if (!(await dentroDoLimite(`redacao-sug:${user.id}`, 40, 3600))) return { erro: MSG_MUITAS_TENTATIVAS };

  const limpo = texto.slice(0, MAX_CARACTERES);
  const admin = criarClienteSupabaseAdmin();
  await admin
    .from("redacoes")
    .update({ texto: limpo, sugestoes_usadas: r.sugestoes_usadas + 1, atualizado_em: new Date().toISOString() })
    .eq("id", id);

  try {
    const s = await sugerir({
      tema: r.tema,
      texto: limpo,
      banca: bancaDa(r.apostilas?.slug),
      ignoradas: ignoradas.map((x) => String(x).slice(0, 120)).slice(0, 20),
    });
    return {
      sugestoes: s.sugestoes,
      comentario: s.comentario,
      restantes: MAX_SUGESTOES_POR_REDACAO - r.sugestoes_usadas - 1,
    };
  } catch (e) {
    console.error("Sugestões de redação:", e instanceof Anthropic.APIError ? `${e.status} ${e.message}` : e);
    return { erro: "O corretor está ocupado agora. Continue escrevendo; tento de novo em instantes." };
  }
}

export type RespostaCorrecao = { avaliacao: Avaliacao } | { erro: string };

export async function corrigirAction(id: string, texto: string): Promise<RespostaCorrecao> {
  const { user } = await usuario();
  if (!user) return { erro: "Sua sessão expirou. Entre de novo." };
  const r = await redacaoDoAluno(id, user.id);
  if (!r) return { erro: "Redação não encontrada." };
  if (r.status !== "rascunho") return { erro: "Esta redação já foi corrigida." };

  const limpo = texto.slice(0, MAX_CARACTERES).trim();
  if (contarLinhas(limpo) < MIN_LINHAS_CORRECAO) {
    return { erro: `Escreva pelo menos ${MIN_LINHAS_CORRECAO} linhas antes de enviar para a correção.` };
  }
  const saldo = await saldoRedacao(user.id);
  if (saldo === null) return { erro: MSG_INDISPONIVEL };
  if (saldo <= 0) return { erro: "Suas correções acabaram. Adquira o pacote +5 correções para continuar." };
  if (!(await dentroDoLimite(`redacao-corr:${user.id}`, 8, 3600))) return { erro: MSG_MUITAS_TENTATIVAS };

  let avaliacao: Avaliacao | null = null;
  try {
    avaliacao = await corrigir({ tema: r.tema, texto: limpo, banca: bancaDa(r.apostilas?.slug) });
  } catch (e) {
    console.error("Correção de redação:", e instanceof Anthropic.APIError ? `${e.status} ${e.message}` : e);
  }
  if (!avaliacao) return { erro: "Não consegui corrigir agora e nenhuma correção foi descontada. Tente de novo em instantes." };

  // só desconta se ainda estava em rascunho (duas abas enviando ao mesmo tempo contam uma vez)
  const { data: gravou } = await criarClienteSupabaseAdmin()
    .from("redacoes")
    .update({
      texto: limpo,
      status: "corrigida",
      nota: avaliacao.nota,
      nota_max: avaliacao.notaMax,
      avaliacao: avaliacao as unknown as Json,
      corrigida_em: new Date().toISOString(),
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("status", "rascunho")
    .select("id");
  if (!gravou?.length) return { erro: "Esta redação já foi corrigida." };
  revalidatePath("/minha-area/redacao");
  return { avaliacao };
}

export async function criarPagamentoExtraAction(): Promise<EstadoPix> {
  const { supabase, user } = await usuario();
  if (!user || !user.email) return { erro: "Você precisa estar logado com um e-mail válido." };
  const { data: pedidoRows, error } = await supabase.rpc("criar_pedido_por_slug", { p_slug: "redacao-extra-5" });
  if (error || !pedidoRows?.[0]) {
    return { erro: error?.message ?? "Não deu pra criar o pedido agora. Tenta de novo." };
  }
  const { pedido_id, produto_nome, valor_centavos } = pedidoRows[0];
  return gerarPixParaPedido({
    supabase,
    pedidoId: pedido_id,
    produtoNome: produto_nome,
    valorCentavos: valor_centavos,
    email: user.email,
    nome: (user.user_metadata as { nome?: string } | undefined)?.nome,
  });
}
