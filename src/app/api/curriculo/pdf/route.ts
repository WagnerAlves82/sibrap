// src/app/api/curriculo/pdf/route.ts
//
// Download do currículo: salva na conta e devolve o PDF.
// Quem baixa é quem está logado ou, no modo pago, o dono do pedido aprovado (token assinado,
// para quem acabou de criar a conta e ainda não tem sessão).
// Quem não tem conta usa /api/curriculo/cadastro (cria a conta e já baixa ou paga).

import { NextResponse, type NextRequest } from "next/server";
import { criarClienteSupabaseServer } from "@/lib/supabase-server";
import { dentroDoLimite, MSG_MUITAS_TENTATIVAS } from "@/lib/limite";
import { normalizar, validar } from "@/lib/curriculo/tipos";
import { donoDoPedido, fotoValida, PagamentoNecessario, precoDownload, respostaPdf, salvarEGerarPdf } from "@/lib/curriculo/servidor";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const corpo = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const supabase = await criarClienteSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const pedidoId = typeof corpo?.pedidoId === "string" ? corpo.pedidoId : null;
  const userId = user?.id ?? (pedidoId ? await donoDoPedido(pedidoId, corpo?.token) : null);
  if (!userId) return NextResponse.json({ erro: "Entre na sua conta para baixar." }, { status: 401 });

  const curriculo = normalizar(corpo?.curriculo);
  if (!curriculo) return NextResponse.json({ erro: "Currículo inválido." }, { status: 400 });
  if (Object.keys(validar(curriculo)).length) {
    return NextResponse.json({ erro: "Faltam informações obrigatórias. Volte à revisão." }, { status: 400 });
  }
  if (!(await dentroDoLimite(`curriculo-pdf:${userId}`, 20, 3600))) {
    return NextResponse.json({ erro: MSG_MUITAS_TENTATIVAS }, { status: 429 });
  }

  try {
    const { pdf, curriculoId } = await salvarEGerarPdf({
      userId,
      curriculo,
      foto: fotoValida(corpo?.foto),
      curriculoId: typeof corpo?.curriculoId === "string" ? corpo.curriculoId : null,
      lead: { aceite: corpo?.aceiteMarketing === true },
      pedidoId,
    });
    return respostaPdf(pdf, curriculo.dados.nome, curriculoId);
  } catch (e) {
    if (e instanceof PagamentoNecessario) {
      return NextResponse.json({ pagar: true, curriculoId: e.message, precoCentavos: await precoDownload() }, { status: 402 });
    }
    console.error("curriculo/pdf", e);
    return NextResponse.json({ erro: "Não deu para gerar o PDF agora. Tente de novo em instantes." }, { status: 500 });
  }
}
