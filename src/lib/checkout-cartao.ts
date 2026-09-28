// src/lib/checkout-cartao.ts
//
// Cria um checkout hospedado do AbacatePay (cartão de crédito) para um
// pedido já criado no banco. Espelha `gerarPixParaPedido` (mesmas
// proteções: pausa de vendas, limite de tentativas, gravação do id da
// cobrança com a chave de serviço, só uma vez por pedido pendente).

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { criarClienteSupabaseAdmin } from "@/lib/supabase-admin";
import { abacatePayAtivo, criarCheckoutCartao } from "@/lib/abacatepay";
import { dentroDoLimite, hash } from "@/lib/limite";
import { vendasPausadas } from "@/lib/vigia";

export type EstadoCheckoutCartao = { erro: string } | { url: string };

export async function gerarCheckoutCartaoParaPedido({
  supabase,
  pedidoId,
  produtoSlug,
  produtoNome,
  valorCentavos,
  email,
  voltarPara,
}: {
  supabase: SupabaseClient<Database>;
  pedidoId: string;
  produtoSlug: string;
  produtoNome: string;
  valorCentavos: number;
  email: string;
  /** URL absoluta da página para onde a pessoa volta depois de pagar (ou desistir). */
  voltarPara: string;
}): Promise<EstadoCheckoutCartao> {
  void supabase; // reservado: mesma assinatura de gerarPixParaPedido, para simetria e uso futuro

  if (!abacatePayAtivo()) {
    return { erro: "Pagamento por cartão ainda não está disponível." };
  }

  if ((await vendasPausadas()).pausada) {
    return { erro: "As vendas estão temporariamente pausadas por manutenção de segurança. Tente novamente em breve." };
  }

  if (!(await dentroDoLimite(`cartao:${hash(email)}`, 10, 3600))) {
    return { erro: "Muitas tentativas de pagamento em pouco tempo. Aguarde alguns minutos." };
  }

  try {
    const checkout = await criarCheckoutCartao({
      valorCentavos,
      descricao: produtoNome,
      pedidoId,
      produtoExternalId: produtoSlug,
      returnUrl: voltarPara,
      completionUrl: voltarPara,
    });

    // gravado com a chave de serviço, igual ao PIX: só se o pedido ainda
    // estiver pendente e sem cobrança já associada.
    await criarClienteSupabaseAdmin()
      .from("pedidos")
      .update({ gateway: "abacatepay_checkout", gateway_charge_id: checkout.id })
      .eq("id", pedidoId)
      .eq("status", "pendente")
      .is("gateway_charge_id", null);

    return { url: checkout.url };
  } catch (e) {
    console.error("Falha ao criar checkout de cartão no AbacatePay", e);
    return { erro: "Não deu pra abrir o pagamento por cartão agora. Tenta de novo ou paga por PIX." };
  }
}
