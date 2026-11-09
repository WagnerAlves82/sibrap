"use client";

import { useRouter } from "next/navigation";
import { EscolherPagamento } from "@/components/escolher-pagamento";
import type { DadosCartaoCompra } from "@/components/cartao-transparente";
import { criarPagamentoExtraAction } from "./actions";

export function CompraExtra({ cartao = null }: { cartao?: DadosCartaoCompra | null }) {
  const router = useRouter();
  return (
    <EscolherPagamento
      valorCentavos={690}
      rotuloComprar="Comprar +5 correções"
      criarPix={() => criarPagamentoExtraAction()}
      conversaoAds
      cartao={cartao}
      aoAprovar={() => router.refresh()}
    />
  );
}
