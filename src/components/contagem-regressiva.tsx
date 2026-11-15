"use client";

import { useEffect, useState } from "react";

// Contador até um instante fixo (ISO com fuso, ex.: "2026-12-31T23:59:59-03:00").
// Renderiza vazio no servidor (página em cache) e começa a contar no navegador.
export function ContagemRegressiva({
  ate,
  className,
}: {
  ate: string;
  className?: string;
}) {
  const [resta, setResta] = useState<number | null>(null);
  useEffect(() => {
    const fim = new Date(ate).getTime();
    const tick = () => setResta(Math.max(0, fim - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [ate]);

  const partes =
    resta === null
      ? ["--", "--", "--", "--"]
      : [
          Math.floor(resta / 86400000),
          Math.floor((resta / 3600000) % 24),
          Math.floor((resta / 60000) % 60),
          Math.floor((resta / 1000) % 60),
        ].map((n) => String(n).padStart(2, "0"));
  const rotulos = ["dias", "horas", "min", "seg"];

  return (
    <div
      className={`flex gap-2 ${className ?? ""}`}
      role="timer"
      aria-label="Tempo restante da promoção"
    >
      {partes.map((v, i) => (
        <div
          key={rotulos[i]}
          className="min-w-[64px] bg-[#0B2A4A] px-3 py-2 text-center text-white"
        >
          <div className="font-display text-2xl font-extrabold tabular-nums leading-none sm:text-3xl">
            {v}
          </div>
          <div className="mt-1 font-data text-[11px] uppercase tracking-wider text-[#C9D6E5]">
            {rotulos[i]}
          </div>
        </div>
      ))}
    </div>
  );
}
