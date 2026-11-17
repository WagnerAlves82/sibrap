"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EscolherPagamento } from "@/components/escolher-pagamento";
import type { DadosCartaoCompra } from "@/components/cartao-transparente";
import { criarPagamentoSuporteAction } from "./actions";

// O pagamento só aparece depois do aceite dos termos.
export function ComprarSuporte({ valorCentavos, preco, cartao = null }: { valorCentavos: number; preco: string; cartao?: DadosCartaoCompra | null }) {
  const router = useRouter();
  const [aceite, setAceite] = useState(false);
  return (
    <div>
      <label className="flex cursor-pointer items-start gap-3 border border-[#D7DEE6] bg-[#F6F8FB] p-4 text-[14.5px] text-[#33465E]">
        <input type="checkbox" checked={aceite} onChange={(e) => setAceite(e.target.checked)} className="mt-1 h-4 w-4 shrink-0 accent-[#0B5FA5]" />
        <span>Li e aceito os termos do Suporte Especializado, inclusive o atendimento por acesso remoto (AnyDesk) com a minha presença.</span>
      </label>
      {aceite && (
        <div className="mt-5">
          <EscolherPagamento
            valorCentavos={valorCentavos}
            rotuloComprar={`Contratar o suporte por ${preco}`}
            criarPix={() => criarPagamentoSuporteAction(true)}
            conversaoAds
            cartao={cartao}
            aoAprovar={() => router.refresh()}
          />
        </div>
      )}
    </div>
  );
}
