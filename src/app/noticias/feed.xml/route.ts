import { criarClienteSupabaseAdmin } from "@/lib/supabase-admin";
import { capaDoPost, resumoAutomatico } from "@/lib/blog";

// /noticias/feed.xml — RSS das notícias. Leitores de feed, o Google Notícias e buscadores com IA
// (Perplexity, Bing/ChatGPT) usam o feed para descobrir matérias novas mais rápido que pelo sitemap.
export const revalidate = 1800;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sibrap.tec.br";

function xml(texto: string): string {
  return texto.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export async function GET() {
  let itens = "";
  try {
    const { data } = await criarClienteSupabaseAdmin()
      .from("posts")
      .select("*")
      .eq("status", "publicada")
      .order("publicado_em", { ascending: false })
      .limit(50);
    for (const p of data ?? []) {
      const url = `${siteUrl}/noticias/${p.slug}`;
      const capa = capaDoPost(p);
      itens += `
    <item>
      <title>${xml(p.titulo)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${new Date(p.publicado_em ?? p.criado_em).toUTCString()}</pubDate>
      <category>${xml(p.categoria)}</category>${p.uf ? `\n      <category>${xml(p.uf)}</category>` : ""}
      <description>${xml(p.resumo || p.seo_descricao || resumoAutomatico(p.conteudo))}</description>${
        capa ? `\n      <enclosure url="${xml(capa)}" type="image/${/\.webp$/i.test(capa) ? "webp" : /\.jpe?g$/i.test(capa) ? "jpeg" : "png"}" length="0" />` : ""
      }
    </item>`;
    }
  } catch {
    // sem a chave de serviço (ex.: build local): feed vazio
  }

  const corpo = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>SIBRAP Notícias — concursos públicos e processos seletivos</title>
    <link>${siteUrl}/noticias</link>
    <atom:link href="${siteUrl}/noticias/feed.xml" rel="self" type="application/rss+xml" />
    <description>Editais abertos de concursos públicos e processos seletivos em todo o Brasil: vagas, salários, inscrições e datas de prova.</description>
    <language>pt-BR</language>${itens}
  </channel>
</rss>
`;
  return new Response(corpo, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
