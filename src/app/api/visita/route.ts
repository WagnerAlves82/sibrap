// src/app/api/visita/route.ts
//
// Conta uma visita a uma página de curso (página pública e área do aluno).
// Uma por IP e página a cada 30 min; robôs não contam. O total só aparece
// no site a partir de VISITAS_MINIMAS_PARA_EXIBIR (ver src/lib/visitas.ts).

import { NextResponse, type NextRequest } from "next/server";
import { criarClienteSupabaseAdmin } from "@/lib/supabase-admin";
import { dentroDoLimite, identificarCliente } from "@/lib/limite";
import { caminhoContavel } from "@/lib/visitas";

const ROBO = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|headless|lighthouse/i;

export async function POST(request: NextRequest) {
  if (ROBO.test(request.headers.get("user-agent") ?? "")) return NextResponse.json({ ok: true });

  const corpo = (await request.json().catch(() => null)) as { caminho?: unknown } | null;
  const caminho = typeof corpo?.caminho === "string" ? corpo.caminho : "";
  if (!caminhoContavel(caminho)) return NextResponse.json({ ok: false }, { status: 400 });

  const cliente = await identificarCliente();
  if (!(await dentroDoLimite(`visita:${cliente}:${caminho}`, 1, 1800, false))) return NextResponse.json({ ok: true });

  await criarClienteSupabaseAdmin().rpc("registrar_visita", { p_caminho: caminho });
  return NextResponse.json({ ok: true });
}
