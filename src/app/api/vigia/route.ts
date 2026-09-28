// src/app/api/vigia/route.ts
//
// POST: chamado de hora em hora pelo GitHub Actions (fora da Vercel) com o
//       id da loja esperado — ver src/lib/vigia.ts.
// GET:  chamado uma vez por dia pelo cron da Vercel para conferir se o
//       próprio vigia continua rodando.
// Ambos exigem "Authorization: Bearer <segredo>" (VIGIA_SECRET; o cron da
// Vercel envia CRON_SECRET), comparado em tempo constante.

import crypto from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { conferirBatidaDoVigia, descobrirLoja, executarVigia } from "@/lib/vigia";
import { dentroDoLimite, identificarCliente } from "@/lib/limite";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function autorizado(request: NextRequest): boolean {
  const recebido = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!recebido) return false;
  return [process.env.VIGIA_SECRET, process.env.CRON_SECRET].some((segredo) => {
    if (!segredo || segredo.length < 32) return false;
    const a = Buffer.from(recebido);
    const b = Buffer.from(segredo);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  });
}

export async function POST(request: NextRequest) {
  if (!(await dentroDoLimite(`vigia:${await identificarCliente()}`, 30, 3600, false))) {
    return NextResponse.json({ erro: "limite" }, { status: 429 });
  }
  if (!autorizado(request)) return NextResponse.json({ erro: "não autorizado" }, { status: 401 });

  const corpo = (await request.json().catch(() => null)) as { lojaEsperada?: string; descobrir?: boolean } | null;
  // modo de configuração: só informa a loja da chave atual (sem alerta nem pausa)
  if (corpo?.descobrir === true) return NextResponse.json(await descobrirLoja());
  const esperada = corpo?.lojaEsperada ?? "";
  if (!/^[A-Za-z0-9_-]{3,80}$/.test(esperada)) {
    return NextResponse.json({ erro: "lojaEsperada ausente ou inválida (configure a variável do GitHub)" }, { status: 400 });
  }

  const r = await executarVigia(esperada);
  // 500 quando há algo crítico: o workflow do GitHub falha e o GitHub também avisa por e-mail
  return NextResponse.json(r, { status: r.ok ? 200 : 500 });
}

export async function GET(request: NextRequest) {
  if (!autorizado(request)) return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  return NextResponse.json(await conferirBatidaDoVigia());
}
