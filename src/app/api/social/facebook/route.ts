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
import { imagemDeVitrine, listarApostilasPublicadas } from "@/lib/apostilas";
import { montarTextoApostila } from "@/lib/facebook-apostila";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sibrap.tec.br";
const API = `https://graph.facebook.com/${process.env.FACEBOOK_GRAPH_VERSION ?? "v26.0"}`;
const JANELA_DIAS = 7; // não divulga matéria velha
const MATERIAS_POR_APOSTILA = 3; // a cada 3 matérias, 1 post de apostila

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

type Admin = ReturnType<typeof criarClienteSupabaseAdmin>;

// Posta a apostila divulgada há mais tempo (ou nunca divulgada). Em ~2 de cada 3 vezes
// leva também o link da matéria sobre o concurso, quando existir.
async function postarApostila(
  admin: Admin,
  { dry, pageId, token }: { dry: boolean; pageId?: string; token?: string }
): Promise<NextResponse | null> {
  const todas = await listarApostilasPublicadas(admin as never);
  if (todas.length === 0) return null;
  const ordenadas = [...todas].sort((a, b) => (a.facebook_postado_em ?? "").localeCompare(b.facebook_postado_em ?? ""));
  const apostila = ordenadas[0];

  const { count: jaPostadas } = await admin
    .from("apostilas")
    .select("id", { count: "exact", head: true })
    .not("facebook_postado_em", "is", null);
  const comMateria = (jaPostadas ?? 0) % 3 !== 2;

  let linkMateria: string | null = null;
  if (comMateria) {
    const { data: materia } = await admin
      .from("posts")
      .select("slug")
      .eq("status", "publicada")
      .contains("apostilas_slugs", [apostila.slug])
      .order("publicado_em", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (materia) linkMateria = `${siteUrl}/blog/${materia.slug}?utm_source=facebook&utm_medium=organico&utm_campaign=apostila-${apostila.slug}`;
  }

  const linkApostila = `${siteUrl}/apostilas/${apostila.slug}?utm_source=facebook&utm_medium=organico&utm_campaign=apostila-${apostila.slug}`;
  const message = montarTextoApostila(apostila, { apostila: linkApostila, materia: linkMateria });
  const imagem = imagemDeVitrine(apostila)?.url ?? null;
  const imagemFoto = imagem && /\.(png|jpe?g)$/i.test(imagem) ? imagem : null; // o Facebook não aceita webp em foto

  if (dry) {
    return NextResponse.json({ ok: true, dry: true, tipo: "apostila", apostila: apostila.slug, com_materia: !!linkMateria, foto: imagemFoto, message });
  }

  // reserva antes de postar (evita duplicar se duas execuções se cruzarem)
  const anterior = apostila.facebook_postado_em ?? null;
  let reserva = admin.from("apostilas").update({ facebook_postado_em: new Date().toISOString() }).eq("id", apostila.id);
  reserva = anterior ? reserva.eq("facebook_postado_em", anterior) : reserva.is("facebook_postado_em", null);
  const reservada = await reserva.select("id");
  if (!reservada.data?.length) return NextResponse.json({ ok: true, publicado: false, motivo: "apostila já reservada por outra execução" });

  const enviar = async (alvo: "photos" | "feed") => {
    const corpo =
      alvo === "photos"
        ? new URLSearchParams({ url: imagemFoto!, caption: message, access_token: token! })
        : new URLSearchParams({ message, link: linkApostila, access_token: token! });
    const resposta = await fetch(`${API}/${pageId}/${alvo}`, { method: "POST", body: corpo, signal: AbortSignal.timeout(30000) });
    const json = (await resposta.json().catch(() => ({}))) as { id?: string; post_id?: string; error?: { message?: string } };
    return { ok: resposta.ok && !!(json.post_id ?? json.id), id: json.post_id ?? json.id, erro: json.error?.message ?? `HTTP ${resposta.status}` };
  };

  let resultado = imagemFoto ? await enviar("photos") : await enviar("feed");
  if (!resultado.ok && imagemFoto) resultado = await enviar("feed"); // plano B: post com link

  if (!resultado.ok) {
    await admin.from("apostilas").update({ facebook_postado_em: anterior }).eq("id", apostila.id);
    return NextResponse.json({ ok: false, erro: resultado.erro }, { status: 502 });
  }
  await admin.from("apostilas").update({ facebook_post_id: resultado.id }).eq("id", apostila.id);
  return NextResponse.json({ ok: true, publicado: true, tipo: "apostila", apostila: apostila.slug, facebook_id: resultado.id });
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

  const inicioDia = inicioDoDiaBrasilia().toISOString();
  const [{ count: materiasHoje }, { count: apostilasHoje }] = await Promise.all([
    admin.from("posts").select("id", { count: "exact", head: true }).gte("facebook_postado_em", inicioDia),
    admin.from("apostilas").select("id", { count: "exact", head: true }).gte("facebook_postado_em", inicioDia),
  ]);
  if ((materiasHoje ?? 0) + (apostilasHoje ?? 0) >= limiteDia) {
    return NextResponse.json({ ok: true, publicado: false, motivo: `teto diário (${limiteDia}) atingido` });
  }

  // Rodízio: depois de MATERIAS_POR_APOSTILA matérias postadas desde o último post de apostila, é a vez de uma apostila.
  const { data: ultimaApostila } = await admin
    .from("apostilas")
    .select("facebook_postado_em")
    .not("facebook_postado_em", "is", null)
    .order("facebook_postado_em", { ascending: false })
    .limit(1)
    .maybeSingle();
  let consultaMaterias = admin.from("posts").select("id", { count: "exact", head: true }).not("facebook_postado_em", "is", null);
  if (ultimaApostila?.facebook_postado_em) consultaMaterias = consultaMaterias.gt("facebook_postado_em", ultimaApostila.facebook_postado_em);
  const { count: materiasDesdeApostila } = await consultaMaterias;

  if ((materiasDesdeApostila ?? 0) >= MATERIAS_POR_APOSTILA) {
    const vez = await postarApostila(admin, { dry, pageId, token });
    if (vez) return vez;
    // sem apostila disponível: segue com matéria
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
