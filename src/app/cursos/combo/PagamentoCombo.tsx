"use client";

import { useRouter } from "next/navigation";
import { PixCheckoutClaro } from "@/components/pix-checkout-claro";
import { PagamentoCartao, type DadosCartaoCompra } from "@/components/cartao-transparente";
import { criarPagamentoComboAction } from "./actions";

export function PagamentoCombo({ valorCentavos, cartao = null }: { valorCentavos: number; cartao?: DadosCartaoCompra | null }) {
  const router = useRouter();
  return (
    <div className="flex flex-col gap-3">
      <PixCheckoutClaro
        rotuloBotao="Pagar com PIX"
        criarPix={() => criarPagamentoComboAction()}
        aoAprovar={() => router.refresh()}
        conversaoAds
      />
      <PagamentoCartao cartao={cartao} valorCentavos={valorCentavos} />
    </div>
  );
}
