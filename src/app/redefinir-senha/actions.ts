"use server";

import { redirect } from "next/navigation";
import { criarClienteSupabaseServer } from "@/lib/supabase-server";
import { validarSenha } from "@/lib/senha";

export type EstadoRedefinir = { erro: string } | null;

export async function redefinirSenha(
  _anterior: EstadoRedefinir,
  formData: FormData
): Promise<EstadoRedefinir> {
  const senha = String(formData.get("senha") ?? "");
  const confirmacao = String(formData.get("confirmacao") ?? "");

  if (senha !== confirmacao) return { erro: "As duas senhas não são iguais." };

  const supabase = await criarClienteSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const erroSenha = validarSenha(senha, user?.email ?? "");
  if (erroSenha) return { erro: erroSenha };
  if (!user) {
    return { erro: "O link expirou. Peça um novo link em \"Esqueci minha senha\"." };
  }

  const { error } = await supabase.auth.updateUser({ password: senha });
  if (error) {
    return {
      erro:
        error.code === "same_password"
          ? "Escolha uma senha diferente da anterior."
          : "Não deu pra trocar a senha agora. Tenta de novo em instantes.",
    };
  }

  redirect("/minha-area");
}
