// src/lib/origem.ts
//
// Origem de marketing de cada venda. O navegador guarda, em um cookie próprio
// (sibrap_origem, ver CapturarOrigem), a campanha/anúncio pelo qual a pessoa
// chegou; na hora de gerar o pagamento o servidor copia isso para
// pedidos.origem, junto com cidade/UF (cabeçalhos de geolocalização da Vercel).

import { cookies, headers } from "next/headers";
import { criarClienteSupabaseAdmin } from "@/lib/supabase-admin";

export const COOKIE_ORIGEM = "sibrap_origem";

export type OrigemVenda = {
  gclid?: string;
  fbclid?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  referrer?: string;
  pagina?: string;
  cidade?: string;
  uf?: string;
  pais?: string;
};

const CAMPOS = ["gclid", "fbclid", "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "referrer", "pagina"] as const;

function limpar(v: unknown, max = 120): string | undefined {
  return typeof v === "string" && v.trim() ? v.trim().slice(0, max) : undefined;
}

function decodificar(v: string | null): string | undefined {
  if (!v) return undefined;
  try {
    return limpar(decodeURIComponent(v), 80);
  } catch {
    return limpar(v, 80);
  }
}

/** Lê o cookie de origem (se houver) e junta a localização aproximada da requisição. */
export async function lerOrigem(): Promise<OrigemVenda> {
  const origem: OrigemVenda = {};
  try {
    const bruto = (await cookies()).get(COOKIE_ORIGEM)?.value;
    if (bruto) {
      const dados = JSON.parse(decodeURIComponent(bruto)) as Record<string, unknown>;
      for (const c of CAMPOS) {
        const v = limpar(dados[c], c === "gclid" || c === "fbclid" ? 200 : 120);
        if (v) origem[c] = v;
      }
    }
  } catch {
    // cookie ausente ou corrompido: segue só com a localização
  }
  try {
    const h = await headers();
    origem.cidade = decodificar(h.get("x-vercel-ip-city"));
    origem.uf = decodificar(h.get("x-vercel-ip-country-region"));
    origem.pais = decodificar(h.get("x-vercel-ip-country"));
  } catch {
    // fora de uma requisição
  }
  return origem;
}

/** Grava a origem no pedido (uma vez; nunca derruba o checkout). */
export async function gravarOrigemPedido(pedidoId: string): Promise<void> {
  try {
    const origem = await lerOrigem();
    await criarClienteSupabaseAdmin()
      .from("pedidos")
      .update({ origem })
      .eq("id", pedidoId)
      .is("origem", null);
  } catch (e) {
    console.error("Falha ao gravar a origem do pedido", pedidoId, e);
  }
}

/** Texto legível para o e-mail de venda: "Google Ads · campanha X · Porto Velho/RO". */
export function descreverOrigem(o: OrigemVenda | null | undefined): string {
  if (!o) return "não registrada";
  let canal: string;
  if (o.gclid) canal = "Google Ads";
  else if (o.fbclid) canal = "Facebook/Instagram (anúncio ou link)";
  else if (o.utm_source) canal = `${o.utm_source}${o.utm_medium ? ` / ${o.utm_medium}` : ""}`;
  else if (o.referrer) canal = `site ${o.referrer}`;
  else canal = "acesso direto";
  const partes = [canal];
  if (o.utm_campaign) partes.push(`campanha ${o.utm_campaign}`);
  if (o.utm_content) partes.push(o.utm_content);
  if (o.pagina) partes.push(`entrou por ${o.pagina}`);
  const lugar = [o.cidade, o.uf].filter(Boolean).join("/");
  if (lugar) partes.push(lugar);
  return partes.join(" · ");
}
