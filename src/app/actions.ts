"use server";

import { criarClienteSupabaseServer } from "@/lib/supabase-server";

export type EstadoListaEspera = { ok: boolean; mensagem: string } | null;

export async function entrarNaListaDeEspera(
  _estadoAnterior: EstadoListaEspera,
  formData: FormData
): Promise<EstadoListaEspera> {
  const email = String(formData.get("email") ?? "").trim();
  const concursoId = String(formData.get("concursoId") ?? "");

  if (!email || !email.includes("@")) {
    return { ok: false, mensagem: "Digite um e-mail válido." };
  }

  const supabase = await criarClienteSupabaseServer();
  const { error } = await supabase.from("leads").insert({
    email,
    concurso_id: concursoId || null,
  });

  // 23505 = e-mail já cadastrado (unique violation) — trata como sucesso
  if (error && error.code !== "23505") {
    return {
      ok: false,
      mensagem: "Não deu pra cadastrar agora, tenta de novo em instantes.",
    };
  }

  return {
    ok: true,
    mensagem:
      "Prontinho! Você vai ser avisado por e-mail assim que a apostila e o simulado estiverem disponíveis.",
  };
}
