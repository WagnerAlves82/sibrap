// src/app/api/diagnostico/cartao/route.ts
//
// POST: tenta abrir um checkout de CARTÃO no AbacatePay com a chave de
// produção, para descobrir se a conta já está liberada para cartão. Não cobra
// ninguém e não grava nada no banco (o checkout fica sem pagamento e expira).
// Chamado pelo GitHub Actions (.github/workflows/diagnostico-cartao.yml) com
// "Authorization: Bearer <VIGIA_SECRET>", comparado em tempo constante.

import crypto from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { abacatePayAtivo, criarCheckoutCartao } from "@/lib/abacatepay";
import { criarClienteSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sibrap.tec.br";

function autorizado(request: NextRequest): boolean {
  const recebido = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const segredo = process.env.VIGIA_SECRET;
  if (!recebido || !segredo || segredo.length < 32) return false;
  const a = Buffer.from(recebido);
  const b = Buffer.from(segredo);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function POST(request: NextRequest) {
  if (!autorizado(request)) return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  if (!abacatePayAtivo()) {
    return NextResponse.json({ ok: false, erro: "AbacatePay inativo (ABACATEPAY_API_KEY ausente ou PIX_GATEWAY=mercadopago)" }, { status: 503 });
  }

  const { data: apostila } = await criarClienteSupabaseAdmin()
    .from("apostilas")
    .select("slug, titulo, produtos(preco_centavos)")
    .eq("status", "publicada")
    .order("ordem")
    .limit(1)
    .maybeSingle();
  const preco = apostila?.produtos?.preco_centavos;
  if (!apostila || !preco) return NextResponse.json({ ok: false, erro: "nenhuma apostila publicada com preço" }, { status: 500 });

  try {
    const checkout = await criarCheckoutCartao({
      valorCentavos: preco,
      descricao: apostila.titulo,
      pedidoId: `diagnostico-${Date.now()}`,
      produtoExternalId: apostila.slug,
      returnUrl: `${siteUrl}/apostilas/${apostila.slug}`,
      completionUrl: `${siteUrl}/apostilas/${apostila.slug}`,
    });
    return NextResponse.json({ ok: true, cartao: "liberado", produto: apostila.slug, checkout: checkout.id, host: new URL(checkout.url).host });
  } catch (e) {
    return NextResponse.json({ ok: false, cartao: "recusado ou indisponível", erro: e instanceof Error ? e.message : String(e) }, { status: 502 });
  }
}
