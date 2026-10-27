// src/app/api/curriculo/cadastro/route.ts
//
// Cadastro feito na hora de baixar o currículo: cria a conta (o mesmo cadastro do site,
// com o e-mail de confirmação de sempre), salva o currículo nela e devolve o PDF na hora,
// sem esperar a confirmação. Motivo: o link do e-mail costuma abrir no navegador do app
// do Gmail, que não enxerga o rascunho salvo no aparelho; assim nada se perde.

import { NextResponse, type NextRequest } from "next/server";
import { criarClienteSupabaseServer } from "@/lib/supabase-server";
import { dentroDoLimite, identificarCliente, MSG_MUITAS_TENTATIVAS } from "@/lib/limite";
import { validarSenha } from "@/lib/senha";
import { VERSAO_TERMOS } from "@/lib/emissor";
import { lerOrigem } from "@/lib/origem";
import { apenasDigitos, normalizar, UFS, validar } from "@/lib/curriculo/tipos";
import { criarPixDownload, fotoValida, PagamentoNecessario, respostaPdf, salvarEGerarPdf } from "@/lib/curriculo/servidor";

export const runtime = "nodejs";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const erro = (mensagem: string, status = 400) => NextResponse.json({ erro: mensagem }, { status });

export async function POST(request: NextRequest) {
  const corpo = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const curriculo = normalizar(corpo?.curriculo);
  if (!curriculo) return erro("Currículo inválido.");
  if (Object.keys(validar(curriculo)).length) return erro("Faltam informações obrigatórias no currículo. Volte à revisão.");

  const c = (corpo?.cadastro ?? {}) as Record<string, unknown>;
  const nome = String(c.nome ?? "").trim().slice(0, 120);
  const email = String(c.email ?? "").trim().toLowerCase().slice(0, 160);
  const emailConfirmacao = String(c.emailConfirmacao ?? "").trim().toLowerCase();
  const whatsapp = apenasDigitos(String(c.whatsapp ?? "")).slice(0, 11);
  const cidade = String(c.cidade ?? "").trim().slice(0, 120);
  const uf = UFS.includes(String(c.uf)) ? String(c.uf) : "";
  const senha = String(c.senha ?? "");

  if (nome.split(/\s+/).length < 2) return erro("Escreva seu nome completo.");
  if (!EMAIL.test(email)) return erro("Confira o e-mail.");
  if (email !== emailConfirmacao) return erro("Os dois e-mails não são iguais. Confira e digite de novo.");
  if (whatsapp.length < 10) return erro("Confira o WhatsApp com DDD.");
  if (!cidade || !uf) return erro("Informe cidade e estado.");
  const erroSenha = validarSenha(senha, email);
  if (erroSenha) return erro(erroSenha);
  if (c.aceiteTermos !== true) return erro("Para criar a conta, marque que leu e concorda com os Termos e a Política de Privacidade.");

  // mesmo limite do cadastro do site: evita contas em massa e e-mails de confirmação para terceiros
  if (!(await dentroDoLimite(`cadastro:${await identificarCliente()}`, 6, 3600))) return erro(MSG_MUITAS_TENTATIVAS, 429);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sibrap.tec.br";
  const supabase = await criarClienteSupabaseServer();
  const { data, error } = await supabase.auth.signUp({
    email,
    password: senha,
    options: {
      data: {
        nome,
        origem: "curriculo",
        proximo: "/curriculo",
        whatsapp,
        cidade,
        uf,
        aceite_termos_em: new Date().toISOString(),
        versao_termos: VERSAO_TERMOS,
        origem_marketing: await lerOrigem(),
      },
      emailRedirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent("/curriculo")}`,
    },
  });

  // com confirmação de e-mail ligada, e-mail já cadastrado volta sem erro e sem identidades
  const jaExiste = error?.message === "User already registered" || (data?.user && (data.user.identities?.length ?? 0) === 0);
  if (jaExiste) return erro("Esse e-mail já tem cadastro. Use \"Já tenho conta\" e entre com sua senha.", 409);
  if (error || !data?.user) return erro("Não deu para criar a conta agora. Tente de novo em instantes.", 500);

  try {
    const { pdf, curriculoId } = await salvarEGerarPdf({
      userId: data.user.id,
      curriculo,
      foto: fotoValida(corpo?.foto),
      lead: { aceite: c.aceiteMarketing === true, whatsapp, cidade, uf },
    });
    return respostaPdf(pdf, curriculo.dados.nome, curriculoId);
  } catch (e) {
    // modo pago: conta criada e currículo salvo; devolve o PIX (sem sessão, o pedido segue por token)
    if (e instanceof PagamentoNecessario) {
      const pix = await criarPixDownload(data.user.id, email, nome);
      if ("erro" in pix) return erro(pix.erro, 500);
      return NextResponse.json({ pagar: true, curriculoId: e.message, ...pix }, { status: 402 });
    }
    console.error("curriculo/cadastro", e);
    return erro("Sua conta foi criada, mas o PDF falhou. Confirme o e-mail, entre e baixe de novo.", 500);
  }
}
