// src/lib/blog.ts
//
// Blog de divulgação de concursos: tipos, constantes e formatadores
// compartilhados pela listagem, pela página do post e pelo admin. O
// conteúdo é Markdown simples (sem editor visual, sem dependência nova) e
// vive na tabela `posts` (metadados públicos só quando `status = 'publicada'`).

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { BUCKET_CAPAS, urlCapa, type ApostilaVitrine } from "@/lib/apostilas";

export type PostRow = Database["public"]["Tables"]["posts"]["Row"];

export const REGIOES = ["Norte", "Nordeste", "Centro-Oeste", "Sudeste", "Sul"] as const;
export type Regiao = (typeof REGIOES)[number];

// Região de cada UF, pra filtrar o blog por região sem precisar preencher
// os dois campos toda vez (a região pode ser deixada em branco também, pra
// posts nacionais que não são de um estado específico).
export const REGIAO_POR_UF: Record<string, Regiao> = {
  AC: "Norte", AP: "Norte", AM: "Norte", PA: "Norte", RO: "Norte", RR: "Norte", TO: "Norte",
  AL: "Nordeste", BA: "Nordeste", CE: "Nordeste", MA: "Nordeste", PB: "Nordeste",
  PE: "Nordeste", PI: "Nordeste", RN: "Nordeste", SE: "Nordeste",
  DF: "Centro-Oeste", GO: "Centro-Oeste", MS: "Centro-Oeste", MT: "Centro-Oeste",
  ES: "Sudeste", MG: "Sudeste", RJ: "Sudeste", SP: "Sudeste",
  PR: "Sul", RS: "Sul", SC: "Sul",
};

export const ESFERAS = [
  { valor: "nacional", rotulo: "Nacional", peso: 40 },
  { valor: "economia_mista", rotulo: "Economia mista", peso: 30 },
  { valor: "estadual", rotulo: "Estadual", peso: 20 },
  { valor: "municipal", rotulo: "Prefeituras", peso: 10 },
] as const;
export type Esfera = (typeof ESFERAS)[number]["valor"];

export function rotuloEsfera(valor: string | null | undefined): string | null {
  return ESFERAS.find((e) => e.valor === valor)?.rotulo ?? null;
}

/** Pontuação para escolher o que vai pro Facebook: esfera + destaque + ajuste manual. */
export function pontuacaoDivulgacao(p: Pick<PostRow, "esfera" | "destaque" | "importancia">): number {
  const peso = ESFERAS.find((e) => e.valor === p.esfera)?.peso ?? 10;
  return peso + (p.destaque ? 15 : 0) + (p.importancia ?? 0);
}

export const CATEGORIAS_POST = ["Concursos", "Editais", "Dicas de estudo", "Notícias"] as const;

export { BUCKET_CAPAS, urlCapa };

// Capas por link: só Wikimedia Commons (licenças livres), os mesmos hosts
// liberados em `images.remotePatterns` no next.config.ts.
const HOSTS_CAPA_EXTERNA = ["upload.wikimedia.org", "commons.wikimedia.org"];

export function capaExternaValida(url: string | null | undefined): url is string {
  if (!url) return false;
  try {
    const u = new URL(url);
    return u.protocol === "https:" && HOSTS_CAPA_EXTERNA.includes(u.hostname);
  } catch {
    return false;
  }
}

/** Capa do post: link externo (Wikimedia) quando houver; senão o arquivo enviado ao Storage. */
export function capaDoPost(p: Pick<PostRow, "capa_url" | "capa_path">): string | null {
  return capaExternaValida(p.capa_url) ? p.capa_url : urlCapa(p.capa_path);
}

export function slugValidoPost(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length <= 100;
}

/** Gera um slug a partir do título (remove acento, pontuação, espaços). */
export function gerarSlug(titulo: string): string {
  return titulo
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 100)
    .replace(/-$/, "");
}

export function formatarDataLonga(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric", timeZone: "UTC" });
}

