"use server";

import { criarClienteSupabaseServer } from "@/lib/supabase-server";

export type EstadoEsqueci = { erro?: string; enviado?: boolean } | null;

export async function solicitarRedefinicao(
  _anterior: EstadoEsqueci,
  formData: FormData
): Promise<EstadoEsqueci> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email || !email.includes("@")) {
    return { erro: "Digite o e-mail da sua conta." };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sibrap.tec.br";
  const supabase = await criarClienteSupabaseServer();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/redefinir-senha`,
  });

  // limite de envios: avisa; qualquer outro resultado responde igual, pra
  // ninguém descobrir quais e-mails têm conta
  if (error?.code === "over_email_send_rate_limit") {
    return { erro: "Muitos pedidos em pouco tempo. Aguarde alguns minutos e tente de novo." };
  }

  return { enviado: true };
}
