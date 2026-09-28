"use server";

import { redirect } from "next/navigation";
import { criarClienteSupabaseServer } from "@/lib/supabase-server";
import { caminhoSeguro } from "@/lib/auth-redirect";
import { dentroDoLimite, hash, identificarCliente, MSG_MUITAS_TENTATIVAS } from "@/lib/limite";

export type EstadoLogin = { erro: string; email?: string } | null;

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
    return { erro: "E-mail ou senha incorretos.", email };
  }

  redirect(next);
}

export async function sairDaConta() {
  const supabase = await criarClienteSupabaseServer();
  await supabase.auth.signOut();
  redirect("/login");
}
