// src/app/api/curriculo/pagamento/route.ts
//
// Modo pago do gerador de currículos (a partir de 1.000 currículos gerados):
//  * POST { acao: "criar" } — quem está logado gera o PIX de R$ 3,90 de um download;
//  * POST { acao: "status", pedidoId, token? } — consulta se o PIX foi pago (polling da tela).
// Quem acabou de criar a conta recebe o PIX direto de /api/curriculo/cadastro, com o token do pedido.

import { NextResponse, type NextRequest } from "next/server";
import { criarClienteSupabaseServer } from "@/lib/supabase-server";
import { criarPixDownload, donoDoPedido, statusPedido } from "@/lib/curriculo/servidor";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const corpo = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const supabase = await criarClienteSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (corpo?.acao === "criar") {
    if (!user?.email) return NextResponse.json({ erro: "Entre na sua conta para pagar." }, { status: 401 });
    const pix = await criarPixDownload(user.id, user.email, (user.user_metadata as { nome?: string } | undefined)?.nome);
    return NextResponse.json(pix, { status: "erro" in pix ? 500 : 200 });
  }

  if (corpo?.acao === "status" && typeof corpo.pedidoId === "string") {
    const dono = await donoDoPedido(corpo.pedidoId, corpo.token);
    const { data: pedido } = user
      ? await supabase.from("pedidos").select("id").eq("id", corpo.pedidoId).eq("user_id", user.id).maybeSingle()
      : { data: null };
    if (!dono && !pedido) return NextResponse.json({ erro: "Pedido não encontrado." }, { status: 404 });
    return NextResponse.json({ status: await statusPedido(corpo.pedidoId) });
  }

  return NextResponse.json({ erro: "Pedido inválido." }, { status: 400 });
}
