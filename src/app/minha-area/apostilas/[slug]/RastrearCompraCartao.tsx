"use client";

import { useEffect, useRef } from "react";
import { sendGAEvent } from "@next/third-parties/google";

// Dispara o evento de conversão "purchase" (GA4) para quem acabou de voltar
// do checkout hospedado (cartão) do AbacatePay. O PIX dispara na hora, no
// cliente (`PixCheckoutClaro`); o cartão redireciona pra fora e volta numa
// página nova, então esse disparo só é seguro no servidor (ver page.tsx:
// só passa `pedidoId` na própria renderização em que a compra foi
// confirmada — atualizações seguintes já têm `acesso` e pulam o bloco).
export function RastrearCompraCartao({
  pedidoId,
  slug,
  titulo,
  precoCentavos,
}: {
  pedidoId: string;
  slug: string;
  titulo: string;
  precoCentavos: number;
}) {
  const jaDisparou = useRef(false);

  useEffect(() => {
    if (jaDisparou.current) return;
    jaDisparou.current = true;
    sendGAEvent("event", "purchase", {
      transaction_id: pedidoId,
      currency: "BRL",
      value: precoCentavos / 100,
      payment_type: "cartao",
      items: [{ item_id: slug, item_name: titulo, price: precoCentavos / 100, quantity: 1 }],
    });
  }, [pedidoId, slug, titulo, precoCentavos]);

  return null;
}
