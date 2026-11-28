import type { SupabaseClient } from "@supabase/supabase-js";
import { criarClienteSupabaseAdmin } from "@/lib/supabase-admin";

// Descadastro de e-mails de comunicação (LGPD, art. 18). O link do rodapé leva um token aleatório, um por
// e-mail, gravado em email_descadastro_tokens pelos scripts de envio (producao-apostilas/_lib/descadastro.mjs).
// Só grava o e-mail na lista email_descadastros: a conta, os cursos e as compras do aluno não mudam.
const admin = () => criarClienteSupabaseAdmin() as unknown as SupabaseClient;

/** Devolve o e-mail dono do token do link, ou null. */
export async function emailDoToken(t: string | undefined): Promise<string | null> {
  if (!t || !/^[A-Za-z0-9_-]{20,64}$/.test(t)) return null;
  const { data } = await admin().from("email_descadastro_tokens").select("email").eq("token", t).maybeSingle<{ email: string }>();
  return data?.email ?? null;
}

export async function descadastrar(email: string, origem: string): Promise<boolean> {
  const { error } = await admin()
    .from("email_descadastros")
    .upsert({ email: email.toLowerCase(), origem }, { onConflict: "email", ignoreDuplicates: true });
  return !error;
}

export async function recadastrar(email: string): Promise<boolean> {
  const { error } = await admin().from("email_descadastros").delete().eq("email", email.toLowerCase());
  return !error;
}

export async function estaDescadastrado(email: string): Promise<boolean> {
  const { data } = await admin().from("email_descadastros").select("email").eq("email", email.toLowerCase()).maybeSingle();
  return !!data;
}
