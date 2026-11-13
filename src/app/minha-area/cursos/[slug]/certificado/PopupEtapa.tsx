"use client";

// Pop-up de etapa liberada (certificado por etapas): aparece uma vez por etapa (guardado no navegador).
// "Emitir agora" leva às opções de pagamento/emissão; "Continuar" convida a seguir até a próxima carga.
import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

const assinar = (cb: () => void) => {
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
};
const jaVisto = (id: string) => {
  try {
    return localStorage.getItem(id) === "1";
  } catch {
    return false;
  }
};

export function PopupEtapa({
  horas,
  proxima,
  cursoHref,
  chave,
  emitirHref = "#certificado-opcoes",
}: {
  horas: number;
  proxima: number | null;
  cursoHref: string;
  chave: string;
  emitirHref?: string;
}) {
  const id = `sibrap-etapa-${chave}`;
  // no servidor conta como "já visto" (não renderiza); no navegador lê o que foi guardado
  const visto = useSyncExternalStore(assinar, () => jaVisto(id), () => true);
  const [fechado, setFechado] = useState(false);

  const fechar = () => {
    try {
      localStorage.setItem(id, "1");
    } catch {
      // navegador sem armazenamento: só fecha
    }
    setFechado(true);
  };

  if (visto || fechado) return null;

  // portal no <body>: um ancestral com animação (transform) prenderia o "fixed" dentro dele
  return createPortal(
    <div role="dialog" aria-modal="true" aria-labelledby="popup-etapa-titulo" className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B2A4A]/70 p-4">
      <div className="relative w-full max-w-[440px] border-t-4 border-accent bg-white p-6 text-center shadow-[0_30px_60px_-20px_rgba(11,42,74,0.6)]">
        <button
          type="button"
          onClick={fechar}
          aria-label="Fechar"
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center text-[#93A0AF] hover:text-[#516278]"
        >
          ✕
        </button>
        <div aria-hidden className="relative mx-auto mt-2 h-20 w-20">
          <span className="absolute inset-0 animate-ping bg-[radial-gradient(circle,rgba(185,134,42,0.45),transparent_65%)] motion-reduce:animate-none" />
          <span className="relative flex h-20 w-20 items-center justify-center text-[64px] leading-none drop-shadow-[0_0_14px_rgba(185,134,42,0.9)] motion-safe:animate-[pulse_1.6s_ease-in-out_infinite]">
            ⭐
          </span>
        </div>
        <p className="mt-3 font-data text-xs font-semibold uppercase tracking-wide text-accent-2">Etapa concluída!</p>
        <h2 id="popup-etapa-titulo" className="mt-1 font-display text-2xl font-extrabold text-[#14213A]">
          Seu certificado de {horas} horas está liberado
        </h2>
        <p className="mt-2 text-[15px] leading-relaxed text-[#516278]">
          Você já pode emitir o certificado de <strong className="text-[#14213A]">{horas} horas</strong>, com QR Code de
          validação. É só pagar a taxa e emitir na hora.
        </p>
        <a
          href={emitirHref}
          onClick={fechar}
          className="mt-5 block w-full bg-accent px-5 py-3 text-center text-[16px] font-bold text-accent-ink transition-colors hover:brightness-105"
        >
          Emitir meu certificado de {horas} horas →
        </a>
        {proxima && (
          <div className="mt-4 border-t border-[#EEF2F6] pt-4">
            <p className="text-[14.5px] text-[#516278]">
              Quer o certificado de <strong className="text-[#14213A]">{proxima} horas</strong>? Continue a sua jornada:
              ele libera na próxima etapa.
            </p>
            <Link
              prefetch={false}
              href={cursoHref}
              onClick={fechar}
              className="mt-3 inline-block border border-brand px-5 py-2.5 text-[15px] font-bold text-brand hover:bg-[#F6F9FC]"
            >
              Continuar estudando
            </Link>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
