"use server";

import { criarClienteSupabaseServer } from "@/lib/supabase-server";
import { gerarPixParaPedido, type EstadoPix } from "@/lib/pix";
import { slugValido } from "@/lib/apostilas";

type PedidoDaApostilaErro = { ok: false; erro: string };
type PedidoDaApostilaOk = {
  ok: true;
  supabase: Awaited<ReturnType<typeof criarClienteSupabaseServer>>;
  user: { id: string; email: string; user_metadata: unknown };
  produtoSlug: string;
  pedido: { pedido_id: string; produto_nome: string; valor_centavos: number };
};

/** Cria o pedido pendente (RPC) e devolve o essencial pra gerar a cobrança,
 * ou o erro já formatado — usado pelo PIX (o cartão cria o pedido em cartao-actions.ts). */
async function criarPedidoDaApostila(slug: string, combo = false): Promise<PedidoDaApostilaErro | PedidoDaApostilaOk> {
  if (!slugValido(slug)) return { ok: false, erro: "Apostila não encontrada." };

  const supabase = await criarClienteSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) {
    return { ok: false, erro: "Você precisa estar logado com um e-mail válido." };
  }

  const { data: apostila } = await supabase
    .from("apostilas")
    .select("produtos(slug)")
    .eq("slug", slug)
    .eq("status", "publicada")
    .maybeSingle();
  // combo: o produto do combo tem o mesmo slug do da apostila, com prefixo "combo-"
  const produtoSlug = combo ? apostila?.produtos?.slug?.replace(/^apostila-/, "combo-") : apostila?.produtos?.slug;
  if (!produtoSlug) return { ok: false, erro: "Esta apostila não está disponível para compra agora." };

  const { data: pedidoRows, error } = await supabase.rpc("criar_pedido_por_slug", {
    p_slug: produtoSlug,
  });
  if (error || !pedidoRows?.[0]) {
    return { ok: false, erro: error?.message ?? "Não deu pra criar o pedido agora. Tenta de novo." };
  }

  return { ok: true, supabase, user: { id: user.id, email: user.email, user_metadata: user.user_metadata }, produtoSlug, pedido: pedidoRows[0] };
}

export async function criarPagamentoApostilaAction(slug: string, combo = false): Promise<EstadoPix> {
  const r = await criarPedidoDaApostila(slug, combo);
  if (!r.ok) return { erro: r.erro };
  const { supabase, user, pedido } = r;
  return gerarPixParaPedido({
    supabase,
    pedidoId: pedido.pedido_id,
    produtoNome: pedido.produto_nome,
    valorCentavos: pedido.valor_centavos,
    email: user.email,
    nome: (user.user_metadata as { nome?: string } | undefined)?.nome,
  });
}
