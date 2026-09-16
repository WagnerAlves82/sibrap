// src/lib/admin-auth.ts
//
// Autenticação simples do painel admin: uma senha compartilhada
// (ADMIN_PASSWORD), sem tabela de usuário nem Supabase Auth. O cookie
// guarda um token assinado (HMAC) com timestamp, pra não poder ser
// forjado nem reaproveitado depois de expirar.

import crypto from "node:crypto";

export const ADMIN_COOKIE_NAME = "sibrap_admin";
const SESSAO_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias

function segredo() {
  const s = process.env.ADMIN_PASSWORD;
  if (!s) throw new Error("ADMIN_PASSWORD não configurada");
  return s;
}

export function criarTokenAdmin(): string {
  const timestamp = Date.now().toString();
  const assinatura = crypto.createHmac("sha256", segredo()).update(timestamp).digest("hex");
  return `${timestamp}.${assinatura}`;
}

export function tokenAdminValido(token: string | undefined | null): boolean {
  if (!token) return false;
  const [timestamp, assinatura] = token.split(".");
  if (!timestamp || !assinatura) return false;

  let esperado: string;
  try {
    esperado = crypto.createHmac("sha256", segredo()).update(timestamp).digest("hex");
  } catch {
    return false;
  }

  const bufAssinatura = Buffer.from(assinatura);
  const bufEsperado = Buffer.from(esperado);
  if (bufAssinatura.length !== bufEsperado.length) return false;
  if (!crypto.timingSafeEqual(bufAssinatura, bufEsperado)) return false;

  const idadeMs = Date.now() - Number(timestamp);
  return idadeMs >= 0 && idadeMs < SESSAO_MS;
}
