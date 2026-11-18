"use server";

import { criarClienteSupabaseServer } from "@/lib/supabase-server";
import { gerarPixParaPedido, type EstadoPix } from "@/lib/pix";
import { PACOTE_ADM } from "@/lib/pacote-administrativo";

// Pacote Administrativo: cria o pedido e gera o PIX. Ao aprovar, o banco libera os certificados (produto_combo_itens).
export async function criarPagamentoPacoteAdmAction(): Promise<EstadoPix> {
  const supabase = await criarClienteSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) {
    return { erro: "Você precisa estar logado com um e-mail válido." };
  }
  const { data: pedidoRows, error } = await supabase.rpc("criar_pedido_por_slug", { p_slug: PACOTE_ADM.produto });
  if (error || !pedidoRows?.[0]) {
    return { erro: error?.message ?? "Não deu pra criar o pedido agora. Tenta de novo." };
  }
  const { pedido_id, produto_nome, valor_centavos } = pedidoRows[0];
  return gerarPixParaPedido({
    supabase,
    pedidoId: pedido_id,
    produtoNome: produto_nome,
    valorCentavos: valor_centavos,
    email: user.email,
    nome: (user.user_metadata as { nome?: string } | undefined)?.nome,
  });
}
