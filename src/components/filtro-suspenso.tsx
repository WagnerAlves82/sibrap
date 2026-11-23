"use client";

import { useEffect, useId, useRef, useState } from "react";

export type OpcaoFiltro = { valor: string; rotulo: string; qtd?: number };

// Botão compacto que abre uma lista de opções ("Cursos por área ▾"), no lugar da parede de
// botões de filtro (Wagner, 23/11/2026: "mais clean e menos blocado"). Fecha ao escolher,
// ao tocar fora ou com Esc.
export function FiltroSuspenso({
  rotulo,
  opcoes,
  valor,
  aoEscolher,
}: {
  rotulo: string;
  opcoes: OpcaoFiltro[];
  valor: string;
  aoEscolher: (valor: string) => void;
}) {
  const [aberto, setAberto] = useState(false);
  const caixa = useRef<HTMLDivElement>(null);
  const id = useId();
  const atual = opcoes.find((o) => o.valor === valor);
  const filtrando = !!atual && atual.valor !== opcoes[0]?.valor;

  useEffect(() => {
    if (!aberto) return;
    const fora = (e: MouseEvent | TouchEvent) => {
      if (caixa.current && !caixa.current.contains(e.target as Node)) setAberto(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setAberto(false);
    document.addEventListener("mousedown", fora);
    document.addEventListener("touchstart", fora);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", fora);
      document.removeEventListener("touchstart", fora);
      document.removeEventListener("keydown", esc);
    };
  }, [aberto]);

  return (
    <div ref={caixa} className="relative">
      <button
        type="button"
        onClick={() => setAberto((a) => !a)}
        aria-expanded={aberto}
        aria-controls={id}
        className={`inline-flex min-h-[40px] items-center gap-2 rounded-md border px-3.5 py-2 text-[13.5px] font-semibold transition-colors ${
          filtrando ? "border-brand bg-brand text-white" : "border-[#D7DEE6] bg-white text-[#14213A] hover:border-brand"
        }`}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M4 6h16M7 12h10M10 18h4" />
        </svg>
        {filtrando ? atual!.rotulo : rotulo}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true" className={`transition-transform ${aberto ? "rotate-180" : ""}`}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {aberto && (
        <ul
          id={id}
          className="absolute left-0 top-full z-30 mt-1 max-h-[60vh] rounded-md w-[min(300px,calc(100vw-32px))] overflow-y-auto border border-[#D7DEE6] bg-white py-1 shadow-[0_20px_45px_-24px_rgba(11,42,74,0.45)]"
        >
          {opcoes.map((o) => {
            const marcado = o.valor === valor;
            return (
              <li key={o.valor}>
                <button
                  type="button"
                  onClick={() => {
                    aoEscolher(o.valor);
                    setAberto(false);
                  }}
                  aria-pressed={marcado}
                  className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-[14px] ${
                    marcado ? "bg-[#E7EEF4] font-bold text-brand" : "text-[#14213A] hover:bg-[#F6F9FC]"
                  }`}
                >
                  {o.rotulo}
                  {o.qtd !== undefined && <span className="font-data text-[12px] font-semibold text-[#516278]">{o.qtd}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
