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

export async function GET(req: Request, { params }: { params: Promise<{ largura: string; caminho: string[] }> }) {
  // ?f=jpg: JPEG com fundo branco, para og:image (Facebook/WhatsApp leem JPEG melhor que WebP transparente)
  const jpg = new URL(req.url).searchParams.get("f") === "jpg";
  const { largura, caminho } = await params;
  const w = Number(largura);
  const arquivo = caminho.join("/");
  if (!LARGURAS.has(w) || !CAMINHO_VALIDO.test(arquivo) || arquivo.includes("..")) {
    return new Response("Imagem inválida", { status: 400 });
  }

  // 21/11/2026: o cache da CDN da Vercel zera a cada deploy, e com vários deploys por dia o Supabase
  // reentregava todos os originais (~105 MB/dia de "Cached Egress", perto da cota de 5 GB do plano grátis).
  // O Data Cache do Next sobrevive aos deploys: cada original sai do Supabase uma vez só
  // (arquivos acima de 2 MB não entram no Data Cache e continuam vindo do Supabase).
  const original = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/apostilas-capas/${arquivo}`,
    { cache: "force-cache", next: { revalidate: false, tags: ["img-original"] } }
  );
  if (!original.ok) {
    return new Response("Imagem não encontrada", { status: 404, headers: { "Cache-Control": "public, s-maxage=600" } });
  }
  const bytes = Buffer.from(await original.arrayBuffer());

  let corpo: Buffer = bytes;
  let tipo = original.headers.get("content-type") ?? "application/octet-stream";
  try {
    const base = sharp(bytes).resize({ width: w, withoutEnlargement: true });
    if (jpg) {
      corpo = await base.flatten({ background: "#ffffff" }).jpeg({ quality: 80, mozjpeg: true }).toBuffer();
      tipo = "image/jpeg";
    } else {
      corpo = await base.webp({ quality: 72 }).toBuffer();
      tipo = "image/webp";
    }
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
