import type { MetadataRoute } from "next";
import { criarClienteSupabaseAdmin } from "@/lib/supabase-admin";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sibrap.tec.br";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const paginas: MetadataRoute.Sitemap = [
    { url: siteUrl, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/cursos`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${siteUrl}/cadastro`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${siteUrl}/validar`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${siteUrl}/login`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
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
  } catch {
    // sem a chave de serviço (ex.: build local): fica só com as páginas fixas
  }

  return paginas;
}
