// src/app/img/[largura]/[...caminho]/route.ts
//
// Imagem reduzida do bucket público "apostilas-capas" (capas, mockups, capas de notícias).
// Busca o original no Supabase, reduz para a largura pedida em WebP (mantém a transparência
// dos mockups) e responde com cache de 1 ano na CDN da Vercel: o Supabase entrega cada
// arquivo praticamente uma vez só, e a CPU da Vercel trabalha só na primeira visita.
// Quem gera estas URLs é src/lib/carregador-imagem.ts (loader do next/image).
// Arquivo trocado no Storage? Suba com nome novo (o admin já põe um número no nome).

import sharp from "sharp";

// as larguras do srcset do next/image (next.config.ts → deviceSizes + imageSizes)
const LARGURAS = new Set([64, 128, 256, 384, 640, 828, 1080, 1280, 1920]);
const CAMINHO_VALIDO = /^[A-Za-z0-9][A-Za-z0-9._\/-]{0,250}$/;
const UM_ANO = 31536000;

export async function GET(_req: Request, { params }: { params: Promise<{ largura: string; caminho: string[] }> }) {
  const { largura, caminho } = await params;
  const w = Number(largura);
  const arquivo = caminho.join("/");
  if (!LARGURAS.has(w) || !CAMINHO_VALIDO.test(arquivo) || arquivo.includes("..")) {
    return new Response("Imagem inválida", { status: 400 });
  }

  const original = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/apostilas-capas/${arquivo}`,
    { cache: "no-store" }
  );
  if (!original.ok) {
    return new Response("Imagem não encontrada", { status: 404, headers: { "Cache-Control": "public, s-maxage=600" } });
  }
  const bytes = Buffer.from(await original.arrayBuffer());

  let corpo: Buffer = bytes;
  let tipo = original.headers.get("content-type") ?? "application/octet-stream";
  try {
    corpo = await sharp(bytes).resize({ width: w, withoutEnlargement: true }).webp({ quality: 72 }).toBuffer();
    tipo = "image/webp";
  } catch {
    // formato que o sharp não lê: entrega o original (ainda assim fica no cache da Vercel)
  }

  return new Response(new Uint8Array(corpo), {
    headers: {
      "Content-Type": tipo,
      "Cache-Control": `public, max-age=${UM_ANO}, s-maxage=${UM_ANO}, immutable`,
    },
  });
}
