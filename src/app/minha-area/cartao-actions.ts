"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { criarClienteSupabaseServer } from "@/lib/supabase-server";
import { criarClienteSupabaseAdmin } from "@/lib/supabase-admin";
import { pagarPedidoComCartao, type DadosCartao, type EstadoCartao } from "@/lib/cartao-transparente";

// Pagamento no cartão de qualquer produto (apostila, combo, certificado, curso, Premium).
// O pedido é criado pela mesma RPC do PIX: ela confere login, produto ativo e preço no banco.
export async function pagarComCartaoAction(produtoSlug: string, dados: DadosCartao, cupom?: string): Promise<EstadoCartao> {
  if (!/^[a-z0-9-]{3,100}$/.test(produtoSlug)) return { erro: "Produto não encontrado." };

  const supabase = await criarClienteSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) return { erro: "Você precisa estar logado com um e-mail válido." };

  // cupons marcados como só PIX (cupons.so_pix) não dão desconto no cartão
  let cupomValido = cupom?.trim().toLowerCase().slice(0, 40) || undefined;
  if (cupomValido) {
    const { data: c } = await (criarClienteSupabaseAdmin() as unknown as SupabaseClient)
      .from("cupons")
      .select("so_pix")
      .eq("codigo", cupomValido)
      .maybeSingle();
    if (c?.so_pix) cupomValido = undefined;
  }

  const { data: pedidoRows, error } = await supabase.rpc("criar_pedido_por_slug", {
    p_slug: produtoSlug,
    ...(cupomValido ? { p_cupom: cupomValido } : {}),
  });
  if (error || !pedidoRows?.[0]) {
    return { erro: error?.message ?? "Não deu pra criar o pedido agora. Tenta de novo." };
  }
  const { pedido_id, valor_centavos } = pedidoRows[0];
  return pagarPedidoComCartao({ pedidoId: pedido_id, valorCentavos: valor_centavos, email: user.email, dados });
}
