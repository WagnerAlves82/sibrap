"use client";

import { useRouter } from "next/navigation";
import { EscolherPagamento } from "@/components/escolher-pagamento";
import type { DadosCartaoCompra } from "@/components/cartao-transparente";
import { criarPagamentoFormacaoAction } from "./actions";
import { fbqFormacao } from "@/components/meta-pixel";

// Compra da formação: PIX com o preço promocional e cartão com o preço cheio (produto próprio).
// Ao aprovar, a página recarrega já com os 3 cursos liberados.
export function ComprarFormacao({
  precoPix,
  valorPixCentavos,
  valorCartaoCentavos,
  cartao = null,
}: {
  precoPix: string;
  valorPixCentavos: number;
  valorCartaoCentavos: number;
  cartao?: DadosCartaoCompra | null;
}) {
  const router = useRouter();
  return (
    <EscolherPagamento
      valorCentavos={valorPixCentavos}
      valorCartaoCentavos={valorCartaoCentavos}
      rotuloComprar={`Garantir minha formação por ${precoPix}`}
      criarPix={() => criarPagamentoFormacaoAction()}
      conversaoAds
      cartao={cartao}
      aoAprovar={(_pedido, forma) => {
        const valor = (forma === "pix" ? valorPixCentavos : valorCartaoCentavos) / 100;
        fbqFormacao("Purchase", { currency: "BRL", value: valor });
        router.refresh();
      }}
    />
  );
}
