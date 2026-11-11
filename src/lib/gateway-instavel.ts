// src/lib/gateway-instavel.ts
//
// Disjuntor para quando o gateway (AbacatePay) se recusa a criar cobrança por
// bloqueio do lado dele (página do Cloudflare/antifraude, fora do ar, limite).
// Caso real de 11/11/2026: uma cliente clicou 9 vezes em 2 minutos, todas
// barradas, sem nenhuma mensagem útil, e cada clique deixou um pedido pendente.
// Agora: mensagem clara, pausa curta nas chamadas, alerta para o admin e o
// pedido sem cobrança é descartado (não vira "PIX expirado" nem lembrete).

import { criarClienteSupabaseAdmin } from "@/lib/supabase-admin";
import { dentroDoLimite } from "@/lib/limite";
import { enviarAlertaAdmin, esc } from "@/lib/resend";

export class GatewayIndisponivel extends Error {
  constructor(
    public status: number,
    public motivo: string
  ) {
    super(`AbacatePay ${status}: ${motivo}`);
    this.name = "GatewayIndisponivel";
  }
}

/** Resposta que não é a API respondendo: página HTML (Cloudflare), limite ou fora do ar. */
export function erroDeBloqueio(status: number, corpo: string, contentType: string | null): GatewayIndisponivel | null {
  const html = /text\/html/i.test(contentType ?? "") || /^\s*<(!doctype|html)/i.test(corpo);
  if (html) {
    const motivo = /cloudflare|you have been blocked|just a moment|attention required/i.test(corpo)
      ? "bloqueio do Cloudflare (antifraude do provedor de PIX)"
      : "resposta em HTML no lugar da API";
    return new GatewayIndisponivel(status, motivo);
  }
  if ([403, 429, 502, 503, 504].includes(status)) return new GatewayIndisponivel(status, "gateway indisponível ou limitando chamadas");
  return null;
}

export const MSG_GATEWAY_INSTAVEL =
  "O sistema de pagamento está instável agora e não conseguiu gerar a cobrança. Não é um problema com você nem com o seu cadastro. Tente de novo em alguns minutos ou fale com a gente em sibrap.tec.br/contato.";

export const MSG_FALHA_PAGAMENTO =
  "Não deu pra gerar a cobrança agora. Tente de novo em alguns minutos ou fale com a gente em sibrap.tec.br/contato.";

const CHAVE = "gateway:abacatepay:bloqueio";
const PAUSA_SEGUNDOS = 300;

const db = () => criarClienteSupabaseAdmin();

/** Houve bloqueio nos últimos minutos? Então nem chama o gateway (evita piorar o bloqueio). */
export async function gatewayEmPausa(): Promise<boolean> {
  try {
    const desde = new Date(Date.now() - PAUSA_SEGUNDOS * 1000).toISOString();
    const { data } = await db().from("limite_tentativas").select("contagem").eq("chave", CHAVE).gt("janela", desde).limit(1);
    return !!data?.length;
  } catch {
    return false;
  }
}

/** Registra o bloqueio (liga a pausa) e avisa o admin no máximo uma vez a cada 30 minutos. */
export async function registrarBloqueio(onde: string, e: GatewayIndisponivel): Promise<void> {
  console.error(`Gateway bloqueado (${onde})`, e.status, e.motivo);
  await dentroDoLimite(CHAVE, 100000, 60);
  if (!(await dentroDoLimite("alerta:gateway-bloqueio", 1, 1800))) return;
  await enviarAlertaAdmin({
    assunto: "Aviso: o AbacatePay bloqueou a geração de cobranças",
    titulo: "Pagamentos bloqueados pelo gateway",
    corpoHtml: `<p style="margin:0 0 12px 0;">Agora há pouco o AbacatePay recusou criar uma cobrança (${esc(onde)}): <strong>HTTP ${e.status}, ${esc(e.motivo)}</strong>.</p>
<p style="margin:0 0 12px 0;">O site mostrou ao cliente uma mensagem pedindo para tentar de novo em alguns minutos e parou de chamar o gateway por ${PAUSA_SEGUNDOS / 60} minutos. Se o bloqueio continuar, fale com o suporte do AbacatePay informando o horário.</p>
<p style="margin:0;">Este aviso se repete no máximo a cada 30 minutos. O resumo do dia aparece também no vigia.</p>`,
  }).catch(() => undefined);
}

/** Quantos bloqueios nas últimas 24 h (para o vigia). */
export async function bloqueiosUltimas24h(): Promise<number> {
  try {
    const desde = new Date(Date.now() - 24 * 3600_000).toISOString();
    const { data } = await db().from("limite_tentativas").select("contagem").eq("chave", CHAVE).gt("janela", desde);
    return (data ?? []).reduce((s, r) => s + (r.contagem ?? 0), 0);
  } catch {
    return 0;
  }
}

/** Remove o pedido que não chegou a ter cobrança (não vira "PIX expirado" nem lembrete de pagamento). */
export async function descartarPedidoSemCobranca(pedidoId: string): Promise<void> {
  try {
    await db()
      .from("pedidos")
      .delete()
      .eq("id", pedidoId)
      .eq("status", "pendente")
      .is("gateway_charge_id", null)
      .is("mercadopago_order_id", null);
  } catch {
    // se algo referenciar o pedido, ele só fica como está
  }
}
