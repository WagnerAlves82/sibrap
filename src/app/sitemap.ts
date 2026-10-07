import type { MetadataRoute } from "next";
import { criarClienteSupabaseAdmin } from "@/lib/supabase-admin";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sibrap.tec.br";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const paginas: MetadataRoute.Sitemap = [
    { url: siteUrl, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/apostilas`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.95 },
    { url: `${siteUrl}/blog`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
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
        url: `${siteUrl}/blog/${p.slug}`,
        lastModified: new Date(p.atualizado_em),
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }
  } catch {
    // sem a chave de serviço (ex.: build local): fica só com as páginas fixas
  }

  return paginas;
}
