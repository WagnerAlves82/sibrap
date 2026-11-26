// Oferta "Informática + 1 curso" (Wagner, 26/11/2026): 2 certificados de carga completa por R$ 42,60,
// o de Informática Básica com IA e mais um curso livre à escolha (fora os pagos e os profissionalizantes).
// Só para quem deixou o e-mail no pop-up de saída (tabela `leads`, lida só no servidor) e recebeu o convite,
// até a data abaixo. Nenhum e-mail de cliente fica no código.
// No banco: um produto por escolha, `oferta-informatica-mais-<curso>`, com o combo dos 2 certificados.

import { criarClienteSupabaseAdmin } from "@/lib/supabase-admin";

export const OFERTA_INFORMATICA = {
  caminho: "/minha-area/oferta-informatica",
  cursoBase: "informatica-basica-ia",
  prefixoProduto: "oferta-informatica-mais-",
  precoCentavos: 4260,
  validoAte: "2026-12-03T23:59:59-03:00",
} as const;

export async function ofertaInformaticaValida(email: string | null | undefined): Promise<boolean> {
  if (!email || Date.now() > new Date(OFERTA_INFORMATICA.validoAte).getTime()) return false;
  const { data } = await criarClienteSupabaseAdmin().from("leads").select("id").eq("email", email.toLowerCase()).limit(1);
  return (data ?? []).length > 0;
}

export const produtoOfertaInformatica = (cursoSlug: string) => `${OFERTA_INFORMATICA.prefixoProduto}${cursoSlug}`;
