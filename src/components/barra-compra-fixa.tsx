"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

// Barra de compra fixa no rodapé da tela das páginas de curso (celular e computador).
// Aparece depois que a pessoa rola além do topo. O botão do WhatsApp sobe nessas
// páginas (src/components/botao-whatsapp.tsx) para não ficar em cima dela.
export function BarraCompraFixa({
  preco,
  detalhe,
  href,
  rotulo,
  aPartirDe = 420,
}: {
  preco: string;
  detalhe?: string;
  href: string;
  rotulo: string;
  /** rolagem (px) a partir da qual a barra aparece */
  aPartirDe?: number;
}) {
  const [visivel, setVisivel] = useState(false);
  useEffect(() => {
    const ver = () => setVisivel(window.scrollY > aPartirDe);
    ver();
    window.addEventListener("scroll", ver, { passive: true });
    return () => window.removeEventListener("scroll", ver);
  }, [aPartirDe]);

  return (
    <div
      aria-hidden={!visivel}
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-[#D7DEE6] bg-white/95 px-4 pb-[max(0.6rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-10px_28px_-14px_rgba(11,42,74,0.35)] backdrop-blur transition-transform duration-300 ${
        visivel ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="mx-auto flex max-w-[860px] items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-[1.25rem] font-extrabold leading-none text-[#14213A] sm:text-[1.5rem]">{preco}</p>
          {detalhe && <p className="mt-1 truncate text-[12px] text-[#516278] sm:text-[13.5px]">{detalhe}</p>}
        </div>
        <Link
          href={href}
          prefetch={false}
          tabIndex={visivel ? 0 : -1}
          className="btn-pulso-suave brilho shrink-0 whitespace-nowrap bg-accent px-4 py-3 text-[14px] font-extrabold text-accent-ink sm:px-7 sm:text-[16px]"
        >
          {rotulo}
        </Link>
      </div>
    </div>
  );
}
