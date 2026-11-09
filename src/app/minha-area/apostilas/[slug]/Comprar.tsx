"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sendGAEvent } from "@next/third-parties/google";
import { fbqTrack } from "@/components/meta-pixel";
import { gadsCompra } from "@/lib/google-ads";
import { EscolherPagamento } from "@/components/escolher-pagamento";
import type { DadosCartaoCompra } from "@/components/cartao-transparente";
import { formatarPreco } from "@/lib/apostilas";
import { conferirCupomAction, criarPagamentoApostilaAction } from "./actions";

export function ComprarApostila({
  slug,
  titulo,
  preco,
  precoCentavos,
  cartao = null,
  combo = false,
}: {
  slug: string;
  titulo: string;
  preco: string;
  precoCentavos: number;
  /** cartão sem sair do site (null = só PIX) */
  cartao?: DadosCartaoCompra | null;
  combo?: boolean;
}) {
  const router = useRouter();
  const [cupomAberto, setCupomAberto] = useState(false);
  const [codigo, setCodigo] = useState("");
  const [cupom, setCupom] = useState<{ codigo: string; valorCentavos: number; percentual: number } | null>(null);
  const [erroCupom, setErroCupom] = useState("");
  const [conferindo, setConferindo] = useState(false);
  const valor = cupom?.valorCentavos ?? precoCentavos;

  async function aplicarCupom() {
    setConferindo(true);
    setErroCupom("");
    const r = await conferirCupomAction(slug, combo, codigo);
    setConferindo(false);
    if ("erro" in r) {
      setCupom(null);
      setErroCupom(r.erro);
    } else setCupom(r);
  }

  const item = {
    item_id: combo ? `combo-${slug}` : slug,
    item_name: titulo,
    price: valor / 100,
    quantity: 1,
  };

  function aprovado(pedidoId: string, pagamento: "pix" | "cartao") {
    sendGAEvent("event", "purchase", {
      transaction_id: pedidoId,
      currency: "BRL",
      value: valor / 100,
      payment_type: pagamento,
      items: [item],
      ...(cupom ? { coupon: cupom.codigo } : {}),
    });
    fbqTrack("Purchase", { currency: "BRL", value: valor / 100 });
    gadsCompra({ valor: valor / 100, pedidoId });
    router.refresh();
  }

  return (
    <div>
      {cupom ? (
        <p className="mb-2 border border-[#A9D7CC] bg-[#EAF6F2] px-3 py-2 text-[13.5px] text-[#0B5A4D]">
          Cupom <strong className="uppercase">{cupom.codigo}</strong> aplicado: de <s>{preco}</s> por{" "}
          <strong>{formatarPreco(cupom.valorCentavos)}</strong>.{" "}
          <button type="button" onClick={() => setCupom(null)} className="underline">
            Remover
          </button>
        </p>
      ) : cupomAberto ? (
        <div className="mb-2">
          <div className="flex gap-2">
            <input
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && codigo.trim() && void aplicarCupom()}
              placeholder="Digite o cupom"
              maxLength={40}
              autoCapitalize="characters"
              className="min-w-0 flex-1 border border-[#C5CFDA] bg-white px-3 py-2 text-[14px] uppercase text-[#14213A] focus:border-brand focus:outline-none"
            />
            <button
              type="button"
              onClick={() => void aplicarCupom()}
              disabled={conferindo || !codigo.trim()}
              className="bg-brand px-4 text-[13.5px] font-bold text-white disabled:opacity-50"
            >
              {conferindo ? "..." : "Aplicar"}
            </button>
          </div>
          {erroCupom && <p className="mt-1 text-[12.5px] text-[#B42318]">{erroCupom}</p>}
        </div>
      ) : (
        <button type="button" onClick={() => setCupomAberto(true)} className="mb-2 text-[13px] font-bold text-brand underline">
          Tenho um cupom de desconto
        </button>
      )}
      <EscolherPagamento
        key={cupom?.codigo ?? "sem-cupom"}
        valorCentavos={valor}
        rotuloComprar={`Comprar por ${formatarPreco(valor)}`}
        criarPix={() => {
          sendGAEvent("event", "begin_checkout", {
            currency: "BRL",
            value: valor / 100,
            payment_type: "pix",
            items: [item],
          });
          fbqTrack("InitiateCheckout", { currency: "BRL", value: valor / 100 });
          return criarPagamentoApostilaAction(slug, combo, cupom?.codigo);
        }}
        cartao={cartao ? { ...cartao, cupom: cupom?.codigo } : cartao}
        aoAprovar={aprovado}
      />
    </div>
  );
}
