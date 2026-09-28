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
