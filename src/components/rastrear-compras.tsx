"use client";

import { useEffect } from "react";
import { sendGAEvent } from "@next/third-parties/google";
import { compraJaRegistrada, gadsCompra } from "@/lib/google-ads";

export type CompraRecente = { pedidoId: string; valorCentavos: number; itemId: string; itemNome: string };

// Rede de segurança da conversão: quem paga o PIX no app do banco e só
// volta depois (ou entra pelo e-mail de entrega) não está mais na tela do
// PIX quando o pagamento cai, e a conversão nunca saía. Aqui, ao abrir a
// área do aluno, as compras aprovadas recentes que este navegador ainda
// não registrou vão para o GA4 e o Google Ads (ambos com transaction_id).
export function RastrearCompras({ compras }: { compras: CompraRecente[] }) {
  useEffect(() => {
    for (const c of compras) {
      if (compraJaRegistrada(c.pedidoId)) continue;
      const valor = c.valorCentavos / 100;
      sendGAEvent("event", "purchase", {
        transaction_id: c.pedidoId,
        currency: "BRL",
        value: valor,
        items: [{ item_id: c.itemId, item_name: c.itemNome, price: valor, quantity: 1 }],
      });
      gadsCompra({ valor, pedidoId: c.pedidoId });
    }
  }, [compras]);

  return null;
}
