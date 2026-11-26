"use client";

import { useState } from "react";
import { CartaoTransparente, type DadosCartaoCompra } from "@/components/cartao-transparente";

export function PagarTeste({ cartao }: { cartao: DadosCartaoCompra }) {
  const [pedido, setPedido] = useState<string | null>(null);
  if (pedido) return <p className="text-[15px] font-bold text-[#067647]">Aprovado! Pedido {pedido.slice(0, 8)}. Pode estornar no painel do AbacatePay.</p>;
  return (
    <CartaoTransparente
      produtoSlug={cartao.produtoSlug}
      valorCentavos={100}
      chavePublica={cartao.chavePublica}
      emailCliente={cartao.email}
      nomeInicial={cartao.nome}
      abertoInicial
      aoAprovar={(id) => setPedido(id)}
    />
  );
}
