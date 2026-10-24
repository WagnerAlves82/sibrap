"use client";

import { useState } from "react";

export function PopupParabens({
  precoOnline,
  precoImpresso,
  permiteCadunico,
}: {
  precoOnline: string;
  precoImpresso: string;
  permiteCadunico: boolean;
}) {
  const [aberto, setAberto] = useState(true);
  if (!aberto) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="popup-parabens-titulo"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B2A4A]/60 p-4"
    >
      <div className="w-full max-w-[420px] rounded-xl bg-white p-6 shadow-[0_30px_60px_-20px_rgba(11,42,74,0.5)]">
        <button
          type="button"
          onClick={() => setAberto(false)}
          aria-label="Fechar"
          className="float-right -mr-1 -mt-1 flex h-8 w-8 items-center justify-center rounded-full text-[#93A0AF] hover:bg-[#F6F9FC] hover:text-[#516278]"
        >
          ✕
        </button>
        <p className="font-data text-xs font-semibold uppercase tracking-wide text-accent-2">
          Parabéns!
        </p>
        <h2 id="popup-parabens-titulo" className="mt-1 font-display text-xl font-extrabold text-[#14213A]">
          Você concluiu todas as aulas e passou na prova
        </h2>
        <p className="mt-2 text-[14.5px] leading-relaxed text-[#516278]">
          As aulas são gratuitas — o certificado, com nome, carga horária e QR Code de validação, custa{" "}
          <strong className="text-[#14213A]">{precoOnline}</strong> na versão online (chega no seu e-mail na
          hora) ou <strong className="text-[#14213A]">{precoImpresso}</strong> na versão impressa, enviada pelos
          Correios.
          {permiteCadunico && " Se você se enquadra no CadÚnico, pode pedir o certificado grátis logo abaixo."}
        </p>
        <button
          type="button"
          onClick={() => setAberto(false)}
          className="mt-5 block w-full rounded-lg bg-accent px-5 py-3 text-center text-[15px] font-bold text-accent-ink transition-colors hover:brightness-105"
        >
          Ver as opções
        </button>
      </div>
    </div>
  );
}
