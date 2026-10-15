"use server";

import { criarClienteSupabaseAdmin } from "@/lib/supabase-admin";
import { dentroDoLimite, identificarCliente, MSG_MUITAS_TENTATIVAS } from "@/lib/limite";
import { descreverOrigem, lerOrigem } from "@/lib/origem";
import { enviarAvisoLead } from "@/lib/resend";

export type ResultadoSaida = { ok: true } | { ok: false; erro: string };

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// E-mail deixado no pop-up de saída. Grava em `leads` (só pelo servidor) e avisa o dono.
export async function capturarEmailSaida(email: string, pagina: string, armadilha: string): Promise<ResultadoSaida> {
  if (armadilha) return { ok: true }; // campo escondido preenchido = robô; finge que deu certo
  const limpo = String(email ?? "").trim().toLowerCase().slice(0, 200);
  if (!EMAIL_VALIDO.test(limpo)) return { ok: false, erro: "Digite um e-mail válido." };

  if (!(await dentroDoLimite(`lead-saida:${await identificarCliente()}`, 5, 3600))) {
    return { ok: false, erro: MSG_MUITAS_TENTATIVAS };
  }

  const origem = await lerOrigem();
  const caminho = String(pagina ?? "").slice(0, 200);
  const admin = criarClienteSupabaseAdmin();

  let { error } = await admin.from("leads").insert({ email: limpo, pagina: caminho, origem });
  if (error && error.code !== "23505") {
    // colunas novas ainda não criadas no banco: grava só o e-mail
    ({ error } = await admin.from("leads").insert({ email: limpo }));
  }
  if (error && error.code !== "23505") {
    console.error("Falha ao gravar lead de saída", error.message);
    return { ok: false, erro: "Não deu para registrar agora. Tente de novo em instantes." };
  }
  if (!error) {
    await enviarAvisoLead({ email: limpo, pagina: caminho, origem: descreverOrigem(origem) }).catch(() => undefined);
  }
  return { ok: true };
}
