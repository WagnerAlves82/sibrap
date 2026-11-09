import type { MetadataRoute } from "next";
import { criarClienteSupabaseAdmin } from "@/lib/supabase-admin";
import { slugDaBanca } from "@/lib/bancas";
import { COMBOS } from "@/lib/combos";

// Sem isto o sitemap era gerado só no build e não listava apostilas novas.
export const revalidate = 3600;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sibrap.tec.br";

// Datas reais de alteração: marcar tudo como "alterado agora" a cada leitura faz o Google ignorar o lastmod.
// Páginas institucionais usam uma data fixa (atualize ao mudar o texto delas).
const FIXAS = new Date("2026-11-09");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // /cadastro e llms*.txt ficam fora: não são páginas para o índice do Google (os robôs de IA acham o llms.txt pelo robots.txt)
  const paginas: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/termos`, lastModified: FIXAS, changeFrequency: "yearly", priority: 0.2 },
    { url: `${siteUrl}/privacidade`, lastModified: FIXAS, changeFrequency: "yearly", priority: 0.2 },
    { url: `${siteUrl}/sobre`, lastModified: FIXAS, changeFrequency: "monthly", priority: 0.5 },
    { url: `${siteUrl}/contato`, lastModified: FIXAS, changeFrequency: "monthly", priority: 0.5 },
    { url: `${siteUrl}/curriculo`, lastModified: FIXAS, changeFrequency: "monthly", priority: 0.85 },
    ...Object.keys(COMBOS).map((slug) => ({ url: `${siteUrl}/combos/${slug}`, lastModified: FIXAS, changeFrequency: "weekly" as const, priority: 0.9 })),
  ];
  // páginas de listagem: data da notícia/apostila mais recente
  let ultimaNoticia = FIXAS;
  let ultimaApostila = FIXAS;

  try {
    const { data: cursos } = await criarClienteSupabaseAdmin()
      .from("cursos")
      .select("slug")
      .eq("ativo", true);
    for (const curso of cursos ?? []) {
      paginas.push({
        url: `${siteUrl}/cursos/${curso.slug}`,
        lastModified: FIXAS,
        changeFrequency: "weekly",
        priority: 0.9,
      });
    }
    const { data: apostilas } = await criarClienteSupabaseAdmin()
      .from("apostilas")
      .select("slug, atualizado_em")
      .eq("status", "publicada");
    const bancasVistas = new Set<string>();
    const { data: comBanca } = await criarClienteSupabaseAdmin().from("apostilas").select("banca").eq("status", "publicada");
    for (const a of comBanca ?? []) {
      if (!a.banca) continue;
      const slugBanca = slugDaBanca(a.banca);
      if (bancasVistas.has(slugBanca)) continue;
      bancasVistas.add(slugBanca);
      paginas.push({ url: `${siteUrl}/bancas/${slugBanca}`, lastModified: FIXAS, changeFrequency: "weekly", priority: 0.6 });
    }
    for (const a of apostilas ?? []) {
      if (new Date(a.atualizado_em) > ultimaApostila) ultimaApostila = new Date(a.atualizado_em);
      paginas.push({
        url: `${siteUrl}/apostilas/${a.slug}`,
        lastModified: new Date(a.atualizado_em),
        changeFrequency: "weekly",
        priority: 0.9,
      });
    }
    const { data: posts } = await criarClienteSupabaseAdmin()
      .from("posts")
      .select("slug, atualizado_em")
      .eq("status", "publicada");
    for (const p of posts ?? []) {
      if (new Date(p.atualizado_em) > ultimaNoticia) ultimaNoticia = new Date(p.atualizado_em);
      paginas.push({
        url: `${siteUrl}/noticias/${p.slug}`,
        lastModified: new Date(p.atualizado_em),
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  } catch {
    // sem a chave de serviço (ex.: build local): fica só com as páginas fixas
  }

  const recente = ultimaNoticia > ultimaApostila ? ultimaNoticia : ultimaApostila;
  paginas.unshift(
    { url: siteUrl, lastModified: recente, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/apostilas`, lastModified: ultimaApostila, changeFrequency: "weekly", priority: 0.95 },
    { url: `${siteUrl}/noticias`, lastModified: ultimaNoticia, changeFrequency: "daily", priority: 0.8 },
    { url: `${siteUrl}/cursos`, lastModified: FIXAS, changeFrequency: "weekly", priority: 0.9 },
    { url: `${siteUrl}/bancas`, lastModified: ultimaApostila, changeFrequency: "weekly", priority: 0.6 },
  );
  return paginas;
}
