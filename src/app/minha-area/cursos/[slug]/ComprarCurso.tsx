"use client";

import { useRouter } from "next/navigation";
import { PixCheckoutClaro } from "@/components/pix-checkout-claro";
import { criarPagamentoCursoAction } from "./actions";

// Compra do curso pago por PIX; ao aprovar, o banco matricula o aluno e a página recarrega já com as aulas.
export function ComprarCurso({ slug, preco }: { slug: string; preco: string }) {
  const router = useRouter();
  return (
    <PixCheckoutClaro
      rotuloBotao={`Pagar ${preco} com PIX`}
      criarPix={() => criarPagamentoCursoAction(slug)}
      aoAprovar={() => router.refresh()}
      conversaoAds
    />
  );
}
