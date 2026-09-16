// src/lib/mercadopago.ts
//
// Helpers compartilhados de integração com o Mercado Pago (API de
// Orders, pagamento via PIX). Mesmo padrão já validado em produção no
// app irmão (Hudson Drive): cria a order com QR Code PIX embutido,
// nunca confia cegamente no corpo de notificações — sempre confirma
// consultando a API do Mercado Pago pelo id que a gente mesmo salvou.

import { criarClienteSupabaseAdmin } from "@/lib/supabase-admin";

export type StatusPedido = "pendente" | "aprovado" | "recusado";

function mapStatusOrder(statusMp: string): StatusPedido {
  if (statusMp === "processed") return "aprovado";
  if (statusMp === "cancelled" || statusMp === "expired") return "recusado";
  return "pendente";
}

/**
 * Consulta o status real de uma order no Mercado Pago (pelo id que a
 * gente mesmo salvou em `pedidos.mercadopago_order_id`) e atualiza
 * `pedidos.status` de acordo. O trigger `conceder_acesso_apos_pagamento`
 * libera o acesso automaticamente quando o status vira 'aprovado'.
 */
export async function confirmarPagamentoPorOrderId(
  orderId: string
): Promise<{ status: StatusPedido } | { erro: string }> {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) {
    return { erro: "MERCADOPAGO_ACCESS_TOKEN não configurada" };
  }

  const resposta = await fetch(`https://api.mercadopago.com/v1/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!resposta.ok) {
    return { erro: `Erro ao consultar order no Mercado Pago (${resposta.status})` };
  }

  const order = await resposta.json();
  const status = mapStatusOrder(order.status as string);
  const paymentId = order.transactions?.payments?.[0]?.id
    ? String(order.transactions.payments[0].id)
    : null;

  const supabaseAdmin = criarClienteSupabaseAdmin();
  const { error } = await supabaseAdmin
    .from("pedidos")
    .update({
      status,
      ...(paymentId ? { mercadopago_payment_id: paymentId } : {}),
    })
    .eq("mercadopago_order_id", orderId)
    .neq("status", "aprovado");

  if (error) {
    return { erro: error.message };
  }

  return { status };
}
