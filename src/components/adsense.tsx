"use client";

// Script e blocos do Google AdSense. Só aparecem quando a página passa o cliente (ca-pub-...),
// ou seja, depois que ADSENSE_PUB_ID existir na Vercel (ver src/lib/adsense.ts).

import Script from "next/script";
import { useEffect, useRef } from "react";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export function ScriptAdsense({ cliente }: { cliente: string | null }) {
  if (!cliente) return null;
  return (
    <Script
      id="adsense"
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${cliente}`}
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  );
}

// Bloco responsivo com o rótulo "Publicidade" (exigido para não confundir com o conteúdo).
// Se o Google não tiver anúncio para mostrar, o bloco some (CSS .bloco-anuncio em globals.css).
export function BlocoAnuncio({ cliente, slot, className = "" }: { cliente: string | null; slot: string | null; className?: string }) {
  const ref = useRef<HTMLModElement>(null);

  useEffect(() => {
    if (!cliente || !slot || !ref.current || ref.current.dataset.adsbygoogleStatus) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // bloqueador de anúncios ou script ainda carregando: a página segue normal
    }
  }, [cliente, slot]);

  if (!cliente || !slot) return null;
  return (
    <div className={`bloco-anuncio my-8 ${className}`}>
      <p className="mb-1 text-center font-data text-[10.5px] uppercase tracking-wider text-[#93A0AF]">Publicidade</p>
      <ins
        ref={ref}
        className="adsbygoogle block min-h-[100px]"
        data-ad-client={cliente}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
