"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PixCheckoutClaro } from "@/components/pix-checkout-claro";
import { Alert } from "@/components/alert";
import { criarPagamentoApostilaAction, criarPagamentoCartaoApostilaAction } from "./actions";

export function ComprarApostila({ slug, preco }: { slug: string; preco: string }) {
  const router = useRouter();
  const [carregandoCartao, setCarregandoCartao] = useState(false);
  const [erroCartao, setErroCartao] = useState<string | null>(null);

  async function pagarComCartao() {
    setCarregandoCartao(true);
    setErroCartao(null);
    const r = await criarPagamentoCartaoApostilaAction(slug);
    if ("erro" in r) {
      setErroCartao(r.erro);
      setCarregandoCartao(false);
      return;
    }
    // Página hospedada pelo AbacatePay; a pessoa volta pra cá depois de pagar.
    window.location.href = r.url;
  }

  return (
    <div className="flex flex-col gap-3">
      <PixCheckoutClaro
        criarPix={() => criarPagamentoApostilaAction(slug)}
        rotuloBotao={`Pagar ${preco} com PIX`}
        aoAprovar={() => router.refresh()}
      />
      <button
        onClick={pagarComCartao}
        disabled={carregandoCartao}
        className="w-full rounded-lg border-[1.5px] border-brand px-5 py-3 text-[15px] font-bold text-brand transition-colors hover:bg-brand/5 disabled:opacity-60"
      >
        {carregandoCartao ? "Abrindo pagamento..." : `Pagar ${preco} no cartão`}
      </button>
      {erroCartao && (
        <Alert variant="erro" claro>
          {erroCartao}
        </Alert>
      )}
    </div>
  );
}
