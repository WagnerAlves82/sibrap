"use server";

import { criarClienteSupabaseServer } from "@/lib/supabase-server";
import { gerarPixParaPedido, type EstadoPix } from "@/lib/pix";
import { slugValido } from "@/lib/apostilas";

export async function criarPagamentoApostilaAction(slug: string): Promise<EstadoPix> {
  if (!slugValido(slug)) return { erro: "Apostila não encontrada." };

  const supabase = await criarClienteSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) {
    return { erro: "Você precisa estar logado com um e-mail válido." };
  }

  // O slug do produto segue o da apostila; a função do banco só cria o
  // pedido se o produto estiver ativo e a pessoa ainda não tiver acesso.
  const { data: apostila } = await supabase
    .from("apostilas")
    .select("produtos(slug)")
    .eq("slug", slug)
    .eq("status", "publicada")
    .maybeSingle();
  const produtoSlug = apostila?.produtos?.slug;
  if (!produtoSlug) return { erro: "Esta apostila não está disponível para compra agora." };

  const { data: pedidoRows, error } = await supabase.rpc("criar_pedido_por_slug", {
    p_slug: produtoSlug,
  });
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
