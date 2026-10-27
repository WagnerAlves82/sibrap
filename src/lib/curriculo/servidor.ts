// src/lib/curriculo/servidor.ts
//
// Parte do servidor do gerador de currículos: salva o currículo na conta (só texto; a foto
// vem junto só para desenhar o PDF e é descartada), registra o download (o primeiro de cada
// currículo conta 1 uso) e devolve o PDF.
//
// Fase 2 (cobrança): a partir de LIMITE_GRATIS currículos gerados, cada download custa um
// pedido aprovado do produto 'download-curriculo' (R$ 3,90). O pedido é "gasto" no download
// (curriculo_downloads.pedido_id é único): para baixar de novo, novo pagamento.
// Quem acabou de criar a conta ainda não tem sessão (o e-mail não foi confirmado), então o
// pedido viaja com um token assinado pelo servidor em vez da sessão.

import crypto from "node:crypto";
import { criarClienteSupabaseAdmin } from "@/lib/supabase-admin";
import { confirmarPagamentoAbacate } from "@/lib/abacatepay";
import { confirmarPagamentoPorOrderId } from "@/lib/mercadopago";
import { gerarPixParaPedido, type EstadoPix } from "@/lib/pix";
import { montarDocumento } from "./secoes";
import { gerarPdfCurriculo } from "./pdf";
import { MODELOS, type Curriculo } from "./tipos";

export const LIMITE_GRATIS = 1000;
export const PRODUTO_DOWNLOAD = "download-curriculo";
const FOTO_MAX_BYTES = 400 * 1024;

/** Aceita só JPEG já reduzido no navegador (data URL de até ~400 KB). */
export function fotoValida(foto: unknown): string | null {
  if (typeof foto !== "string" || !foto.startsWith("data:image/jpeg;base64,")) return null;
  const base64 = foto.slice("data:image/jpeg;base64,".length);
  if (!/^[A-Za-z0-9+/=]+$/.test(base64) || base64.length * 0.75 > FOTO_MAX_BYTES) return null;
  return foto;
}

// ---------- tokens assinados (pedido sem sessão e envio por e-mail) ----------

function assinar(texto: string) {
  const segredo = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  return crypto.createHmac("sha256", segredo).update(`curriculo:${texto}`).digest("hex").slice(0, 40);
}
function confere(texto: string, token: unknown) {
  if (typeof token !== "string" || token.length !== 40) return false;
  return crypto.timingSafeEqual(Buffer.from(assinar(texto)), Buffer.from(token));
}
export const tokenPedido = (pedidoId: string, userId: string) => assinar(`pedido:${pedidoId}:${userId}`);
export const tokenEmail = (curriculoId: string) => assinar(`email:${curriculoId}`);
export const tokenEmailValido = (curriculoId: string, token: unknown) => confere(`email:${curriculoId}`, token);

/** Dono do pedido, se o token confere. */
export async function donoDoPedido(pedidoId: unknown, token: unknown): Promise<string | null> {
  if (typeof pedidoId !== "string" || !/^[0-9a-f-]{36}$/.test(pedidoId)) return null;
  const { data } = await criarClienteSupabaseAdmin().from("pedidos").select("user_id").eq("id", pedidoId).maybeSingle();
  return data && confere(`pedido:${pedidoId}:${data.user_id}`, token) ? data.user_id : null;
}

// ---------- modo pago ----------

export async function modoPago(): Promise<boolean> {
  const { data } = await criarClienteSupabaseAdmin().rpc("total_curriculos_gerados");
  return Number(data ?? 0) >= LIMITE_GRATIS;
}

export async function precoDownload(): Promise<number> {
  const { data } = await criarClienteSupabaseAdmin().from("produtos").select("preco_centavos").eq("slug", PRODUTO_DOWNLOAD).maybeSingle();
  return data?.preco_centavos ?? 390;
}

/** Pedido aprovado do download e ainda não usado, do próprio usuário. */
async function pedidoDisponivel(userId: string, pedidoId: string): Promise<boolean> {
  const admin = criarClienteSupabaseAdmin();
  const [{ data: pedido }, { data: usado }] = await Promise.all([
    admin.from("pedidos").select("status, user_id, produtos!inner(slug)").eq("id", pedidoId).maybeSingle(),
    admin.from("curriculo_downloads").select("id").eq("pedido_id", pedidoId).maybeSingle(),
  ]);
  const slug = (pedido?.produtos as { slug: string } | null)?.slug;
  return !!pedido && pedido.user_id === userId && pedido.status === "aprovado" && slug === PRODUTO_DOWNLOAD && !usado;
}

/** Cria o pedido de R$ 3,90 e o PIX, para quem tem sessão ou acabou de criar a conta. */
export async function criarPixDownload(userId: string, email: string, nome?: string): Promise<(EstadoPix & { token?: string }) | { erro: string }> {
  const admin = criarClienteSupabaseAdmin();
  const { data: produto } = await admin.from("produtos").select("id, nome, preco_centavos").eq("slug", PRODUTO_DOWNLOAD).eq("ativo", true).maybeSingle();
  if (!produto) return { erro: "O download pago está indisponível agora. Tente mais tarde." };
  const { data: pedido, error } = await admin
    .from("pedidos")
    .insert({ user_id: userId, produto_id: produto.id, valor_centavos: produto.preco_centavos, status: "pendente" })
    .select("id")
    .single();
  if (error || !pedido) return { erro: "Não deu para criar o pedido agora. Tente de novo." };
  const pix = await gerarPixParaPedido({ supabase: admin, pedidoId: pedido.id, produtoNome: produto.nome, valorCentavos: produto.preco_centavos, email, nome });
  return "erro" in pix ? pix : { ...pix, token: tokenPedido(pedido.id, userId) };
}

