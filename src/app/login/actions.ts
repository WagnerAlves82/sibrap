"use server";

import { redirect } from "next/navigation";
import { criarClienteSupabaseServer } from "@/lib/supabase-server";
import { caminhoSeguro } from "@/lib/auth-redirect";
import { dentroDoLimite, hash, identificarCliente, MSG_MUITAS_TENTATIVAS } from "@/lib/limite";

export type EstadoLogin = { erro: string; email?: string; emailNaoConfirmado?: boolean } | null;

export async function entrar(
  _estadoAnterior: EstadoLogin,
  formData: FormData
): Promise<EstadoLogin> {
  const email = String(formData.get("email") ?? "").trim();
  const senha = String(formData.get("senha") ?? "");
  const next = caminhoSeguro(formData.get("next"), "/minha-area");

  if (!email || !senha) {
    return { erro: "Preencha e-mail e senha.", email };
  }

  // por origem (15 em 10 min) e por conta (8 em 10 min): trava tentativa de
  // adivinhar a senha de uma conta específica, mesmo vinda de vários IPs
  const cliente = await identificarCliente();
  const okOrigem = await dentroDoLimite(`login:ip:${cliente}`, 15, 600);
  const okConta = await dentroDoLimite(`login:conta:${hash(email)}`, 8, 600);
  if (!okOrigem || !okConta) return { erro: MSG_MUITAS_TENTATIVAS, email };

  const supabase = await criarClienteSupabaseServer();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: senha,
  });

  if (error) {
    if (error.code === "email_not_confirmed") {
      return {
        erro: "Esse e-mail ainda não foi confirmado. Confira o link que mandamos pra sua caixa de entrada (e o spam), ou peça um novo abaixo.",
        email,
        emailNaoConfirmado: true,
      };
    }
    return { erro: "E-mail ou senha incorretos.", email };
  }

  redirect(next);
}

export async function sairDaConta() {
  const supabase = await criarClienteSupabaseServer();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function reenviarConfirmacaoAction(email: string): Promise<{ ok?: boolean; erro?: string }> {
  if (!email) return { erro: "E-mail inválido." };

  const cliente = await identificarCliente();
  if (!(await dentroDoLimite(`reenviar-confirmacao:${cliente}`, 5, 600))) {
    return { erro: MSG_MUITAS_TENTATIVAS };
  }

  const supabase = await criarClienteSupabaseServer();
  // Não revela se o e-mail existe ou já está confirmado — resposta genérica
  // sempre, mesmo em erro, pra não virar um jeito de descobrir contas.
  await supabase.auth.resend({ type: "signup", email }).catch(() => undefined);
  return { ok: true };
}
