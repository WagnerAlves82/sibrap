"use client";

import { useRouter } from "next/navigation";
import { sendGAEvent } from "@next/third-parties/google";
import { fbqTrack } from "@/components/meta-pixel";
import { gadsCompra } from "@/lib/google-ads";
import { EscolherPagamento } from "@/components/escolher-pagamento";
import type { DadosCartaoCompra } from "@/components/cartao-transparente";
import { criarPagamentoApostilaAction } from "./actions";

export function ComprarApostila({
  slug,
  titulo,
  preco,
  precoCentavos,
  cartao = null,
  combo = false,
}: {
  slug: string;
  titulo: string;
  preco: string;
  precoCentavos: number;
  /** cartão sem sair do site (null = só PIX) */
  cartao?: DadosCartaoCompra | null;
  combo?: boolean;
}) {
  const router = useRouter();

  const item = {
    item_id: combo ? `combo-${slug}` : slug,
    item_name: titulo,
    price: precoCentavos / 100,
    quantity: 1,
  };

  function aprovado(pedidoId: string, pagamento: "pix" | "cartao") {
    sendGAEvent("event", "purchase", {
      transaction_id: pedidoId,
      currency: "BRL",
      value: precoCentavos / 100,
      payment_type: pagamento,
      items: [item],
    });
    fbqTrack("Purchase", { currency: "BRL", value: precoCentavos / 100 });
    gadsCompra({ valor: precoCentavos / 100, pedidoId });
    router.refresh();
  }

  return (
    <EscolherPagamento
      valorCentavos={precoCentavos}
      rotuloComprar={`Comprar por ${preco}`}
      criarPix={() => {
        sendGAEvent("event", "begin_checkout", {
          currency: "BRL",
          value: precoCentavos / 100,
          payment_type: "pix",
          items: [item],
        });
        fbqTrack("InitiateCheckout", { currency: "BRL", value: precoCentavos / 100 });
        return criarPagamentoApostilaAction(slug, combo);
      }}
      cartao={cartao}
      aoAprovar={aprovado}
    />
  );
}
