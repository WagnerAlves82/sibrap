// src/lib/limite.ts
//
// Limite de tentativas (login, cadastro, PIX, senha do admin) guardado no
// banco, porque cada requisição em ambiente serverless pode cair numa
// instância diferente e um contador em memória não serviria. Janela fixa;
// a função `registrar_tentativa` só é executável pela chave de serviço.

import crypto from "node:crypto";
import { headers } from "next/headers";
import { criarClienteSupabaseAdmin } from "@/lib/supabase-admin";

/** Identificador anônimo do cliente (o IP nunca é gravado em texto puro). */
export async function identificarCliente(): Promise<string> {
  const h = await headers();
  const ip =
    h.get("x-vercel-forwarded-for") ??
    h.get("x-real-ip") ??
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "desconhecido";
  return hash(ip);
}

export function hash(valor: string): string {
  return crypto.createHash("sha256").update(valor.toLowerCase()).digest("hex").slice(0, 20);
}

/**
 * Registra uma tentativa e diz se ainda está dentro do limite.
 * `falhaAberta`: se o banco falhar, libera (true) ou bloqueia (false).
 */
export async function dentroDoLimite(
  chave: string,
  limite: number,
  janelaSegundos: number,
  falhaAberta = true
): Promise<boolean> {
  try {
    const { data, error } = await criarClienteSupabaseAdmin().rpc("registrar_tentativa", {
      p_chave: chave,
      p_limite: limite,
      p_janela_segundos: janelaSegundos,
    });
    if (error || typeof data !== "boolean") return falhaAberta;
    return data;
  } catch {
    return falhaAberta;
  }
}

export const MSG_MUITAS_TENTATIVAS = "Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente de novo.";
