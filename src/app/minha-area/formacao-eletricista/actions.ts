"use server";

import { criarClienteSupabaseServer } from "@/lib/supabase-server";
import { gerarPixParaPedido, type EstadoPix } from "@/lib/pix";
import { produtoPixFormacao } from "@/lib/formacao-eletricista";

// Formação Inicial para Eletricista: cria o pedido do produto do PIX (promocional até 30/11, cupom FORMACAO2027) e gera o PIX.
// Ao aprovar, o banco libera os 3 cursos (já matriculando) e os 3 certificados.
export async function criarPagamentoFormacaoAction(): Promise<EstadoPix> {
  const supabase = await criarClienteSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) {
    return { erro: "Você precisa estar logado com um e-mail válido." };
  }
  const { data: pedidoRows, error } = await supabase.rpc("criar_pedido_por_slug", { p_slug: produtoPixFormacao() });
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
