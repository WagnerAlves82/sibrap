"use client";

import { useRouter } from "next/navigation";
import { EscolherPagamento } from "@/components/escolher-pagamento";
import { criarPagamentoPacoteAdmAction } from "./actions";

// Compra do Pacote Administrativo (só PIX). Ao aprovar, a página recarrega com os cursos liberados.
export function ComprarPacote({ preco, valorCentavos }: { preco: string; valorCentavos: number }) {
  const router = useRouter();
  return (
    <EscolherPagamento
      valorCentavos={valorCentavos}
      valorCartaoCentavos={valorCentavos}
      rotuloComprar={`Garantir meu pacote por ${preco}`}
      criarPix={() => criarPagamentoPacoteAdmAction()}
      conversaoAds
      cartao={null}
      aoAprovar={() => router.refresh()}
    />
  );
}
