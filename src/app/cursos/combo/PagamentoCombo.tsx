"use client";

import { useRouter } from "next/navigation";
import { PixCheckoutClaro } from "@/components/pix-checkout-claro";
import { criarPagamentoComboAction } from "./actions";

export function PagamentoCombo() {
  const router = useRouter();
  return (
    <PixCheckoutClaro
      rotuloBotao="Pagar com PIX"
      criarPix={() => criarPagamentoComboAction()}
      aoAprovar={() => router.refresh()}
      conversaoAds
    />
  );
}