/** Tira a marcação Markdown básica, pra gerar um resumo quando o post não tem um escrito à mão. */
export function resumoAutomatico(conteudo: string, tamanho = 160): string {
  const texto = conteudo
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_`~-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (texto.length <= tamanho) return texto;
  return texto.slice(0, tamanho).replace(/\s+\S*$/, "") + "…";
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function inline(s: string): string {
  let t = escapeHtml(s);
  t = t.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer nofollow">$1</a>');
  t = t.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  t = t.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, "<em>$1</em>");
  return t;
}

/**
 * Conversor Markdown -> HTML propositalmente simples (sem dependência
 * nova): parágrafos, ##/### títulos, listas (- ou 1.), > citação, **negrito**,
 * *itálico* e [link](https://...). Suficiente para posts de divulgação de
 * concursos; não aceita HTML embutido no texto (tudo passa por escapeHtml).
 */
export function markdownParaHtml(md: string): string {
  const linhas = md.replace(/\r\n/g, "\n").split("\n");
  const blocos: string[] = [];
  let paragrafo: string[] = [];
  let lista: { tipo: "ul" | "ol"; itens: string[] } | null = null;
  let citacao: string[] = [];

  const fecharParagrafo = () => {
    if (paragrafo.length) {
      blocos.push(`<p>${inline(paragrafo.join(" "))}</p>`);
      paragrafo = [];
    }
  };
  const fecharLista = () => {
    if (lista) {
      const itens = lista.itens.map((i) => `<li>${inline(i)}</li>`).join("");
      blocos.push(`<${lista.tipo}>${itens}</${lista.tipo}>`);
      lista = null;
    }
  };
  const fecharCitacao = () => {
    if (citacao.length) {
      blocos.push(`<blockquote><p>${inline(citacao.join(" "))}</p></blockquote>`);
      citacao = [];
    }
  };
  const fecharTudo = () => {
    fecharParagrafo();
    fecharLista();
    fecharCitacao();
  };

  for (const linhaBruta of linhas) {
    const linha = linhaBruta.trimEnd();
    const titulo = /^(#{2,3})\s+(.*)$/.exec(linha);
    const itemUl = /^[-*]\s+(.*)$/.exec(linha);
    const itemOl = /^\d+\.\s+(.*)$/.exec(linha);
    const itemCitacao = /^>\s?(.*)$/.exec(linha);

    if (!linha.trim()) {
      fecharTudo();
      continue;
    }
    if (titulo) {
      fecharTudo();
      const nivel = titulo[1].length;
      blocos.push(`<h${nivel}>${inline(titulo[2])}</h${nivel}>`);
      continue;
    }
    if (itemCitacao) {
      fecharParagrafo();
      fecharLista();
      citacao.push(itemCitacao[1]);
      continue;
    }
    if (itemUl || itemOl) {
      fecharParagrafo();
      fecharCitacao();
      const tipo = itemUl ? "ul" : "ol";
      const texto = (itemUl ?? itemOl)![1];
      if (!lista || lista.tipo !== tipo) {
        fecharLista();
        lista = { tipo, itens: [] };
      }
      lista.itens.push(texto);
      continue;
    }
    fecharLista();
    fecharCitacao();
    paragrafo.push(linha.trim());
  }
  fecharTudo();
  return blocos.join("\n");
}

export type PostVitrine = PostRow;

export async function listarPostsPublicados(
  supabase: SupabaseClient<Database>,
  opcoes?: { regiao?: string; uf?: string; limite?: number }
): Promise<PostVitrine[]> {
  let query = supabase.from("posts").select("*").eq("status", "publicada").order("publicado_em", { ascending: false });
  if (opcoes?.regiao) query = query.eq("regiao", opcoes.regiao);
  if (opcoes?.uf) query = query.eq("uf", opcoes.uf);
  if (opcoes?.limite) query = query.limit(opcoes.limite);
  const { data } = await query;
  return data ?? [];
}

function normalizar(t: string): string {
  return t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/**
 * Escolhe as apostilas mais ligadas a um post, sem campo extra no banco:
 * pontua por órgão/banca/cargo citados no título e no texto, e por mesma UF.
 * Slugs escolhidos no admin têm prioridade. Sem correspondência, não mostra
 * apostila nenhuma (só indica quando existe uma para o concurso do post).
 */
export function apostilasRelacionadas(
  post: Pick<PostRow, "titulo" | "conteudo" | "uf" | "apostilas_slugs">,
  apostilas: ApostilaVitrine[],
  limite = 2
): ApostilaVitrine[] {
  if (post.apostilas_slugs?.length) {
    const manuais = post.apostilas_slugs
      .map((sl) => apostilas.find((a) => a.slug === sl))
      .filter((a): a is ApostilaVitrine => !!a);
    if (manuais.length) return manuais.slice(0, limite);
  }
  const titulo = normalizar(post.titulo);
  const texto = normalizar(`${post.titulo} ${post.conteudo}`);
  const pontos = apostilas.map((a) => {
    let n = 0;
    const orgao = normalizar(a.orgao);
    if (titulo.includes(orgao)) n += 6;
    else if (texto.includes(orgao)) n += 3;
    if (a.banca && titulo.includes(normalizar(a.banca))) n += 2;
    else if (a.banca && texto.includes(normalizar(a.banca))) n += 1;
    if (texto.includes(normalizar(a.cargo))) n += 2;
    if (post.uf && a.uf === post.uf) n += 1;
    return { a, n };
  });
  const achadas = pontos.filter((x) => x.n >= 2).sort((x, y) => y.n - x.n);
  return achadas.slice(0, limite).map((x) => x.a);
}
