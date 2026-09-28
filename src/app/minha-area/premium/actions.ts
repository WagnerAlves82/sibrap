"use server";

import { criarClienteSupabaseServer } from "@/lib/supabase-server";
import { confirmarPagamentoPorOrderId } from "@/lib/mercadopago";
import { confirmarPagamentoAbacate, confirmarPagamentoAbacateCheckout } from "@/lib/abacatepay";
import { gerarPixParaPedido, type EstadoPix } from "@/lib/pix";

export async function criarPagamentoPixAction(): Promise<EstadoPix> {
  const supabase = await criarClienteSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return { erro: "Você precisa estar logado com um e-mail válido." };
  }

  const { data: pedidoRows, error: erroPedido } = await supabase.rpc(
    "criar_pedido_premium"
  );

  if (erroPedido || !pedidoRows?.[0]) {
    return { erro: "Não deu pra criar o pedido agora. Tenta de novo." };
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

export async function verificarPagamentoPixAction(
  pedidoId: string
): Promise<{ status: "pendente" | "aprovado" | "recusado" } | { erro: string }> {
  const supabase = await criarClienteSupabaseServer();
  const { data: pedido, error } = await supabase
    .from("pedidos")
    .select("status, mercadopago_order_id, gateway, gateway_charge_id")
    .eq("id", pedidoId)
    .single();

  if (error || !pedido) {
    return { erro: "Pedido não encontrado." };
  }

  if (pedido.status !== "pendente") {
    return { status: pedido.status as "pendente" | "aprovado" | "recusado" };
  }

  if (pedido.gateway === "abacatepay") {
    if (!pedido.gateway_charge_id) return { status: "pendente" };
    const r = await confirmarPagamentoAbacate(pedido.gateway_charge_id);
    return "erro" in r ? { status: "pendente" } : { status: r.status };
  }

  if (pedido.gateway === "abacatepay_checkout") {
    if (!pedido.gateway_charge_id) return { status: "pendente" };
    const r = await confirmarPagamentoAbacateCheckout(pedido.gateway_charge_id);
    return "erro" in r ? { status: "pendente" } : { status: r.status };
  }

  if (!pedido.mercadopago_order_id) {
    return { status: "pendente" };
  }

  const resultado = await confirmarPagamentoPorOrderId(pedido.mercadopago_order_id);
  if ("erro" in resultado) {
    return { status: "pendente" };
  }

  return { status: resultado.status };
}
