"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

// O código oficial do Pixel da Meta fica no <head> (layout.tsx), com o consentimento
// em "revoke" até a pessoa aceitar os cookies; aqui só liberamos ("grant") ao aceitar
// e enviamos o PageView das navegações seguintes.
type JanelaFbq = Window & { fbq?: (...args: unknown[]) => void };

/** Dispara um evento do pixel (a Meta retém até haver consentimento). */
export function fbqTrack(evento: string, params?: Record<string, unknown>) {
  const f = (window as JanelaFbq).fbq;
  if (f) f("track", evento, params);
}

export function MetaPixel() {
  const pathname = usePathname();
  const primeira = useRef(true);

  useEffect(() => {
    const aoAceitar = () => (window as JanelaFbq).fbq?.("consent", "grant");
    window.addEventListener("sibrap:cookies-aceitos", aoAceitar);
    return () => window.removeEventListener("sibrap:cookies-aceitos", aoAceitar);
  }, []);

  // PageView nas navegações seguintes (a primeira já sai no snippet do head)
  useEffect(() => {
    if (primeira.current) {
      primeira.current = false;
      return;
    }
    fbqTrack("PageView");
  }, [pathname]);

  return null;
}
