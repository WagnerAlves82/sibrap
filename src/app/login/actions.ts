"use server";

import { redirect } from "next/navigation";
import { criarClienteSupabaseServer } from "@/lib/supabase-server";
import { caminhoSeguro } from "@/lib/auth-redirect";

export type EstadoLogin = { erro: string } | null;

export async function entrar(
  _estadoAnterior: EstadoLogin,
  formData: FormData
): Promise<EstadoLogin> {
  const email = String(formData.get("email") ?? "").trim();
  const senha = String(formData.get("senha") ?? "");
  const next = caminhoSeguro(formData.get("next"), "/minha-area");

  if (!email || !senha) {
    return { erro: "Preencha e-mail e senha." };
  }

  const supabase = await criarClienteSupabaseServer();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: senha,
  });

  if (error) {
    return { erro: "E-mail ou senha incorretos." };
  }

  redirect(next);
}

export async function sairDaConta() {
  const supabase = await criarClienteSupabaseServer();
  await supabase.auth.signOut();
  redirect("/login");
}
