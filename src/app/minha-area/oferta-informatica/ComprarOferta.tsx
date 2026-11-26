"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EscolherPagamento } from "@/components/escolher-pagamento";
import type { DadosCartaoCompra } from "@/components/cartao-transparente";
import { criarPagamentoOfertaInformaticaAction } from "./actions";

export type CursoOferta = { slug: string; nome: string; horas: number; categoria: string; precoSeparadoCentavos: number };

const reais = (c: number) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// Escolha do segundo curso e pagamento (PIX ou cartão) do produto daquela escolha.
export function ComprarOfertaInformatica({
  cursos,
  valorCentavos,
  precoInformaticaCentavos,
  cartoes,
}: {
  cursos: CursoOferta[];
  valorCentavos: number;
  precoInformaticaCentavos: number;
  cartoes: Record<string, DadosCartaoCompra | null>;
}) {
  const router = useRouter();
  const [escolhido, setEscolhido] = useState<string>("");
  const curso = cursos.find((c) => c.slug === escolhido);
  const categorias = [...new Set(cursos.map((c) => c.categoria))];

  return (
    <div>
      <label htmlFor="segundo-curso" className="block text-[14px] font-bold text-[#14213A]">
        Escolha o seu segundo curso
      </label>
      <select
        id="segundo-curso"
        value={escolhido}
        onChange={(e) => setEscolhido(e.target.value)}
        className="mt-2 w-full border border-[#C4CEDA] bg-white px-3 py-3 text-[15.5px] text-[#14213A]"
      >
        <option value="">Toque para escolher…</option>
        {categorias.map((cat) => (
          <optgroup key={cat} label={cat}>
            {cursos
              .filter((c) => c.categoria === cat)
              .map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.nome} ({c.horas} h)
                </option>
              ))}
          </optgroup>
        ))}
      </select>

      {curso && (
        <div className="mt-5">
          <div className="border-l-4 border-accent bg-[#FBF5E8] px-4 py-3 text-[14.5px] text-[#14213A]">
            Informática Básica com IA (60 h) + {curso.nome} ({curso.horas} h)
            <br />
            Separados: <span className="text-[#93A0AF] line-through">{reais(precoInformaticaCentavos + curso.precoSeparadoCentavos)}</span>{" "}
            · Na oferta: <strong>{reais(valorCentavos)}</strong>
          </div>
          <div className="mt-5">
            <EscolherPagamento
              key={curso.slug}
              valorCentavos={valorCentavos}
              valorCartaoCentavos={valorCentavos}
              rotuloComprar={`Garantir os 2 certificados por ${reais(valorCentavos)}`}
              criarPix={() => criarPagamentoOfertaInformaticaAction(curso.slug)}
              conversaoAds
              cartao={cartoes[curso.slug] ?? null}
              aoAprovar={() => router.refresh()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
