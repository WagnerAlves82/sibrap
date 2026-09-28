// src/lib/resend.ts
//
// Envio de e-mail transacional via API do Resend (domínio sibrap.tec.br
// já verificado lá). Chamada direta via fetch — sem SDK, mesmo padrão
// usado pra integração com o Mercado Pago neste projeto.

import { EMISSOR } from "@/lib/emissor";

const APOSTILA_URL =
  "https://bdansoccbklggqqnxexn.supabase.co/storage/v1/object/public/apostilas/apostila-conhecimentos-basicos-transpetro-2026.pdf";

const SITE_URL = () => process.env.NEXT_PUBLIC_SITE_URL ?? "https://sibrap.tec.br";

type Resultado = { ok: true } | { ok: false; erro: string };

export function esc(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function enviarEmail({
  para,
  assunto,
  html,
}: {
  para: string;
  assunto: string;
  html: string;
}): Promise<Resultado> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { ok: false, erro: "RESEND_API_KEY não configurada" };
  }

  const resposta = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: "SIBRAP <apostila@sibrap.tec.br>",
      to: [para],
      subject: assunto,
      html,
    }),
  });

  if (!resposta.ok) {
    const detalhe = await resposta.text();
    return { ok: false, erro: `Resend respondeu ${resposta.status}: ${detalhe}` };
  }

  return { ok: true };
}

// Moldura padrão dos e-mails da marca (cabeçalho azul com logo, botão
// dourado, rodapé com CNPJ). Só HTML com tabelas e estilos inline, que é
// o que os programas de e-mail entendem.
function moldura({
  saudacao,
  titulo,
  corpo,
  botao,
}: {
  saudacao: string;
  titulo: string;
  corpo: string;
  botao?: { texto: string; url: string };
}): string {
  return `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#F2F5F8;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F2F5F8;"><tr><td align="center" style="padding:32px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background-color:#FFFFFF;border:1px solid #D7DEE6;border-radius:14px;overflow:hidden;">
<tr><td style="background-color:#0B2A4A;padding:22px 30px;border-bottom:4px solid #B9862A;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
<td style="padding-right:14px;vertical-align:middle;"><img src="${SITE_URL()}/logo.png" width="40" height="40" alt="SIBRAP" style="display:block;border:0;border-radius:26px;background-color:#FFFFFF;padding:3px;"></td>
<td style="vertical-align:middle;font-family:Arial,Helvetica,sans-serif;"><div style="font-size:20px;line-height:24px;font-weight:800;letter-spacing:1px;color:#FFFFFF;">SIBRAP</div>
<div style="font-size:10.5px;line-height:14px;letter-spacing:0.6px;text-transform:uppercase;color:#AEC2D8;">Sistema Brasileiro de Aprendizagem Profissional</div></td>
</tr></table></td></tr>
<tr><td style="padding:34px 30px 10px 30px;font-family:Arial,Helvetica,sans-serif;">
<div style="font-size:14px;line-height:20px;color:#516278;">${saudacao}</div>
<h1 style="margin:8px 0 14px 0;font-size:25px;line-height:31px;font-weight:800;color:#14213A;">${titulo}</h1>
<div style="font-size:15.5px;line-height:24px;color:#3A4A63;">${corpo}</div></td></tr>
${
  botao
    ? `<tr><td align="center" style="padding:14px 30px 26px 30px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
<td align="center" bgcolor="#B9862A" style="border-radius:9px;"><a href="${botao.url}" target="_blank" style="display:inline-block;padding:15px 34px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:20px;font-weight:700;color:#231703;text-decoration:none;border-radius:9px;">${botao.texto}</a></td>
</tr></table></td></tr>`
    : `<tr><td style="height:18px;"></td></tr>`
}
<tr><td style="background-color:#F8FAFC;border-top:1px solid #D7DEE6;padding:18px 30px;font-family:Arial,Helvetica,sans-serif;">
<p style="margin:0;font-size:11.5px;line-height:17px;color:#93A0AF;text-align:center;"><strong style="color:#516278;">SIBRAP</strong> &mdash; ${EMISSOR.nome.replace("SIBRAP — ", "")}<br>CNPJ ${EMISSOR.cnpj} &middot; <a href="${SITE_URL()}" target="_blank" style="color:#516278;text-decoration:underline;">${SITE_URL().replace(/^https?:\/\//, "")}</a></p>
</td></tr>
</table></td></tr></table></body></html>`;
}

