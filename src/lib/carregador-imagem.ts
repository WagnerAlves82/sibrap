// src/lib/carregador-imagem.ts
//
// Loader de todas as <Image> do site (next.config.ts → images.loaderFile).
// Imagens do bucket público "apostilas-capas" do Supabase passam por /img/<largura>/<caminho>,
// que entrega uma versão reduzida em WebP e fica no cache da Vercel por 1 ano
// (src/app/img/[largura]/[...caminho]/route.ts). Antes, cada visita baixava o arquivo
// original direto do Supabase (a home puxava ~4,7 MB) e estourou a cota de egress em 11/2026.
// Qualquer outra imagem (arquivos de /public, Wikimedia) segue como está.

const PREFIXO = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/apostilas-capas/`;

/**
 * Imagem de compartilhamento (og:image / twitter) servida pela Vercel em vez do Supabase:
 * o robô do Facebook buscava as capas direto do Storage (~34 MB/dia de egress, 21/11/2026).
 * Imagens que não são do bucket de capas voltam iguais.
 */
export function imagemParaCompartilhar(src: string | null | undefined, largura = 1080): string | undefined {
  if (!src) return undefined;
  if (!src.startsWith(PREFIXO)) return src;
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.sibrap.tec.br";
  return `${site}/img/${largura}/${src.slice(PREFIXO.length)}?f=jpg`;
}

export default function carregadorImagem({ src, width }: { src: string; width: number; quality?: number }): string {
  if (!src.startsWith(PREFIXO)) return src;
  return `/img/${width}/${src.slice(PREFIXO.length)}`;
}
