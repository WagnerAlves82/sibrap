// src/lib/carregador-imagem.ts
//
// Loader de todas as <Image> do site (next.config.ts → images.loaderFile).
// Imagens do bucket público "apostilas-capas" do Supabase passam por /img/<largura>/<caminho>,
// que entrega uma versão reduzida em WebP e fica no cache da Vercel por 1 ano
// (src/app/img/[largura]/[...caminho]/route.ts). Antes, cada visita baixava o arquivo
// original direto do Supabase (a home puxava ~4,7 MB) e estourou a cota de egress em 11/2026.
// Qualquer outra imagem (arquivos de /public, Wikimedia) segue como está.

const PREFIXO = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/apostilas-capas/`;

export default function carregadorImagem({ src, width }: { src: string; width: number; quality?: number }): string {
  if (!src.startsWith(PREFIXO)) return src;
  return `/img/${width}/${src.slice(PREFIXO.length)}`;
}
