// src/lib/resend.ts
//
// Envio de e-mail transacional via API do Resend (domínio sibrap.tec.br
// já verificado lá). Chamada direta via fetch — sem SDK, mesmo padrão
// usado pra integração com o Mercado Pago neste projeto.

const APOSTILA_URL =
  "https://bdansoccbklggqqnxexn.supabase.co/storage/v1/object/public/apostilas/apostila-conhecimentos-basicos-transpetro-2026.pdf";

export async function enviarApostilaGratisPorEmail({
  email,
  nome,
}: {
  email: string;
  nome?: string | null;
}): Promise<{ ok: true } | { ok: false; erro: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { ok: false, erro: "RESEND_API_KEY não configurada" };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sibrap.tec.br";
  const primeiroNome = nome?.split(" ")[0];

  const html = `
    <div style="font-family:'Public Sans',Arial,sans-serif;background:#F2F5F8;padding:32px 16px;">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #D7DEE6;">
        <div style="background:#0B2A4A;padding:20px 28px;border-bottom:3px solid #B9862A;">
          <span style="color:#ffffff;font-weight:800;font-size:18px;letter-spacing:0.02em;">SIBRAP</span>
        </div>
        <div style="padding:28px;">
          <p style="font-size:16px;color:#14213A;margin:0 0 16px;">
            ${primeiroNome ? `Olá, ${primeiroNome}!` : "Olá!"}
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
            <a href="${siteUrl}/minha-area/simulado-gratis"
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

  const resposta = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: "SIBRAP <apostila@sibrap.tec.br>",
      to: [email],
      subject: "Sua apostila grátis chegou 📘",
      html,
    }),
  });

  if (!resposta.ok) {
    const detalhe = await resposta.text();
    return { ok: false, erro: `Resend respondeu ${resposta.status}: ${detalhe}` };
  }

  return { ok: true };
}
