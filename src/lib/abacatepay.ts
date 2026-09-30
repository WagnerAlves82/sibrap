// src/lib/abacatepay.ts
//
// Integração com o AbacatePay (API v2, PIX "transparente": QR Code na
// nossa própria página). Mesmo princípio do resto do projeto: o corpo de
// uma notificação nunca libera acesso sozinho — a confirmação sempre
// consulta a API pelo id da cobrança que NÓS gravamos no pedido.

import crypto from "node:crypto";
import { criarClienteSupabaseAdmin } from "@/lib/supabase-admin";
import { entregarPedido } from "@/lib/entrega";
import type { StatusPedido } from "@/lib/mercadopago";

const BASE = "https://api.abacatepay.com/v2";

// A API do AbacatePay recusa (HTTP 400) description/name com certos
// caracteres Unicode fora do ASCII estendido — travessão "—" (comum nos
// nomes de produto, ex.: "Apostila — Cargo — Cidade/UF") é um deles.
// Normaliza pro equivalente ASCII mais próximo antes de mandar qualquer
// texto livre pra eles, em vez de descobrir na hora que falha.
function textoAbacatePay(s: string): string {
  return s
    .replace(/[—–]/g, "-")
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    .replace(/…/g, "...");
}

// Chave pública de verificação de assinatura, divulgada na documentação do
// AbacatePay (igual para todas as lojas). Pode ser trocada por env.
const CHAVE_PUBLICA_ASSINATURA =
  "t9dXRhHHo3yDEj5pVDYz0frf7q6bMKyMRmxxCPIPp3RCplBfXRxqlC6ZpiWmOqj4L63qEaeUOtrCI8P0VMUgo6iIga2ri9ogaHFs0WIIywSMg0q7RmBfybe1E5XJcfC4IW3alNqym0tXoAKkzvfEjZxV6bE0oG2zJrNNYmUCKZyV0KZ3JS8Votf9EAWWYdiDkMkpbMdPggfh1EqHlVkMiTady6jOR3hyzGEHrIz2Ret0xHKMbiqkr9HS1JhNHDX9";

export function abacatePayAtivo(): boolean {
  return !!process.env.ABACATEPAY_API_KEY && process.env.PIX_GATEWAY !== "mercadopago";
}

type Envelope<T> = { data: T | null; error: string | null; success: boolean };

