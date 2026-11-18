"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { criarClienteSupabaseAdmin } from "@/lib/supabase-admin";
import { dentroDoLimite, identificarCliente, MSG_MUITAS_TENTATIVAS } from "@/lib/limite";
import { enviarEmail, esc } from "@/lib/resend";
import { TIPOS_SOLICITACAO } from "./tipos";

export type EstadoSolicitacao = { enviado?: boolean; erro?: string } | null;

const EMAIL_OK = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Formulário público de solicitações (Wagner, 18/11/2026). Grava com a chave de serviço e avisa o Wagner por e-mail.
export async function enviarSolicitacao(_: EstadoSolicitacao, form: FormData): Promise<EstadoSolicitacao> {
  // campo-isca: robô preenche, pessoa não vê
  if (String(form.get("site") ?? "").trim()) return { enviado: true };

  const nome = String(form.get("nome") ?? "").trim().slice(0, 120);
  const email = String(form.get("email") ?? "").trim().toLowerCase().slice(0, 200);
  const whatsapp = String(form.get("whatsapp") ?? "").replace(/[^\d+()\s-]/g, "").trim().slice(0, 30) || null;
  const tipo = String(form.get("tipo") ?? "");
  const descricao = String(form.get("descricao") ?? "").trim().slice(0, 3000);
  const origem = String(form.get("origem") ?? "").trim().slice(0, 60) || null;

  if (nome.length < 2) return { erro: "Escreva o seu nome." };
  if (!EMAIL_OK.test(email)) return { erro: "Confira o e-mail." };
  if (!TIPOS_SOLICITACAO.some((t) => t.valor === tipo)) return { erro: "Escolha o tipo de pedido." };
  if (descricao.length < 20) return { erro: "Descreva o pedido com um pouco mais de detalhe (pelo menos 20 letras)." };
  if (form.get("aceite") !== "on") return { erro: "Marque a autorização para entrarmos em contato." };

  const cliente = await identificarCliente();
  if (!(await dentroDoLimite(`solicitacao:${cliente}`, 5, 3600))) return { erro: MSG_MUITAS_TENTATIVAS };

  const admin = criarClienteSupabaseAdmin() as unknown as SupabaseClient;
  const { error } = await admin.from("solicitacoes").insert({ nome, email, whatsapp, tipo, descricao, origem });
  if (error) {
    console.error("solicitacao: falha ao gravar", error.message);
    return { erro: "Não deu para enviar agora. Tente de novo em alguns minutos." };
  }

  const rotulo = TIPOS_SOLICITACAO.find((t) => t.valor === tipo)?.rotulo ?? tipo;
  await enviarEmail({
    para: process.env.EMAIL_RESPOSTA ?? "wagnerjuniorsouza@gmail.com",
    assunto: `Nova solicitação: ${rotulo} – ${nome}`,
    responderPara: email,
    html: `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.55;color:#14213A">
<p><b>${esc(rotulo)}</b>${origem ? ` · origem: ${esc(origem)}` : ""}</p>
<p><b>${esc(nome)}</b> · ${esc(email)}${whatsapp ? ` · WhatsApp ${esc(whatsapp)}` : ""}</p>
<p style="white-space:pre-wrap;border-left:4px solid #F2B705;padding-left:12px">${esc(descricao)}</p>
<p><a href="https://www.sibrap.tec.br/admin/solicitacoes">Abrir no painel</a> · responda este e-mail para falar com a pessoa.</p></div>`,
  }).catch((e) => console.error("solicitacao: aviso por e-mail falhou", e));

  return { enviado: true };
}