export async function enviarApostilaGratisPorEmail({
  email,
  nome,
}: {
  email: string;
  nome?: string | null;
}): Promise<Resultado> {
  const primeiroNome = nome?.split(" ")[0];

  const html = `
    <div style="font-family:'Public Sans',Arial,sans-serif;background:#F2F5F8;padding:32px 16px;">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #D7DEE6;">
        <div style="background:#0B2A4A;padding:20px 28px;border-bottom:3px solid #B9862A;">
          <span style="color:#ffffff;font-weight:800;font-size:18px;letter-spacing:0.02em;">SIBRAP</span>
        </div>
        <div style="padding:28px;">
          <p style="font-size:16px;color:#14213A;margin:0 0 16px;">
            ${primeiroNome ? `Olá, ${esc(primeiroNome)}!` : "Olá!"}
          </p>
          <p style="font-size:15px;color:#516278;line-height:1.6;margin:0 0 20px;">
            Sua apostila grátis de <strong>Conhecimentos Básicos</strong> (Língua
            Portuguesa e Matemática) para o Concurso Transpetro 2026 já está
            pronta pra baixar.
          </p>
          <div style="text-align:center;margin:28px 0;">
            <a href="${APOSTILA_URL}"
               style="display:inline-block;background:#B9862A;color:#231703;font-weight:700;font-size:15px;padding:14px 28px;border-radius:8px;text-decoration:none;">
              Baixar apostila em PDF
            </a>
          </div>
          <p style="font-size:14px;color:#516278;line-height:1.6;margin:0 0 20px;">
            Enquanto estuda, aproveita e faz seu simulado grátis no site — 5
            questões de Português + 5 de Matemática, no estilo da banca
            Cesgranrio.
          </p>
          <div style="text-align:center;">
            <a href="${SITE_URL()}/minha-area/simulado-gratis"
               style="display:inline-block;background:#0B2A4A;color:#ffffff;font-weight:700;font-size:14px;padding:12px 24px;border-radius:8px;text-decoration:none;">
              Fazer o simulado grátis
            </a>
          </div>
        </div>
        <div style="padding:16px 28px;border-top:1px solid #D7DEE6;">
          <p style="font-size:12px;color:#93A0AF;margin:0;">SIBRAP — sibrap.tec.br</p>
        </div>
      </div>
    </div>
  `;

  return enviarEmail({ para: email, assunto: "Sua apostila grátis chegou 📘", html });
}

// Aviso ao aluno quando o comprovante do CadÚnico é analisado no admin.
export async function enviarResultadoComprovante({
  email,
  nome,
  aprovado,
  motivo,
}: {
  email: string;
  nome?: string | null;
  aprovado: boolean;
  motivo?: string | null;
}): Promise<Resultado> {
  const primeiroNome = nome?.split(" ")[0];
  const saudacao = primeiroNome ? `Olá, ${esc(primeiroNome)}!` : "Olá!";
  const url = `${SITE_URL()}/minha-area`;

  if (aprovado) {
    return enviarEmail({
      para: email,
      assunto: "Comprovante aprovado: seu certificado é gratuito",
      html: moldura({
        saudacao,
        titulo: "Comprovante aprovado",
        corpo: `<p style="margin:0 0 12px 0;">Conferimos o seu comprovante do CadÚnico e ele foi <strong>aprovado</strong>. Isso significa que o certificado dos cursos livres do SIBRAP é <strong>gratuito</strong> para você.</p>
<p style="margin:0;">Continue os estudos: ao concluir as aulas e passar na prova final, é só emitir o seu certificado na sua área.</p>`,
        botao: { texto: "Ir para minha área &rarr;", url },
      }),
    });
  }

  return enviarEmail({
    para: email,
    assunto: "Não conseguimos aprovar seu comprovante do CadÚnico",
    html: moldura({
      saudacao,
      titulo: "Precisamos de um novo comprovante",
      corpo: `<p style="margin:0 0 12px 0;">Analisamos o comprovante que você enviou, mas não conseguimos aprová-lo${motivo ? `. Motivo informado pela nossa equipe: <strong>${esc(motivo)}</strong>` : ""}.</p>
<p style="margin:0 0 12px 0;">Você pode enviar outro documento sem custo: entre na sua área, abra o curso e vá em <strong>Certificado</strong>.</p>
<p style="margin:0;">Dica: envie o arquivo inteiro e legível (foto nítida ou PDF), com o seu nome e o número do NIS visíveis.</p>`,
      botao: { texto: "Enviar novo comprovante &rarr;", url },
    }),
  });
}

// E-mail enviado assim que o PIX é confirmado. Não leva o arquivo nem
// senha: leva o caminho de acesso. A senha é a que a pessoa criou no
// cadastro (e-mail com senha em texto puro é prática desaconselhada); se
// esqueceu, o link de recuperação está aqui mesmo.
export async function enviarEntregaApostila({
  email,
  nome,
  titulo,
  slug,
  valorCentavos,
  pedidoId,
}: {
  email: string;
  nome?: string | null;
  titulo: string;
  slug: string;
  valorCentavos: number;
  pedidoId: string;
}): Promise<Resultado> {
  const primeiroNome = nome?.split(" ")[0];
  const saudacao = primeiroNome ? `Olá, ${esc(primeiroNome)}!` : "Olá!";
  const valor = (valorCentavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return enviarEmail({
    para: email,
    assunto: "Pagamento confirmado: sua apostila está liberada",
    html: moldura({
      saudacao,
      titulo: "Sua apostila está liberada",
      corpo: `<p style="margin:0 0 12px 0;">Recebemos o seu pagamento de <strong>${valor}</strong> e a apostila <strong>${esc(titulo)}</strong> já está disponível para download na sua área.</p>
<p style="margin:0 0 6px 0;"><strong>Como acessar</strong></p>
<p style="margin:0 0 12px 0;">Entre em sibrap.tec.br com o e-mail <strong>${esc(email)}</strong> e a senha que você criou no cadastro. Se não lembrar a senha, use <a href="${SITE_URL()}/esqueci-senha" style="color:#0B2A4A;">Esqueci minha senha</a>.</p>
<p style="margin:0;font-size:12.5px;color:#93A0AF;">Pedido ${esc(pedidoId.slice(0, 8))}. Material de estudo independente, para uso pessoal — não compartilhe nem revenda o arquivo.</p>`,
      botao: { texto: "Baixar minha apostila &rarr;", url: `${SITE_URL()}/minha-area/apostilas/${slug}` },
    }),
  });
}
