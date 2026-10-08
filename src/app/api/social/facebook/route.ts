// src/app/api/social/facebook/route.ts
//
// POST (chamado pelo GitHub Actions, ver .github/workflows/facebook-posts.yml):
// escolhe a matéria publicada MAIS RECENTE ainda não divulgada e publica
// na Página do Facebook. Respeita o teto diário (padrão: 6 por dia, no
// horário de Brasília) — cada chamada publica no máximo 1 matéria.
//
// Importância = peso da esfera (nacional > economia mista > estadual >
// prefeituras) + destaque + ajuste manual do admin; empate = a mais nova.
// Exige "Authorization: Bearer <SOCIAL_SECRET>". Com ?dry=1 só mostra o que
// seria publicado, sem postar nem gravar nada.

import crypto from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { criarClienteSupabaseAdmin } from "@/lib/supabase-admin";
import { pontuacaoDivulgacao, resumoAutomatico, rotuloEsfera, type PostRow } from "@/lib/blog";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sibrap.tec.br";
const API = `https://graph.facebook.com/${process.env.FACEBOOK_GRAPH_VERSION ?? "v26.0"}`;
const JANELA_DIAS = 7; // não divulga matéria velha

function autorizado(request: NextRequest): boolean {
  const recebido = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const segredo = process.env.SOCIAL_SECRET;
  if (!recebido || !segredo || segredo.length < 32) return false;
  const a = Buffer.from(recebido);
  const b = Buffer.from(segredo);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// Início do dia em Brasília (UTC-3, sem horário de verão) em UTC.
function inicioDoDiaBrasilia(): Date {
  const brt = new Date(Date.now() - 3 * 3600e3);
  brt.setUTCHours(0, 0, 0, 0);
  return new Date(brt.getTime() + 3 * 3600e3);
}

function montarTexto(post: PostRow): string {
  const resumo = (post.resumo || resumoAutomatico(post.conteudo, 260)).trim();
  const esfera = rotuloEsfera(post.esfera);
  const padrao = ["#ConcursoPúblico", post.uf ? `#Concursos${post.uf}` : null, esfera === "Prefeituras" ? "#Prefeitura" : null, "#SIBRAP"];
  // hashtags próprias da matéria (órgão, cidade, ano...) vêm primeiro; as padrão completam até 8
  const proprias = (post.hashtags ?? []).map((t) => t.trim()).filter((t) => /^#\S+$/.test(t));
  const tags = [...new Set([...proprias, ...padrao.filter((t): t is string => !!t)])].slice(0, 8).join(" ");
  const utm = (alvo: string) => `${siteUrl}${alvo}?utm_source=facebook&utm_medium=organico&utm_campaign=${post.slug}`;
  // chamada para a venda: apostila do próprio concurso, se existir; senão a vitrine de apostilas
  const apostila = post.apostilas_slugs?.[0];
  const cta = apostila
    ? `📘 Apostila completa para este concurso, com questões e simulado: ${utm(`/apostilas/${apostila}`)}`
    : `📘 Apostilas para concursos municipais, com questões e simulado: ${utm("/apostilas")}`;
  return `📢 ${post.seo_titulo || post.titulo}

${resumo}

Edital, prazos e passo a passo na matéria 👇

${cta}

${tags}`;
}

export async function POST(request: NextRequest) {
  if (!autorizado(request)) return NextResponse.json({ erro: "não autorizado" }, { status: 401 });

  const dry = request.nextUrl.searchParams.get("dry") === "1";
  const pageId = process.env.FACEBOOK_PAGE_ID;
  const token = process.env.FACEBOOK_PAGE_TOKEN;
  if (!dry && (!pageId || !token)) {
    return NextResponse.json({ erro: "FACEBOOK_PAGE_ID/FACEBOOK_PAGE_TOKEN não configurados" }, { status: 500 });
  }

  const limiteDia = Math.max(1, Number(process.env.FACEBOOK_MAX_POR_DIA) || 6);
  const admin = criarClienteSupabaseAdmin();

  const { count } = await admin
    .from("posts")
    .select("id", { count: "exact", head: true })
    .gte("facebook_postado_em", inicioDoDiaBrasilia().toISOString());
  if ((count ?? 0) >= limiteDia) {
    return NextResponse.json({ ok: true, publicado: false, motivo: `teto diário (${limiteDia}) atingido` });
  }

  const desde = new Date(Date.now() - JANELA_DIAS * 86400e3).toISOString();
  const { data } = await admin
    .from("posts")
    .select("*")
    .eq("status", "publicada")
    .is("facebook_postado_em", null)
    .gte("publicado_em", desde)
    .order("publicado_em", { ascending: false })
    .limit(100);

  // regra: sempre a matéria MAIS ATUAL; a pontuação (esfera/destaque/importância) só desempata
  const escolhido = (data ?? []).sort(
    (a, b) => (b.publicado_em ?? "").localeCompare(a.publicado_em ?? "") || pontuacaoDivulgacao(b) - pontuacaoDivulgacao(a)
  )[0];
  if (!escolhido) return NextResponse.json({ ok: true, publicado: false, motivo: "nada pendente" });

  const link = `${siteUrl}/blog/${escolhido.slug}?utm_source=facebook&utm_medium=organico&utm_campaign=${escolhido.slug}`;
  const message = montarTexto(escolhido);
  if (dry) return NextResponse.json({ ok: true, dry: true, post: escolhido.slug, pontos: pontuacaoDivulgacao(escolhido), message, link });

  // reserva a matéria antes de postar (evita duplicar se duas execuções se cruzarem)
  const reservada = await admin
    .from("posts")
    .update({ facebook_postado_em: new Date().toISOString() })
    .eq("id", escolhido.id)
    .is("facebook_postado_em", null)
    .select("id");
  if (!reservada.data?.length) return NextResponse.json({ ok: true, publicado: false, motivo: "já reservada por outra execução" });

  const corpo = new URLSearchParams({ message, link, access_token: token! });
  const resposta = await fetch(`${API}/${pageId}/feed`, { method: "POST", body: corpo, signal: AbortSignal.timeout(30000) });
  const json = (await resposta.json().catch(() => ({}))) as { id?: string; error?: { message?: string } };

  if (!resposta.ok || !json.id) {
    await admin.from("posts").update({ facebook_postado_em: null }).eq("id", escolhido.id);
    return NextResponse.json({ ok: false, erro: json.error?.message ?? `HTTP ${resposta.status}` }, { status: 502 });
  }

  await admin.from("posts").update({ facebook_post_id: json.id }).eq("id", escolhido.id);
  return NextResponse.json({ ok: true, publicado: true, post: escolhido.slug, facebook_id: json.id });
}
