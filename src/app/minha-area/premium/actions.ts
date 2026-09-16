"use server";

import { criarClienteSupabaseServer } from "@/lib/supabase-server";
import { confirmarPagamentoPorOrderId } from "@/lib/mercadopago";

export type EstadoPix =
  | { erro: string }
  | {
      pedidoId: string;
      qrCode: string;
      qrCodeBase64: string;
    };

export async function criarPagamentoPixAction(): Promise<EstadoPix> {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) {
    return {
      erro:
        "O pagamento ainda não está configurado. Defina MERCADOPAGO_ACCESS_TOKEN no .env.local (e no Vercel, em produção) com o Access Token do Mercado Pago.",
    };
  }

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
  const valor = (valor_centavos / 100).toFixed(2);
  const nome = (user.user_metadata as { nome?: string } | undefined)?.nome;
  const primeiroNome = nome?.split(" ")[0] ?? "Cliente";

  let resposta: Response;
  try {
    resposta = await fetch("https://api.mercadopago.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "X-Idempotency-Key": crypto.randomUUID(),
      },
      body: JSON.stringify({
        type: "online",
        external_reference: pedido_id,
        total_amount: valor,
        description: produto_nome,
        payer: {
          email: user.email,
          first_name: primeiroNome,
        },
        transactions: {
          payments: [
            {
              amount: valor,
              payment_method: { id: "pix", type: "bank_transfer" },
            },
          ],
        },
      }),
    });
  } catch {
    return { erro: "Não deu pra falar com o Mercado Pago agora. Tenta de novo." };
  }

  const mpData = await resposta.json();

  if (!resposta.ok) {
    return { erro: "Não deu pra gerar o PIX agora. Tenta de novo." };
  }

  const pagamento = mpData.transactions?.payments?.[0];
  const qrCode = pagamento?.payment_method?.qr_code;
  const qrCodeBase64 = pagamento?.payment_method?.qr_code_base64;

  if (!qrCode || !qrCodeBase64) {
    return { erro: "O Mercado Pago não retornou o QR Code do PIX. Tenta de novo." };
  }

  await supabase.rpc("registrar_order_pagamento", {
    p_pedido_id: pedido_id,
    p_order_id: mpData.id,
    p_payment_id: pagamento?.id ? String(pagamento.id) : undefined,
  });

  return { pedidoId: pedido_id, qrCode, qrCodeBase64 };
}

export async function verificarPagamentoPixAction(
  pedidoId: string
): Promise<{ status: "pendente" | "aprovado" | "recusado" } | { erro: string }> {
  const supabase = await criarClienteSupabaseServer();
  const { data: pedido, error } = await supabase
    .from("pedidos")
    .select("status, mercadopago_order_id")
    .eq("id", pedidoId)
    .single();

  if (error || !pedido) {
    return { erro: "Pedido não encontrado." };
  }

  if (pedido.status !== "pendente" || !pedido.mercadopago_order_id) {
    return { status: pedido.status as "pendente" | "aprovado" | "recusado" };
  }

  const resultado = await confirmarPagamentoPorOrderId(pedido.mercadopago_order_id);
  if ("erro" in resultado) {
    return { status: "pendente" };
  }

  return { status: resultado.status };
}
