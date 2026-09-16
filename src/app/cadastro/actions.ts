"use server";

import { redirect } from "next/navigation";
import { criarClienteSupabaseServer } from "@/lib/supabase-server";

export type EstadoCadastro = {
  erro?: string;
  precisaConfirmarEmail?: boolean;
} | null;

export async function cadastrar(
  _estadoAnterior: EstadoCadastro,
  formData: FormData
): Promise<EstadoCadastro> {
  const nome = String(formData.get("nome") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const senha = String(formData.get("senha") ?? "");

  if (!nome || !email || senha.length < 6) {
    return {
      erro: "Preencha nome, e-mail e uma senha com pelo menos 6 caracteres.",
    };
  }

  const supabase = await criarClienteSupabaseServer();
  const { data, error } = await supabase.auth.signUp({
    email,
    password: senha,
    options: { data: { nome } },
  });

  if (error) {
    return {
      erro:
        error.message === "User already registered"
          ? "Esse e-mail já tem cadastro. Faça login."
          : "Não deu pra criar a conta agora. Tenta de novo em instantes.",
    };
  }

  if (!data.session) {
    return { precisaConfirmarEmail: true };
  }

  redirect("/minha-area/simulado-gratis");
}
