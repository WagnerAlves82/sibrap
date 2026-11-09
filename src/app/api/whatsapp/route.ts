// src/app/api/whatsapp/route.ts
//
// Webhook do WhatsApp (API de Nuvem da Meta).
// GET: confirmação do endereço (a Meta manda hub.verify_token, que precisa bater com WHATSAPP_VERIFY_TOKEN).
// POST: mensagens recebidas e status. A assinatura X-Hub-Signature-256 é conferida com WHATSAPP_APP_SECRET;
// sem assinatura válida nada é gravado. Fase 1: só registra as mensagens (o robô de respostas vem depois).

import crypto from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { criarClienteSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const esperado = process.env.WHATSAPP_VERIFY_TOKEN;
  if (esperado && p.get("hub.mode") === "subscribe" && p.get("hub.verify_token") === esperado) {
    return new NextResponse(p.get("hub.challenge") ?? "", { status: 200, headers: { "Content-Type": "text/plain" } });
  }
  return new NextResponse("forbidden", { status: 403 });
}

function assinaturaValida(corpo: string, cabecalho: string | null): boolean {
  const segredo = process.env.WHATSAPP_APP_SECRET;
  if (!segredo || !cabecalho?.startsWith("sha256=")) return false;
  const esperado = Buffer.from("sha256=" + crypto.createHmac("sha256", segredo).update(corpo).digest("hex"));
  const recebido = Buffer.from(cabecalho);
  return esperado.length === recebido.length && crypto.timingSafeEqual(esperado, recebido);
}

type MensagemWa = { id: string; from: string; type: string; text?: { body?: string } };
type ValorWa = { contacts?: { wa_id: string; profile?: { name?: string } }[]; messages?: MensagemWa[] };

export async function POST(req: NextRequest) {
  const corpo = await req.text();
  if (!assinaturaValida(corpo, req.headers.get("x-hub-signature-256"))) {
    return new NextResponse("assinatura inválida", { status: 401 });
  }

  let dados: { entry?: { changes?: { value?: ValorWa }[] }[] };
  try {
    dados = JSON.parse(corpo);
  } catch {
    return NextResponse.json({ ok: true });
  }

  const linhas = [];
  for (const entrada of dados.entry ?? []) {
    for (const mudanca of entrada.changes ?? []) {
      const v = mudanca.value;
      for (const m of v?.messages ?? []) {
        const nome = v?.contacts?.find((c) => c.wa_id === m.from)?.profile?.name ?? null;
        linhas.push({
          wamid: m.id,
          telefone: m.from,
          nome: nome?.slice(0, 120) ?? null,
          direcao: "entrada",
          tipo: m.type,
          texto: m.text?.body?.slice(0, 4000) ?? null,
        });
      }
    }
  }
  if (linhas.length) {
    const { error } = await criarClienteSupabaseAdmin()
      .from("whatsapp_mensagens")
      .upsert(linhas, { onConflict: "wamid", ignoreDuplicates: true });
    if (error) console.error("WhatsApp: falha ao gravar mensagem", error.message);
  }
  // a Meta reenvia se não receber 200 rápido
  return NextResponse.json({ ok: true });
}
