"use client";

import { useRouter } from "next/navigation";
import { PixCheckoutClaro } from "@/components/pix-checkout-claro";
import { criarPagamentoApostilaAction } from "./actions";

export function ComprarApostila({ slug, preco }: { slug: string; preco: string }) {
  const router = useRouter();
  return (
    <PixCheckoutClaro
      criarPix={() => criarPagamentoApostilaAction(slug)}
      rotuloBotao={`Pagar ${preco} com PIX`}
      aoAprovar={() => router.refresh()}
    />
  );
}
