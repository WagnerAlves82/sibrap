"use server";

import { redirect } from "next/navigation";
import { criarClienteSupabaseServer } from "@/lib/supabase-server";
import { caminhoSeguro, veioDeCurso } from "@/lib/auth-redirect";
import { VERSAO_TERMOS } from "@/lib/emissor";

export type EstadoCadastro = {
  erro?: string;
  precisaConfirmarEmail?: boolean;
  // devolvido junto com o erro: o React limpa o formulário depois da ação
  valores?: { nome: string; email: string; aceite: boolean };
} | null;

export async function cadastrar(
  _estadoAnterior: EstadoCadastro,
  formData: FormData
): Promise<EstadoCadastro> {
  const nome = String(formData.get("nome") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const senha = String(formData.get("senha") ?? "");
  const utmSource = String(formData.get("utm_source") ?? "").slice(0, 60);
  const next = caminhoSeguro(formData.get("next"), "");
  const origem = veioDeCurso(next) ? "curso" : "concurso";
  const aceitou = formData.get("aceite") === "on";
  const valores = { nome, email, aceite: aceitou };

  if (!nome || !email || senha.length < 6) {
    return {
      erro: "Preencha nome, e-mail e uma senha com pelo menos 6 caracteres.",
      valores,
    };
  }

  if (!aceitou) {
    return {
      erro: "Para criar a conta, marque que leu e concorda com os Termos e a Política de Privacidade.",
      valores,
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sibrap.tec.br";
  // Depois de confirmar o e-mail o Supabase manda o usuário pro
  // /auth/callback, que troca o código por sessão e segue pro `next`.
  const destinoConfirmacao = next || "/minha-area";

  const supabase = await criarClienteSupabaseServer();
  const { data, error } = await supabase.auth.signUp({
    email,
    password: senha,
    options: {
      data: {
        nome,
        origem,
        proximo: destinoConfirmacao,
        aceite_termos_em: new Date().toISOString(),
        versao_termos: VERSAO_TERMOS,
        ...(utmSource ? { utm_source: utmSource } : {}),
      },
      emailRedirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent(destinoConfirmacao)}`,
    },
  });

  if (error) {
    return {
      erro:
        error.message === "User already registered"
          ? "Esse e-mail já tem cadastro. Faça login."
          : "Não deu pra criar a conta agora. Tenta de novo em instantes.",
      valores,
    };
  }

  if (!data.session) {
    return { precisaConfirmarEmail: true };
  }

  redirect(next || "/minha-area/simulado-gratis");
}
