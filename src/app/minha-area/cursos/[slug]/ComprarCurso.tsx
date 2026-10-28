"use client";

import { useRouter } from "next/navigation";
import { EscolherPagamento } from "@/components/escolher-pagamento";
import type { DadosCartaoCompra } from "@/components/cartao-transparente";
import { criarPagamentoCursoAction } from "./actions";

// Compra do curso pago por PIX; ao aprovar, o banco matricula o aluno e a página recarrega já com as aulas.
export function ComprarCurso({
  slug,
  preco,
  valorCentavos,
  cartao = null,
}: {
  slug: string;
  preco: string;
  valorCentavos: number;
  cartao?: DadosCartaoCompra | null;
}) {
  const router = useRouter();
  return (
    <EscolherPagamento
      valorCentavos={valorCentavos}
      rotuloComprar={`Comprar o curso por ${preco}`}
      criarPix={() => criarPagamentoCursoAction(slug)}
      conversaoAds
      cartao={cartao}
      aoAprovar={() => router.refresh()}
    />
  );
}
