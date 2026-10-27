// src/app/api/curriculo/pdf/route.ts
//
// Download do currículo para quem já está logado: salva na conta e devolve o PDF.
// Quem não tem conta usa /api/curriculo/cadastro (cria a conta e já baixa).

import { NextResponse, type NextRequest } from "next/server";
import { criarClienteSupabaseServer } from "@/lib/supabase-server";
import { dentroDoLimite, MSG_MUITAS_TENTATIVAS } from "@/lib/limite";
import { normalizar, validar } from "@/lib/curriculo/tipos";
import { fotoValida, respostaPdf, salvarEGerarPdf } from "@/lib/curriculo/servidor";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const supabase = await criarClienteSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ erro: "Entre na sua conta para baixar." }, { status: 401 });

  const corpo = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const curriculo = normalizar(corpo?.curriculo);
  if (!curriculo) return NextResponse.json({ erro: "Currículo inválido." }, { status: 400 });
  if (Object.keys(validar(curriculo)).length) {
    return NextResponse.json({ erro: "Faltam informações obrigatórias. Volte à revisão." }, { status: 400 });
  }
  if (!(await dentroDoLimite(`curriculo-pdf:${user.id}`, 20, 3600))) {
    return NextResponse.json({ erro: MSG_MUITAS_TENTATIVAS }, { status: 429 });
  }

  try {
    const { pdf, curriculoId } = await salvarEGerarPdf({
      userId: user.id,
      curriculo,
      foto: fotoValida(corpo?.foto),
      curriculoId: typeof corpo?.curriculoId === "string" ? corpo.curriculoId : null,
      lead: { aceite: corpo?.aceiteMarketing === true },
    });
    return respostaPdf(pdf, curriculo.dados.nome, curriculoId);
  } catch (e) {
    console.error("curriculo/pdf", e);
    return NextResponse.json({ erro: "Não deu para gerar o PDF agora. Tente de novo em instantes." }, { status: 500 });
  }
}
