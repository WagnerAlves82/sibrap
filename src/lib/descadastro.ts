import { createHmac, timingSafeEqual } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { criarClienteSupabaseAdmin } from "@/lib/supabase-admin";

// Descadastro de e-mails de comunicação (LGPD, art. 18). O link leva o e-mail em base64url e uma
// assinatura HMAC; a chave é derivada da service role (a mesma regra está em
// producao-apostilas/_lib/descadastro.mjs, usada pelos scripts de envio).
const SITE = "https://www.sibrap.tec.br";

function chave(): string {
  const base = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base) throw new Error("SUPABASE_SERVICE_ROLE_KEY ausente");
  return createHmac("sha256", base).update("sibrap-descadastro-v1").digest("hex");
}

export function assinaturaDescadastro(email: string): string {
  return createHmac("sha256", chave()).update(email.trim().toLowerCase()).digest("base64url").slice(0, 32);
}

export function linkDescadastro(email: string): string {
  const e = Buffer.from(email.trim().toLowerCase()).toString("base64url");
  return `${SITE}/descadastrar?e=${e}&t=${assinaturaDescadastro(email)}`;
}

/** Confere o link; devolve o e-mail se a assinatura bater. */
export function emailDoLink(e: string | undefined, t: string | undefined): string | null {
  if (!e || !t || e.length > 400 || t.length > 64) return null;
  let email: string;
  try {
    email = Buffer.from(e, "base64url").toString("utf8").trim().toLowerCase();
  } catch {
    return null;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  const certa = Buffer.from(assinaturaDescadastro(email));
  const veio = Buffer.from(t);
  return certa.length === veio.length && timingSafeEqual(certa, veio) ? email : null;
}

const tabela = () => (criarClienteSupabaseAdmin() as unknown as SupabaseClient).from("email_descadastros");

export async function descadastrar(email: string, origem: string): Promise<boolean> {
  const { error } = await tabela().upsert({ email: email.toLowerCase(), origem }, { onConflict: "email", ignoreDuplicates: true });
  return !error;
}

export async function recadastrar(email: string): Promise<boolean> {
  const { error } = await tabela().delete().eq("email", email.toLowerCase());
  return !error;
}

export async function estaDescadastrado(email: string): Promise<boolean> {
  const { data } = await tabela().select("email").eq("email", email.toLowerCase()).maybeSingle();
  return !!data;
}
