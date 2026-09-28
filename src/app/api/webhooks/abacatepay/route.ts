// src/app/api/webhooks/abacatepay/route.ts
//
// Notificações do AbacatePay (v2). Camadas de proteção:
//  1. segredo na URL (?webhookSecret=...) comparado em tempo constante;
//  2. assinatura HMAC-SHA256 do corpo no cabeçalho X-Webhook-Signature;
//  3. o payload só ajuda a LOCALIZAR a cobrança — quem confirma é a
//     consulta à API (confirmarPagamentoAbacate).
// Reentregas trazem o mesmo id de evento; como a confirmação é idempotente,
// não precisa de tabela de deduplicação.

import { NextResponse, type NextRequest } from "next/server";
import { assinaturaValida, confirmarPagamentoAbacate, segredoDaUrlValido } from "@/lib/abacatepay";

const ID_VALIDO = /^[A-Za-z0-9_-]{1,80}$/;

type Payload = {
  event?: string;
  data?: { id?: string; transparent?: { id?: string }; checkout?: { id?: string } };
};

export async function POST(request: NextRequest) {
  const corpo = await request.text();

  if (
    !segredoDaUrlValido(request.nextUrl.searchParams.get("webhookSecret")) ||
    !assinaturaValida(corpo, request.headers.get("x-webhook-signature"))
  ) {
    return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  }

  let payload: Payload;
  try {
    payload = JSON.parse(corpo) as Payload;
  } catch {
    return NextResponse.json({ recebido: true });
  }

  if (payload.event === "transparent.completed") {
    const id = payload.data?.transparent?.id ?? payload.data?.id;
    if (id && ID_VALIDO.test(id)) {
      // A consulta pode ainda enxergar a cobrança como pendente logo após o
      // aviso. Tenta algumas vezes; se não confirmar, responde erro para o
      // AbacatePay reenviar (até 7 tentativas em ~18 h) em vez de perder o pagamento.
      for (let tentativa = 0; tentativa < 4; tentativa++) {
        const r = await confirmarPagamentoAbacate(id);
        if (!("erro" in r) && r.status === "aprovado") return NextResponse.json({ recebido: true });
        if (tentativa < 3) await new Promise((res) => setTimeout(res, 1200));
      }
      return NextResponse.json({ erro: "pagamento ainda não confirmado na consulta" }, { status: 503 });
    }
  }

  return NextResponse.json({ recebido: true });
}
