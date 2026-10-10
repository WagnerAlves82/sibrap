"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sendGAEvent } from "@next/third-parties/google";
import { fbqTrack } from "@/components/meta-pixel";
import { PixCheckoutClaro } from "@/components/pix-checkout-claro";
import { Alert } from "@/components/alert";
import {
  criarPagamentoApostilaAction,
  criarPagamentoCartaoApostilaAction,
} from "./actions";

export function ComprarApostila({
  slug,
  titulo,
  preco,
  precoCentavos,
  cartaoAtivo = false,
}: {
  slug: string;
  titulo: string;
  preco: string;
  precoCentavos: number;
  cartaoAtivo?: boolean;
}) {
  const router = useRouter();
  const [carregandoCartao, setCarregandoCartao] = useState(false);
  const [erroCartao, setErroCartao] = useState<string | null>(null);

  const item = {
    item_id: slug,
    item_name: titulo,
    price: precoCentavos / 100,
    quantity: 1,
  };

  async function pagarComCartao() {
    sendGAEvent("event", "begin_checkout", {
      currency: "BRL",
      value: precoCentavos / 100,
      payment_type: "cartao",
      items: [item],
    });
    setCarregandoCartao(true);
    setErroCartao(null);
    const r = await criarPagamentoCartaoApostilaAction(slug);
    if ("erro" in r) {
      setErroCartao(r.erro);
      setCarregandoCartao(false);
      return;
    }
    // Página hospedada pelo AbacatePay; a pessoa volta pra cá depois de pagar.
    window.location.href = r.url;
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
          return criarPagamentoApostilaAction(slug);
        }}
        rotuloBotao={`Pagar ${preco} com PIX`}
        aoAprovar={(pedidoId) => {
          sendGAEvent("event", "purchase", {
            transaction_id: pedidoId,
            currency: "BRL",
            value: precoCentavos / 100,
            items: [item],
          });
          fbqTrack("Purchase", { currency: "BRL", value: precoCentavos / 100 });
          router.refresh();
        }}
      />
      {cartaoAtivo && (
        <button
          onClick={pagarComCartao}
          disabled={carregandoCartao}
          className="w-full rounded-lg border-[1.5px] border-brand px-5 py-3 text-[15px] font-bold text-brand transition-colors hover:bg-brand/5 disabled:opacity-60"
        >
          {carregandoCartao
            ? "Abrindo pagamento..."
            : `Pagar ${preco} no cartão`}
        </button>
      )}
      {erroCartao && (
        <Alert variant="erro" claro>
          {erroCartao}
        </Alert>
      )}
    </div>
  );
}
