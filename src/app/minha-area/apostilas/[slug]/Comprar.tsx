"use client";

import { useRouter } from "next/navigation";
import { sendGAEvent } from "@next/third-parties/google";
import { fbqTrack } from "@/components/meta-pixel";
import { gadsCompra } from "@/lib/google-ads";
import { PixCheckoutClaro } from "@/components/pix-checkout-claro";
import { CartaoTransparente, type DadosCartaoCompra } from "@/components/cartao-transparente";
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
    <div className="flex flex-col gap-3">
      <PixCheckoutClaro
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
        rotuloBotao={`Pagar ${preco} com PIX`}
        aoAprovar={(pedidoId) => aprovado(pedidoId, "pix")}
      />
      {cartao && (
        <CartaoTransparente
          produtoSlug={cartao.produtoSlug}
          valorCentavos={precoCentavos}
          chavePublica={cartao.chavePublica}
          emailCliente={cartao.email}
          nomeInicial={cartao.nome}
          aoAprovar={(pedidoId) => aprovado(pedidoId, "cartao")}
        />
      )}
    </div>
  );
}
