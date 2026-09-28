// src/lib/admin-auth.ts
//
// Autenticação do painel admin: uma senha (ADMIN_PASSWORD), sem tabela de
// usuário. A sessão é um token assinado (HMAC) com validade embutida e um
// valor aleatório, guardado em cookie HttpOnly/Secure/SameSite=Strict.
//
// A chave de assinatura vem de ADMIN_SESSION_SECRET (aleatória, separada da
// senha). Sem ela, é derivada da senha — funciona, mas quem roubasse um
// cookie poderia tentar descobrir a senha offline; por isso defina a
// variável e, para derrubar todas as sessões, basta trocá-la.

import crypto from "node:crypto";

const PRODUCAO = process.env.NODE_ENV === "production";

// Prefixo __Host-: o navegador só aceita o cookie com Secure, Path=/ e sem
// Domain, o que impede um subdomínio de plantar/sobrescrever a sessão.
export const ADMIN_COOKIE_NAME = PRODUCAO ? "__Host-sibrap_admin" : "sibrap_admin";
export const SESSAO_MS = 12 * 60 * 60 * 1000; // 12 horas

export const ADMIN_COOKIE_OPCOES = {
  httpOnly: true,
  secure: PRODUCAO,
  sameSite: "strict" as const,
  path: "/",
  maxAge: SESSAO_MS / 1000,
};

function chave(): Buffer {
  const dedicada = process.env.ADMIN_SESSION_SECRET;
  if (dedicada && dedicada.length >= 32) return Buffer.from(dedicada, "utf8");
  const senha = process.env.ADMIN_PASSWORD;
  if (!senha) throw new Error("ADMIN_PASSWORD não configurada");
  return crypto.createHmac("sha256", senha).update("sibrap-admin-sessao-v2").digest();
}

export function assinar(dados: string): string {
  return crypto.createHmac("sha256", chave()).update(dados).digest("hex");
}

export function criarTokenAdmin(): string {
  const expira = (Date.now() + SESSAO_MS).toString();
  const nonce = crypto.randomBytes(16).toString("hex");
  const dados = `${expira}.${nonce}`;
  return `${dados}.${assinar(dados)}`;
}

export function tokenAdminValido(token: string | undefined | null): boolean {
  if (!token) return false;
  const partes = token.split(".");
  if (partes.length !== 3) return false;
  const [expira, nonce, assinatura] = partes;
  if (!/^\d+$/.test(expira) || !/^[0-9a-f]{32}$/.test(nonce)) return false;

  let esperado: string;
  try {
    esperado = assinar(`${expira}.${nonce}`);
  } catch {
    return false;
  }
  const a = Buffer.from(assinatura);
  const b = Buffer.from(esperado);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;

  return Date.now() < Number(expira);
}

/** Token de ação de e-mail (revogar sessões etc.): "<expira>.<assinatura>", vale 24 h. */
export function criarTokenAcao(acao: string, validadeMs = 24 * 60 * 60 * 1000): string {
  const expira = (Date.now() + validadeMs).toString();
  return `${expira}.${assinar(`acao:${acao}:${expira}`)}`;
}

export function tokenAcaoValido(acao: string, token: string): boolean {
  const [expira, assinatura] = token.split(".");
  if (!expira || !assinatura || !/^\d+$/.test(expira)) return false;
  const esperado = assinar(`acao:${acao}:${expira}`);
  const a = Buffer.from(assinatura);
  const b = Buffer.from(esperado);
  return a.length === b.length && crypto.timingSafeEqual(a, b) && Date.now() < Number(expira);
}

/** A sessão foi criada há pouco? (exigido para ações sensíveis) */
export function sessaoRecente(token: string | undefined | null, limiteMs = 10 * 60 * 1000): boolean {
  if (!tokenAdminValido(token)) return false;
  const emissao = Number(token!.split(".")[0]) - SESSAO_MS;
  return Date.now() - emissao < limiteMs;
}
