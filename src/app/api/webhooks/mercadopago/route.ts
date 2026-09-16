// src/app/api/webhooks/mercadopago/route.ts
//
// Recebe as notificações do Mercado Pago (API de Orders / PIX). Nunca
// confia no corpo da notificação sozinho pra liberar acesso — sempre
// confirma consultando a order pelo id que a gente mesmo salvou em
// `pedidos.mercadopago_order_id` (mesmo padrão já validado em produção
// no app irmão Hudson Drive). Sempre responde 200 pro Mercado Pago não
// ficar reenviando em loop.

import { NextResponse, type NextRequest } from "next/server";
import { criarClienteSupabaseAdmin } from "@/lib/supabase-admin";
import { confirmarPagamentoPorOrderId } from "@/lib/mercadopago";

async function processarNotificacao(request: NextRequest) {
  let payload: unknown = null;
  try {
    payload = await request.json();
  } catch {
    // notificações antigas (IPN) vêm só por query string, sem body
  }

  const data = (payload as { data?: { id?: string | number; external_reference?: string; status?: string } })
    ?.data;

  const supabaseAdmin = criarClienteSupabaseAdmin();

  // Caminho rápido: a notificação já trouxe external_reference (o
  // nosso pedido_id) e o status "processed" direto no payload
  if (data?.external_reference && data.status === "processed") {
    const { data: pedido } = await supabaseAdmin
      .from("pedidos")
      .select("mercadopago_order_id")
      .eq("id", data.external_reference)
      .maybeSingle();

    if (pedido?.mercadopago_order_id) {
      await confirmarPagamentoPorOrderId(pedido.mercadopago_order_id);
    }
    return NextResponse.json({ recebido: true });
  }

  // Caminho de reforço: usa o id recebido (pode ser id de order ou de
  // payment, dependendo do tipo de notificação) só pra LOCALIZAR o
  // pedido — a consulta de confirmação sempre usa o order_id que a
  // gente mesmo salvou, nunca o id vindo da notificação diretamente.
  const url = new URL(request.url);
  const idRecebido =
    data?.id != null
      ? String(data.id)
      : (url.searchParams.get("data.id") ?? url.searchParams.get("id"));

  if (!idRecebido) {
    return NextResponse.json({ recebido: true });
  }

  const { data: pedido } = await supabaseAdmin
    .from("pedidos")
    .select("mercadopago_order_id")
    .or(`mercadopago_order_id.eq.${idRecebido},mercadopago_payment_id.eq.${idRecebido}`)
    .maybeSingle();

  if (!pedido?.mercadopago_order_id) {
    return NextResponse.json({ recebido: true });
  }

  await confirmarPagamentoPorOrderId(pedido.mercadopago_order_id);
  return NextResponse.json({ recebido: true });
}

export async function POST(request: NextRequest) {
  return processarNotificacao(request);
}

export async function GET(request: NextRequest) {
  return processarNotificacao(request);
}
