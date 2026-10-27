// src/lib/curso-pago.ts
//
// Um curso é PAGO quando existe produto ativo 'curso-<slug>' ligado a ele
// (os demais são gratuitos; só o certificado é pago). A matrícula em curso
// pago é travada no banco (trigger matriculas_exigir_compra) e liberada ao
// aprovar o pagamento (trigger acessos_matricular_curso), já com o
// certificado online incluso.

import type { SupabaseClient } from "@supabase/supabase-js";

export type ProdutoCurso = { id: string; slug: string; nome: string; preco_centavos: number };

export async function produtoDoCursoPago(supabase: SupabaseClient, cursoSlug: string): Promise<ProdutoCurso | null> {
  const { data } = await supabase
    .from("produtos")
    .select("id, slug, nome, preco_centavos")
    .eq("slug", `curso-${cursoSlug}`)
    .eq("ativo", true)
    .maybeSingle();
  return (data as ProdutoCurso | null) ?? null;
}

export function formatarReais(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
