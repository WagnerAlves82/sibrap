"use client";

import { useRouter } from "next/navigation";
import { EscolherPagamento } from "@/components/escolher-pagamento";
import type { DadosCartaoCompra } from "@/components/cartao-transparente";
import { criarPagamentoComboAction } from "./actions";

export function PagamentoCombo({ valorCentavos, cartao = null }: { valorCentavos: number; cartao?: DadosCartaoCompra | null }) {
  const router = useRouter();
  return (
    <EscolherPagamento
      valorCentavos={valorCentavos}
      rotuloComprar="Comprar o combo"
      criarPix={() => criarPagamentoComboAction()}
      conversaoAds
      cartao={cartao}
      aoAprovar={() => router.refresh()}
    />
  );
}