/** Situação do pagamento (consulta o gateway enquanto estiver pendente). */
export async function statusPedido(pedidoId: string): Promise<"pendente" | "aprovado" | "recusado"> {
  const { data: pedido } = await criarClienteSupabaseAdmin()
    .from("pedidos")
    .select("status, gateway, gateway_charge_id, mercadopago_order_id")
    .eq("id", pedidoId)
    .maybeSingle();
  if (!pedido) return "recusado";
  if (pedido.status === "aprovado") return "aprovado";
  if (pedido.status !== "pendente") return "recusado";
  const r =
    pedido.gateway === "abacatepay" && pedido.gateway_charge_id
      ? await confirmarPagamentoAbacate(pedido.gateway_charge_id)
      : pedido.mercadopago_order_id
        ? await confirmarPagamentoPorOrderId(pedido.mercadopago_order_id)
        : null;
  if (!r || "erro" in r) return "pendente";
  return r.status === "aprovado" ? "aprovado" : r.status === "pendente" ? "pendente" : "recusado";
}

// ---------- salvar e gerar ----------

export type Lead = { aceite: boolean; whatsapp?: string; cidade?: string; uf?: string };

export async function salvarCurriculo(opcoes: { userId: string; curriculo: Curriculo; curriculoId?: string | null; lead: Lead }): Promise<string> {
  const { userId, curriculo, lead } = opcoes;
  const admin = criarClienteSupabaseAdmin();
  const d = curriculo.dados;
  const formacaoPrincipal = d.formacoes.find((f) => f.curso.trim())?.curso.trim() ?? null;
  const agora = new Date().toISOString();
  const linha = {
    user_id: userId,
    perfil: curriculo.perfil,
    modelo: curriculo.modelo,
    dados: curriculo.dados,
    atualizado_em: agora,
    ultimo_acesso_em: agora,
    // dados de lead só com autorização de marketing (LGPD)
    aceite_marketing: lead.aceite,
    aceite_marketing_em: lead.aceite ? agora : null,
    whatsapp: lead.aceite ? (lead.whatsapp || d.telefone || null) : null,
    cidade: lead.aceite ? (lead.cidade || d.cidade || null) : null,
    uf: lead.aceite ? (lead.uf || d.uf || null) : null,
    area: lead.aceite ? d.objetivo.slice(0, 200) || null : null,
    escolaridade: lead.aceite ? formacaoPrincipal : null,
  };

  if (opcoes.curriculoId) {
    const { data } = await admin.from("curriculos").update(linha).eq("id", opcoes.curriculoId).eq("user_id", userId).select("id").maybeSingle();
    if (data) return data.id;
  }
  const { data, error } = await admin.from("curriculos").insert(linha).select("id").single();
  if (error) throw new Error(`curriculo: ${error.message}`);
  return data.id;
}

export class PagamentoNecessario extends Error {}

/**
 * Salva, confere a regra (grátis ou pedido pago disponível), registra o download e gera o PDF.
 * No modo pago sem pedido válido, lança PagamentoNecessario (o currículo já fica salvo).
 */
export async function salvarEGerarPdf(opcoes: {
  userId: string;
  curriculo: Curriculo;
  foto: string | null;
  curriculoId?: string | null;
  lead: Lead;
  pedidoId?: string | null;
}): Promise<{ pdf: Buffer; curriculoId: string }> {
  const { userId, curriculo, foto, pedidoId } = opcoes;
  const curriculoId = await salvarCurriculo(opcoes);
  const admin = criarClienteSupabaseAdmin();

  const pago = await modoPago();
  if (pago && !(pedidoId && (await pedidoDisponivel(userId, pedidoId)))) throw new PagamentoNecessario(curriculoId);

  const { count } = await admin.from("curriculo_downloads").select("id", { count: "exact", head: true }).eq("curriculo_id", curriculoId);
  const { error } = await admin
    .from("curriculo_downloads")
    .insert({ curriculo_id: curriculoId, user_id: userId, primeiro: !count, pedido_id: pago ? pedidoId : null });
  // pedido usado ao mesmo tempo em outra aba: o índice único barra o segundo download
  if (error && pago) throw new PagamentoNecessario(curriculoId);

  // limpeza dos currículos sem acesso há 12 meses (barata: usa índice)
  if (Math.random() < 0.05) await admin.rpc("apagar_curriculos_inativos");

  const pdf = await gerarPdfCurriculo(montarDocumento(curriculo), curriculo.modelo, MODELOS[curriculo.modelo].temFoto ? foto : null);
  return { pdf, curriculoId };
}

export function nomeArquivo(nome: string) {
  const base = nome.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `curriculo-${base || "sibrap"}.pdf`;
}

export function respostaPdf(pdf: Buffer, nome: string, curriculoId: string) {
  return new Response(new Uint8Array(pdf), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="${nomeArquivo(nome)}"`,
      "cache-control": "no-store",
      "x-curriculo-id": curriculoId,
      // libera o envio por e-mail deste currículo (só de quem acabou de baixar)
      "x-curriculo-token": tokenEmail(curriculoId),
    },
  });
}
