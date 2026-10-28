// src/lib/cartao-transparente.ts
//
// Pagamento no cartão sem sair do site (checkout transparente do AbacatePay).
// O navegador tokeniza o cartão no formulário seguro do AbacatePay e manda só o token
// (ctok_, uso único, 60 s) + dados do comprador. Aqui: mesmas proteções do PIX
// (pausa de vendas, limite por conta), cobrança, gravação do id no pedido com a chave
// de serviço e confirmação sempre pela API (nunca pelo que o navegador diz).

import { criarClienteSupabaseAdmin } from "@/lib/supabase-admin";
import { cartaoLiberado, confirmarPagamentoAbacate, criarCobrancaCartao } from "@/lib/abacatepay";
import { maxParcelas } from "@/lib/apostilas";
import { cpfValido, normalizarCpf } from "@/lib/cpf";
import { dentroDoLimite, hash } from "@/lib/limite";
import { vendasPausadas } from "@/lib/vigia";
import { gravarOrigemPedido } from "@/lib/origem";
import type { StatusPedido } from "@/lib/mercadopago";

export type DadosCartao = { token: string; parcelas: number; nome: string; cpf: string; celular: string };
export type EstadoCartao = { erro: string } | { pedidoId: string; status: StatusPedido; valorCentavos: number };

/** A chave pública (pk_) do AbacatePay vai para o navegador; só existe com o cartão ligado. */
export function chavePublicaCartao(): string | null {
  const chave = process.env.ABACATEPAY_PUBLIC_KEY;
  return cartaoLiberado() && chave ? chave : null;
}

/** Monta o que a tela de compra precisa para mostrar o cartão (null = só PIX). */
export function dadosCartaoCompra(
  produtoSlug: string,
  user: { email?: string | null; user_metadata?: unknown } | null | undefined
): { chavePublica: string; produtoSlug: string; email: string; nome?: string } | null {
  const chavePublica = chavePublicaCartao();
  if (!chavePublica || !user?.email) return null;
  return { chavePublica, produtoSlug, email: user.email, nome: (user.user_metadata as { nome?: string } | undefined)?.nome };
}

function mensagemAmigavel(e: unknown): string {
  const msg = e instanceof Error ? e.message : "";
  if (/token/i.test(msg)) return "O tempo para confirmar o cartão acabou. Toque em pagar de novo.";
  if (/minimum|parcela|installment/i.test(msg)) return "Esse número de parcelas não está disponível para este valor.";
  if (/processar|declin|recus/i.test(msg)) return "O banco recusou o pagamento. Tente outro cartão ou pague no PIX.";
  return "Não deu pra concluir o pagamento no cartão agora. Tente de novo ou pague no PIX.";
}

export async function pagarPedidoComCartao({
  pedidoId,
  valorCentavos,
  email,
  dados,
}: {
  pedidoId: string;
  valorCentavos: number;
  email: string;
  dados: DadosCartao;
}): Promise<EstadoCartao> {
  if (!chavePublicaCartao()) return { erro: "Pagamento por cartão ainda não está disponível." };
  if ((await vendasPausadas()).pausada) {
    return { erro: "As vendas estão temporariamente pausadas por manutenção de segurança. Tente novamente em breve." };
  }
  if (!(await dentroDoLimite(`cartao:${hash(email)}`, 10, 3600))) {
    return { erro: "Muitas tentativas de pagamento em pouco tempo. Aguarde alguns minutos." };
  }

  const nome = dados.nome.trim().replace(/\s+/g, " ");
  const cpf = normalizarCpf(dados.cpf);
  const celular = dados.celular.replace(/\D/g, "");
  const parcelas = Math.trunc(dados.parcelas);
  if (!/^ctok_[A-Za-z0-9_-]{4,200}$/.test(dados.token)) return { erro: "Cartão não confirmado. Toque em pagar de novo." };
  if (nome.length < 3 || nome.length > 150) return { erro: "Digite o seu nome completo." };
  if (!cpfValido(cpf)) return { erro: "Digite um CPF válido." };
  if (celular.length < 10 || celular.length > 11) return { erro: "Digite um celular com DDD." };
  if (!(parcelas >= 1 && parcelas <= maxParcelas(valorCentavos))) return { erro: "Número de parcelas inválido." };

  await gravarOrigemPedido(pedidoId);

  let cobranca;
  try {
    cobranca = await criarCobrancaCartao({
      valorCentavos,
      token: dados.token,
      parcelas,
      cliente: { name: nome, email, taxId: cpf, cellphone: celular },
      pedidoId,
    });
  } catch (e) {
    console.error("Falha ao cobrar o cartão no AbacatePay", pedidoId, e);
    return { erro: mensagemAmigavel(e) };
  }

  // id da cobrança gravado com a chave de serviço, só se o pedido ainda estiver pendente e sem cobrança
  await criarClienteSupabaseAdmin()
    .from("pedidos")
    .update({ gateway: "abacatepay", gateway_charge_id: cobranca.id })
    .eq("id", pedidoId)
    .eq("status", "pendente")
    .is("gateway_charge_id", null);

  // confirma pela API (libera o acesso e envia o e-mail se aprovado); PENDING espera o webhook
  const r = await confirmarPagamentoAbacate(cobranca.id);
  if ("erro" in r) return { pedidoId, status: "pendente", valorCentavos };
  if (r.status === "recusado") return { erro: "O banco recusou o pagamento. Tente outro cartão ou pague no PIX." };
  return { pedidoId, status: r.status, valorCentavos };
}
