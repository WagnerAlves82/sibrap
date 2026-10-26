import type { MetadataRoute } from "next";
import { criarClienteSupabaseAdmin } from "@/lib/supabase-admin";
import { slugDaBanca } from "@/lib/bancas";
import { COMBOS } from "@/lib/combos";

// Sem isto o sitemap era gerado só no build e não listava apostilas novas.
export const revalidate = 3600;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sibrap.tec.br";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const paginas: MetadataRoute.Sitemap = [
    { url: siteUrl, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/apostilas`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.95 },
    ...Object.keys(COMBOS).map((slug) => ({ url: `${siteUrl}/combos/${slug}`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.9 })),
    { url: `${siteUrl}/llms.txt`, lastModified: new Date(), changeFrequency: "daily", priority: 0.3 },
    { url: `${siteUrl}/llms-full.txt`, lastModified: new Date(), changeFrequency: "daily", priority: 0.3 },
    { url: `${siteUrl}/bancas`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
    { url: `${siteUrl}/noticias`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${siteUrl}/cursos`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${siteUrl}/cadastro`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${siteUrl}/termos`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.2 },
    { url: `${siteUrl}/privacidade`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.2 },
    { url: `${siteUrl}/sobre`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${siteUrl}/contato`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  ];

  try {
    const { data: cursos } = await criarClienteSupabaseAdmin()
      .from("cursos")
      .select("slug")
      .eq("ativo", true);
    for (const curso of cursos ?? []) {
      paginas.push({
        url: `${siteUrl}/cursos/${curso.slug}`,
        lastModified: new Date(),
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
      paginas.push({ url: `${siteUrl}/bancas/${slugBanca}`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 });
    }
    for (const a of apostilas ?? []) {
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

  return paginas;
}
