"use client";

import { useRouter } from "next/navigation";
import { EscolherPagamento } from "@/components/escolher-pagamento";
import type { DadosCartaoCompra } from "@/components/cartao-transparente";
import { criarPagamentoFormacaoPortariaAction } from "./actions";
import { fbqTrack } from "@/components/meta-pixel";

// Compra da formação de portaria: PIX ou cartão pelo mesmo produto. Ao aprovar, recarrega com os cursos liberados.
export function ComprarFormacaoPortaria({
  preco,
  valorCentavos,
  cartao = null,
}: {
  preco: string;
  valorCentavos: number;
  cartao?: DadosCartaoCompra | null;
}) {
  const router = useRouter();
  return (
    <EscolherPagamento
      valorCentavos={valorCentavos}
      valorCartaoCentavos={valorCentavos}
      rotuloComprar={`Garantir minha formação por ${preco}`}
      criarPix={() => criarPagamentoFormacaoPortariaAction()}
      conversaoAds
      cartao={cartao}
      aoAprovar={() => {
        fbqTrack("Purchase", { currency: "BRL", value: valorCentavos / 100, content_name: "formacao-portaria" });
        router.refresh();
      }}
    />
  );
}
