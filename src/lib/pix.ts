// src/lib/pix.ts
//
// Cria uma order PIX no Mercado Pago (API de Orders) pra um pedido já
// criado no banco e registra o id dela no pedido. Compartilhado pelo
// checkout do Premium e pelo do certificado.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

export type EstadoPix =
  | { erro: string }
  | {
      pedidoId: string;
      qrCode: string;
      qrCodeBase64: string;
    };

export async function gerarPixParaPedido({
  supabase,
  pedidoId,
  produtoNome,
  valorCentavos,
  email,
  nome,
}: {
  supabase: SupabaseClient<Database>;
  pedidoId: string;
  produtoNome: string;
  valorCentavos: number;
  email: string;
  nome?: string;
}): Promise<EstadoPix> {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) {
    return {
      erro:
        "O pagamento ainda não está configurado. Defina MERCADOPAGO_ACCESS_TOKEN no .env.local (e no Vercel, em produção) com o Access Token do Mercado Pago.",
    };
  }

  const valor = (valorCentavos / 100).toFixed(2);
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
        external_reference: pedidoId,
        total_amount: valor,
        description: produtoNome,
        payer: {
          email,
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
    p_pedido_id: pedidoId,
    p_order_id: mpData.id,
    p_payment_id: pagamento?.id ? String(pagamento.id) : undefined,
  });

  return { pedidoId, qrCode, qrCodeBase64 };
}
