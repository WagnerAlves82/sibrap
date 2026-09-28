// src/lib/apostilas.ts
//
// Catálogo de apostilas à venda: tipos, listas fixas e formatadores
// compartilhados pela vitrine, pela página da apostila, pelo checkout e
// pelo admin. Os dados ficam na tabela `apostilas` (metadados públicos) e
// no `produtos` (preço, pedido, acesso). O PDF fica num bucket privado.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

export type ApostilaRow = Database["public"]["Tables"]["apostilas"]["Row"];
export type ApostilaVitrine = ApostilaRow & { preco_centavos: number };

export const CATEGORIAS = [
  "Educação",
  "Administrativo",
  "Saúde",
  "Segurança",
  "Técnico",
  "Jurídico",
  "Informática",
  "Outros",
] as const;

export const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA",
  "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
] as const;

export const BUCKET_CAPAS = "apostilas-capas";
export const BUCKET_PDFS = "apostilas-pagas";

export function urlCapa(path: string | null | undefined): string | null {
  if (!path) return null;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return `${base}/storage/v1/object/public/${BUCKET_CAPAS}/${path}`;
}

// Imagem principal para vitrine/cards: o primeiro mockup (livro 3D, fundo
// transparente) quando existir; senão a capa plana.
export function imagemDeVitrine(a: Pick<ApostilaRow, "imagens" | "capa_path">): {
  url: string;
  mockup: boolean;
} | null {
  const mockup = urlCapa(a.imagens?.[0]);
  if (mockup) return { url: mockup, mockup: true };
  const capa = urlCapa(a.capa_path);
  return capa ? { url: capa, mockup: false } : null;
}

// Parcelamento no cartão. Só aparece no site quando o pagamento por cartão
// existir de fato (hoje a venda é só por PIX, à vista): anunciar parcelas
// que o cliente não consegue usar seria propaganda enganosa.
export const PARCELAMENTO = { ativo: false, parcelas: 5 } as const;

export function textoParcela(centavos: number, parcelas = PARCELAMENTO.parcelas): string {
  return `${parcelas}x de ${formatarPreco(Math.round(centavos / parcelas))}`;
}

// Percentual só existe quando há um preço de referência real cadastrado
// (preço praticado antes, ou promoção por tempo limitado).
export function descontoPercentual(
  original: number | null | undefined,
  atual: number
): number | null {
  if (!original || original <= atual) return null;
  return Math.round((1 - atual / original) * 100);
}

export function formatarPreco(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// Datas do banco vêm como "2026-11-22" — formatamos na mão para não
// "andar um dia" por causa do fuso horário.
export function formatarDataIso(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const [a, m, d] = iso.slice(0, 10).split("-");
  return a && m && d ? `${d}/${m}/${a}` : null;
}

export function diasAte(iso: string | null | undefined, hoje = new Date()): number | null {
  if (!iso) return null;
  const [a, m, d] = iso.slice(0, 10).split("-").map(Number);
  if (!a || !m || !d) return null;
  const alvo = Date.UTC(a, m - 1, d);
  const base = Date.UTC(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  return Math.round((alvo - base) / 86_400_000);
}

export function slugValido(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length <= 80;
}

// Apostilas publicadas (o RLS já esconde os rascunhos de quem não é admin)
export async function listarApostilasPublicadas(
  supabase: SupabaseClient<Database>
): Promise<ApostilaVitrine[]> {
  const { data } = await supabase
    .from("apostilas")
    .select("*, produtos(preco_centavos)")
    .eq("status", "publicada")
    .order("ordem")
    .order("data_prova", { nullsFirst: false });

  return (data ?? [])
    .filter((a) => a.produtos)
    .map(({ produtos, ...resto }) => ({
      ...resto,
      preco_centavos: produtos!.preco_centavos,
    }));
}
