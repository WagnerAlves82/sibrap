import { criarClienteSupabaseAdmin } from "@/lib/supabase-admin";
import { imagemDeVitrine, type ApostilaVitrine } from "@/lib/apostilas";

// Feed das apostilas publicadas para os anúncios dinâmicos do Google Ads
// (Display/remarketing e Performance Max). Preço cheio em `price` e o preço
// final em `sale_price` quando há desconto — é o que o Google usa pra
// mostrar "de/por" no anúncio. Mapeie as colunas ao importar no Google Ads.
export const revalidate = 3600;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sibrap.tec.br";

const COLUNAS = [
  "id", "title", "description", "link", "image_link", "price", "sale_price",
  "availability", "condition", "brand", "product_type", "custom_label_0", "custom_label_1",
] as const;

function celula(v: string): string {
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

const moeda = (centavos: number) => `${(centavos / 100).toFixed(2)} BRL`;

export async function GET() {
  const { data } = await criarClienteSupabaseAdmin()
    .from("apostilas")
    .select("*, produtos(preco_centavos)")
    .eq("status", "publicada")
    .order("ordem");

  const linhas = [COLUNAS.join(",")];
  for (const { produtos, ...resto } of data ?? []) {
    if (!produtos) continue;
    const a = { ...resto, preco_centavos: produtos.preco_centavos } as ApostilaVitrine;
    const imagem = imagemDeVitrine(a);
    if (!imagem) continue; // anúncio dinâmico exige imagem
    const original = a.preco_original_centavos;
    const comDesconto = !!original && original > a.preco_centavos;
    const descricao =
      a.descricao?.trim() ||
      `Apostila ${a.orgao} (${a.cargo}) com questões comentadas no estilo da banca e simulado online.`;
    const valores: Record<(typeof COLUNAS)[number], string> = {
      id: a.slug,
      title: a.titulo.slice(0, 150),
      description: descricao.slice(0, 5000),
      link: `${siteUrl}/apostilas/${a.slug}?utm_source=google&utm_medium=cpc&utm_campaign=display_dinamico`,
      image_link: imagem.url,
      price: moeda(comDesconto ? original! : a.preco_centavos),
      sale_price: comDesconto ? moeda(a.preco_centavos) : "",
      availability: "in_stock",
      condition: "new",
      brand: "SIBRAP",
      product_type: `Concursos > ${a.uf} > ${a.categoria}`,
      custom_label_0: a.uf,
      custom_label_1: a.categoria,
    };
    linhas.push(COLUNAS.map((c) => celula(valores[c])).join(","));
  }

  return new Response(linhas.join("\n") + "\n", {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Cache-Control": "public, s-maxage=3600" },
  });
}
