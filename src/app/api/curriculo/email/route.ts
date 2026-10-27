// src/app/api/curriculo/email/route.ts
//
// Envia por e-mail, com o PDF anexo, o currículo que a pessoa ACABOU de baixar.
// Prova de download: o token devolvido junto com o PDF. O texto vem do banco (a versão salva no
// download), não do navegador, e só vale se o currículo não mudou depois do último download;
// assim o e-mail não vira um jeito de baixar grátis no modo pago. A foto vem do aparelho.
// A resposta da empresa vai para o e-mail do candidato.

import { NextResponse, type NextRequest } from "next/server";
import { criarClienteSupabaseAdmin } from "@/lib/supabase-admin";
import { dentroDoLimite, identificarCliente, MSG_MUITAS_TENTATIVAS } from "@/lib/limite";
import { enviarCurriculoPorEmail } from "@/lib/resend";
import { montarDocumento } from "@/lib/curriculo/secoes";
import { gerarPdfCurriculo } from "@/lib/curriculo/pdf";
import { MODELOS, normalizar } from "@/lib/curriculo/tipos";
import { fotoValida, nomeArquivo, tokenEmailValido } from "@/lib/curriculo/servidor";

export const runtime = "nodejs";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const erro = (mensagem: string, status = 400) => NextResponse.json({ erro: mensagem }, { status });

export async function POST(request: NextRequest) {
  const corpo = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const curriculoId = typeof corpo?.curriculoId === "string" ? corpo.curriculoId : "";
  const para = String(corpo?.para ?? "").trim().toLowerCase().slice(0, 160);
  if (!curriculoId || !tokenEmailValido(curriculoId, corpo?.token)) return erro("Baixe o currículo antes de enviar por e-mail.", 403);
  if (!EMAIL.test(para)) return erro("Confira o e-mail de destino.");

  // até 5 envios por currículo e 15 por aparelho a cada 24 h (evita uso do site para disparo em massa)
  if (!(await dentroDoLimite(`curriculo-email:${curriculoId}`, 5, 86400)) || !(await dentroDoLimite(`curriculo-email-ip:${await identificarCliente()}`, 15, 86400))) {
    return erro(MSG_MUITAS_TENTATIVAS, 429);
  }

  const admin = criarClienteSupabaseAdmin();
  const [{ data: linha }, { data: ultimo }] = await Promise.all([
    admin.from("curriculos").select("perfil, modelo, dados, atualizado_em").eq("id", curriculoId).maybeSingle(),
    admin.from("curriculo_downloads").select("criado_em").eq("curriculo_id", curriculoId).order("criado_em", { ascending: false }).limit(1).maybeSingle(),
  ]);
  if (!linha || !ultimo) return erro("Currículo não encontrado. Baixe de novo.", 404);
  if (new Date(linha.atualizado_em).getTime() > new Date(ultimo.criado_em).getTime() + 5000) {
    return erro("O currículo mudou depois do último download. Baixe a versão nova antes de enviar.", 409);
  }
  const curriculo = normalizar(linha);
  if (!curriculo) return erro("Currículo inválido.");

  try {
    const pdf = await gerarPdfCurriculo(montarDocumento(curriculo), curriculo.modelo, MODELOS[curriculo.modelo].temFoto ? fotoValida(corpo?.foto) : null);
    const r = await enviarCurriculoPorEmail({
      para,
      nomeCandidato: curriculo.dados.nome,
      emailCandidato: curriculo.dados.email || null,
      pdfBase64: pdf.toString("base64"),
      arquivo: nomeArquivo(curriculo.dados.nome),
    });
    if (!r.ok) {
      console.error("curriculo/email", r.erro);
      return erro("Não deu para enviar agora. Tente de novo em instantes.", 502);
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("curriculo/email", e);
    return erro("Não deu para enviar agora. Tente de novo em instantes.", 500);
  }
}
