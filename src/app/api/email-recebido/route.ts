// src/app/api/email-recebido/route.ts
//
// Caixa de entrada do domínio (Wagner, 18/11/2026): o Resend recebe os e-mails enviados a qualquer endereço
// @sibrap.tec.br (ex.: contato@) e avisa esta rota (evento email.received). Aqui conferimos a assinatura do aviso,
// buscamos o e-mail completo e os anexos e reencaminhamos para o Gmail do Wagner; "Responder" vai para quem escreveu.
//
// Variáveis na Vercel:
//   RESEND_API_KEY_RECEBIMENTO  chave "Full access" do Resend (a RESEND_API_KEY do site só envia)
//   RESEND_WEBHOOK_SECRET       segredo do webhook (whsec_...)
//   EMAIL_ENCAMINHAR            destino (padrão: EMAIL_RESPOSTA ou o Gmail do Wagner)

import crypto from "node:crypto";

export const runtime = "nodejs";
export const maxDuration = 60;

const API = "https://api.resend.com";

type Recebido = {
  id: string;
  from: string;
  to: string[];
  cc?: string[] | null;
  reply_to?: string[] | string | null;
  subject: string | null;
  html: string | null;
  text: string | null;
};
type Anexo = { filename: string; content_type?: string; download_url: string; size?: number };

function assinaturaValida(corpo: string, id: string, ts: string, assinaturas: string, segredo: string): boolean {
  // padrão Svix: HMAC-SHA256 de "id.timestamp.corpo" com o segredo (base64 depois de "whsec_")
  const idade = Math.abs(Date.now() / 1000 - Number(ts));
  if (!Number.isFinite(idade) || idade > 300) return false;
  const chave = Buffer.from(segredo.replace(/^whsec_/, ""), "base64");
  const esperado = crypto.createHmac("sha256", chave).update(`${id}.${ts}.${corpo}`).digest();
  return assinaturas.split(" ").some((parte) => {
    const [versao, valor] = parte.split(",");
    if (versao !== "v1" || !valor) return false;
    const recebido = Buffer.from(valor, "base64");
    return recebido.length === esperado.length && crypto.timingSafeEqual(recebido, esperado);
  });
}

async function api<T>(caminho: string, chave: string): Promise<T> {
  const r = await fetch(`${API}${caminho}`, { headers: { Authorization: `Bearer ${chave}` } });
  if (!r.ok) throw new Error(`${caminho}: ${r.status} ${await r.text()}`);
  return (await r.json()) as T;
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

export async function POST(req: Request) {
  const chave = process.env.RESEND_API_KEY_RECEBIMENTO;
  const segredo = process.env.RESEND_WEBHOOK_SECRET;
  if (!chave || !segredo) return new Response("recebimento não configurado", { status: 503 });

  const corpo = await req.text();
  const id = req.headers.get("svix-id");
  const ts = req.headers.get("svix-timestamp");
  const sig = req.headers.get("svix-signature");
  if (!id || !ts || !sig || !assinaturaValida(corpo, id, ts, sig, segredo)) {
    return new Response("assinatura inválida", { status: 400 });
  }

  const evento = JSON.parse(corpo) as { type: string; data: { email_id: string } };
  if (evento.type !== "email.received") return Response.json({ ignorado: true });

  try {
    const email = await api<Recebido>(`/emails/receiving/${evento.data.email_id}`, chave);
    const { data: lista } = await api<{ data: Anexo[] }>(`/emails/receiving/${evento.data.email_id}/attachments`, chave);
    const anexos = await Promise.all(
      (lista ?? []).map(async (a) => {
        const r = await fetch(a.download_url);
        return { filename: a.filename, content: Buffer.from(await r.arrayBuffer()).toString("base64") };
      })
    );

    const para = email.to?.join(", ") ?? "";
    const responderPara = Array.isArray(email.reply_to) ? email.reply_to : email.reply_to ? [email.reply_to] : [email.from];
    const cabecalho = `<div style="font-family:Arial,sans-serif;font-size:13px;color:#555;border-bottom:1px solid #ddd;padding-bottom:8px;margin-bottom:12px">
Recebido em <b>${esc(para)}</b> · de <b>${esc(email.from)}</b>${email.cc?.length ? ` · cc ${esc(email.cc.join(", "))}` : ""}</div>`;
    const html = cabecalho + (email.html ?? `<pre style="white-space:pre-wrap;font-family:inherit">${esc(email.text ?? "")}</pre>`);

    const nomeRemetente = (email.from.match(/^\s*"?([^"<]+?)"?\s*</)?.[1] ?? email.from).replace(/[<>"]/g, "").slice(0, 60);
    const envio = await fetch(`${API}/emails`, {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY ?? chave}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: `${nomeRemetente} via SIBRAP <encaminhado@sibrap.tec.br>`,
        to: [process.env.EMAIL_ENCAMINHAR ?? process.env.EMAIL_RESPOSTA ?? "wagnerjuniorsouza@gmail.com"],
        reply_to: responderPara,
        subject: email.subject || "(sem assunto)",
        html,
        ...(email.text ? { text: `Recebido em ${para} · de ${email.from}\n\n${email.text}` } : {}),
        ...(anexos.length ? { attachments: anexos } : {}),
      }),
    });
    if (!envio.ok) throw new Error(`encaminhar: ${envio.status} ${await envio.text()}`);
    return Response.json({ encaminhado: true });
  } catch (e) {
    console.error("email-recebido:", e instanceof Error ? e.message : e);
    // 500 faz o Resend tentar de novo mais tarde
    return new Response("falha ao encaminhar", { status: 500 });
  }
}
