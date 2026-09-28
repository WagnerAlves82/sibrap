// src/app/api/webhooks/mercadopago/route.ts
//
// Recebe as notificações do Mercado Pago (API de Orders / PIX).
//
// Camadas de proteção:
//  1. Assinatura: com MERCADOPAGO_WEBHOOK_SECRET configurada, só aceita
//     notificações com o cabeçalho x-signature válido (HMAC-SHA256).
//  2. Nunca confia no corpo: o id recebido serve só para LOCALIZAR o pedido;
//     a confirmação sempre consulta a API do Mercado Pago pelo order_id que
//     a gente mesmo salvou e confere referência externa e valor.
//  3. Entrada validada: o id só pode ter letras, números, "_" e "-" (nada
//     é interpolado em filtros do banco).
// Sempre responde 200 (exceto assinatura inválida) para o Mercado Pago não
// reenviar em loop.

import crypto from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { criarClienteSupabaseAdmin } from "@/lib/supabase-admin";
import { confirmarPagamentoPorOrderId } from "@/lib/mercadopago";

const ID_VALIDO = /^[A-Za-z0-9_-]{1,64}$/;

function assinaturaValida(request: NextRequest, idDaNotificacao: string | null): boolean {
  const segredo = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!segredo) return true; // sem segredo configurado: só a camada 2 protege

  const cabecalho = request.headers.get("x-signature") ?? "";
  const partes = Object.fromEntries(
    cabecalho.split(",").map((p) => {
      const i = p.indexOf("=");
      return [p.slice(0, i).trim(), p.slice(i + 1).trim()];
    })
  );
  const ts = partes.ts;
  const v1 = partes.v1;
  if (!ts || !v1) return false;

  const requestId = request.headers.get("x-request-id") ?? "";
  const id = idDaNotificacao && /^[A-Za-z0-9]+$/.test(idDaNotificacao) ? idDaNotificacao.toLowerCase() : (idDaNotificacao ?? "");
  const manifesto = `id:${id};request-id:${requestId};ts:${ts};`;
  const esperado = crypto.createHmac("sha256", segredo).update(manifesto).digest("hex");

  const a = Buffer.from(v1);
  const b = Buffer.from(esperado);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

async function processarNotificacao(request: NextRequest) {
  let payload: unknown = null;
  try {
    payload = await request.json();
  } catch {
    // notificações antigas (IPN) vêm só por query string, sem body
  }

  const data = (payload as { data?: { id?: string | number; external_reference?: string; status?: string } })
    ?.data;
  const url = new URL(request.url);

  // O Mercado Pago assina usando o data.id da query string
  const idDaQuery = url.searchParams.get("data.id");
  if (!assinaturaValida(request, idDaQuery ?? (data?.id != null ? String(data.id) : null))) {
    return NextResponse.json({ erro: "assinatura inválida" }, { status: 401 });
  }

  const supabaseAdmin = criarClienteSupabaseAdmin();

  // Caminho rápido: a notificação já trouxe external_reference (o nosso
  // pedido_id) e o status "processed"
  if (data?.external_reference && data.status === "processed" && ID_VALIDO.test(data.external_reference)) {
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

  // Caminho de reforço: o id recebido (de order ou de payment) só localiza
  // o pedido.
  const idRecebido =
    data?.id != null ? String(data.id) : (idDaQuery ?? url.searchParams.get("id"));

  if (!idRecebido || !ID_VALIDO.test(idRecebido)) {
    return NextResponse.json({ recebido: true });
  }

  let orderId: string | null = null;
  const porOrder = await supabaseAdmin
    .from("pedidos")
    .select("mercadopago_order_id")
    .eq("mercadopago_order_id", idRecebido)
    .maybeSingle();
  orderId = porOrder.data?.mercadopago_order_id ?? null;

  if (!orderId) {
    const porPagamento = await supabaseAdmin
      .from("pedidos")
      .select("mercadopago_order_id")
      .eq("mercadopago_payment_id", idRecebido)
      .maybeSingle();
    orderId = porPagamento.data?.mercadopago_order_id ?? null;
  }

  if (orderId) await confirmarPagamentoPorOrderId(orderId);
  return NextResponse.json({ recebido: true });
}

export async function POST(request: NextRequest) {
  return processarNotificacao(request);
}

// Sem GET: o formato antigo (IPN) por query string não traz assinatura e o
// Mercado Pago usa POST nas notificações de Orders.
export async function GET() {
  return NextResponse.json({ ok: true });
}