async function chamar<T>(caminho: string, init?: RequestInit): Promise<T> {
  const chave = process.env.ABACATEPAY_API_KEY;
  if (!chave) throw new Error("ABACATEPAY_API_KEY não configurada");
  const resposta = await fetch(`${BASE}${caminho}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${chave}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });
  const corpo = (await resposta.json().catch(() => null)) as Envelope<T> | null;
  if (!resposta.ok || !corpo?.success || !corpo.data) {
    throw new Error(`AbacatePay ${resposta.status}: ${corpo?.error ?? "resposta inválida"}`);
  }
  return corpo.data;
}

export type CobrancaPix = {
  id: string;
  status: string;
  brCode: string;
  brCodeBase64: string;
};

export async function criarCobrancaPix({
  valorCentavos,
  descricao,
  pedidoId,
}: {
  valorCentavos: number;
  descricao: string;
  pedidoId: string;
}): Promise<CobrancaPix> {
  return chamar<CobrancaPix>("/transparents/create", {
    method: "POST",
    body: JSON.stringify({
      method: "PIX",
      data: {
        amount: valorCentavos,
        description: textoAbacatePay(descricao).slice(0, 200),
        expiresIn: 3600,
        metadata: { pedidoId },
      },
    }),
  });
}

function mapStatus(status: string): StatusPedido {
  if (status === "PAID" || status === "APPROVED") return "aprovado";
  if (["EXPIRED", "CANCELLED", "FAILED"].includes(status)) return "recusado";
  return "pendente";
}

/**
 * Consulta a cobrança no AbacatePay (pelo id que gravamos em
 * `pedidos.gateway_charge_id`) e atualiza o pedido. O trigger do banco
 * libera o acesso quando o status vira 'aprovado'; a entrega por e-mail é
 * idempotente.
 */
export async function confirmarPagamentoAbacate(
  chargeId: string
): Promise<{ status: StatusPedido } | { erro: string }> {
  const admin = criarClienteSupabaseAdmin();
  const { data: pedido } = await admin
    .from("pedidos")
    .select("id, status")
    .eq("gateway", "abacatepay")
    .eq("gateway_charge_id", chargeId)
    .maybeSingle();
  if (!pedido) return { erro: "Pedido não encontrado para esta cobrança" };

  let statusRemoto: string;
  try {
    statusRemoto = (await chamar<{ status: string }>(`/transparents/check?id=${encodeURIComponent(chargeId)}`)).status;
  } catch (e) {
    return { erro: e instanceof Error ? e.message : "Erro ao consultar cobrança" };
  }

  const status = mapStatus(statusRemoto);
  if (pedido.status !== "aprovado" && status !== "pendente") {
    const { error } = await admin
      .from("pedidos")
      .update({ status })
      .eq("id", pedido.id)
      .neq("status", "aprovado");
    if (error) return { erro: error.message };
  }

  if (status === "aprovado") {
    try {
      await entregarPedido(pedido.id);
    } catch (e) {
      console.error("Falha ao enviar a entrega do pedido", pedido.id, e);
    }
  }
  return { status: pedido.status === "aprovado" ? "aprovado" : status };
}

// ---------- checkout hospedado (cartão de crédito) ----------
//
// O checkout transparente (acima) só aceita PIX. Cartão de crédito só
// existe no checkout HOSPEDADO do AbacatePay: a pessoa é redirecionada
// para a página de pagamento deles (PIX ou cartão, à escolha dela) e
// volta pelo `completionUrl`. Esse fluxo exige um "produto" cadastrado
// na conta do AbacatePay (endpoint /products), referenciado por id.

type Produto = { id: string; externalId: string; status: string };

/** Busca o produto pelo externalId (o slug do nosso produto); cria se não existir. */
async function garantirProdutoAbacate({
  externalId,
  nome,
  valorCentavos,
}: {
  externalId: string;
  nome: string;
  valorCentavos: number;
}): Promise<string> {
  const chave = process.env.ABACATEPAY_API_KEY;
  if (!chave) throw new Error("ABACATEPAY_API_KEY não configurada");

  const busca = await fetch(`${BASE}/products/get?externalId=${encodeURIComponent(externalId)}`, {
    headers: { Authorization: `Bearer ${chave}` },
    cache: "no-store",
  });
  const corpoBusca = (await busca.json().catch(() => null)) as Envelope<Produto> | null;
  if (busca.ok && corpoBusca?.success && corpoBusca.data) return corpoBusca.data.id;

  const criado = await chamar<Produto>("/products/create", {
    method: "POST",
    body: JSON.stringify({ externalId, name: textoAbacatePay(nome).slice(0, 160), price: valorCentavos, currency: "BRL" }),
  });
  return criado.id;
}

export type CheckoutCartao = { id: string; url: string };

/**
 * Cria um checkout hospedado (methods: ["CARD"]) para a pessoa pagar no
 * cartão na própria página do AbacatePay. `pedidoId` vira o externalId do
 * checkout, para a confirmação (webhook ou volta pelo completionUrl)
 * localizar o pedido sem depender do formato do payload do evento.
 */
export async function criarCheckoutCartao({
  valorCentavos,
  descricao,
  pedidoId,
  produtoExternalId,
  returnUrl,
  completionUrl,
  maxParcelas = 1,
}: {
  valorCentavos: number;
  descricao: string;
  pedidoId: string;
  produtoExternalId: string;
  returnUrl: string;
  completionUrl: string;
  maxParcelas?: number;
}): Promise<CheckoutCartao> {
  const produtoId = await garantirProdutoAbacate({
    externalId: produtoExternalId,
    nome: descricao,
    valorCentavos,
  });
  return chamar<CheckoutCartao>("/checkouts/create", {
    method: "POST",
    body: JSON.stringify({
      items: [{ id: produtoId, quantity: 1 }],
      methods: ["CARD"],
      card: { maxInstallments: Math.max(1, Math.min(12, maxParcelas)) },
      externalId: pedidoId,
      returnUrl,
      completionUrl,
      metadata: { pedidoId },
    }),
  });
}

function mapStatusCheckout(status: string): StatusPedido {
  if (status === "PAID") return "aprovado";
  if (["EXPIRED", "CANCELLED", "REFUNDED"].includes(status)) return "recusado";
  return "pendente";
}

/**
 * Confirma um checkout de CARTÃO pelo id que o AbacatePay atribuiu (o mesmo
 * que gravamos em `pedidos.gateway_charge_id` ao criar o checkout — igual
 * ao PIX). Mesmo princípio de `confirmarPagamentoAbacate`: nunca confia no
 * corpo do webhook, sempre confere pela API antes de liberar o acesso.
 */
export async function confirmarPagamentoAbacateCheckout(
  checkoutId: string
): Promise<{ status: StatusPedido } | { erro: string }> {
  const admin = criarClienteSupabaseAdmin();
  const { data: pedido } = await admin
    .from("pedidos")
    .select("id, status")
    .eq("gateway", "abacatepay_checkout")
    .eq("gateway_charge_id", checkoutId)
    .maybeSingle();
  if (!pedido) return { erro: "Pedido não encontrado para este checkout" };

  let statusRemoto: string;
  try {
    const chave = process.env.ABACATEPAY_API_KEY;
    if (!chave) throw new Error("ABACATEPAY_API_KEY não configurada");
    const r = await fetch(`${BASE}/checkouts/get?id=${encodeURIComponent(checkoutId)}`, {
      headers: { Authorization: `Bearer ${chave}` },
      cache: "no-store",
    });
    const corpo = (await r.json().catch(() => null)) as Envelope<{ status: string }> | null;
    if (!r.ok || !corpo?.success || !corpo.data) throw new Error(corpo?.error ?? `AbacatePay ${r.status}`);
    statusRemoto = corpo.data.status;
  } catch (e) {
    return { erro: e instanceof Error ? e.message : "Erro ao consultar o checkout" };
  }

  const status = mapStatusCheckout(statusRemoto);
  if (pedido.status !== "aprovado" && status !== "pendente") {
    const { error } = await admin
      .from("pedidos")
      .update({ status })
      .eq("id", pedido.id)
      .neq("status", "aprovado");
    if (error) return { erro: error.message };
  }

  if (status === "aprovado") {
    try {
      await entregarPedido(pedido.id);
    } catch (e) {
      console.error("Falha ao enviar a entrega do pedido", pedido.id, e);
    }
  }
  return { status: pedido.status === "aprovado" ? "aprovado" : status };
}

// ---------- webhook ----------

function iguais(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

/** O segredo que cadastramos na URL do webhook (?webhookSecret=...). */
export function segredoDaUrlValido(recebido: string | null): boolean {
  const segredo = process.env.ABACATEPAY_WEBHOOK_SECRET;
  if (!segredo || !recebido) return false;
  return iguais(recebido, segredo);
}

/** HMAC-SHA256 (base64) dos bytes do corpo, no cabeçalho X-Webhook-Signature. */
export function assinaturaValida(corpoBruto: string, assinatura: string | null): boolean {
  if (!assinatura) return false;
  const chave = process.env.ABACATEPAY_SIGNING_KEY ?? CHAVE_PUBLICA_ASSINATURA;
  const esperada = crypto.createHmac("sha256", chave).update(Buffer.from(corpoBruto, "utf8")).digest("base64");
  return iguais(esperada, assinatura);
}
