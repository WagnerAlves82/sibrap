"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

// Pixel da Meta (Facebook/Instagram). Só carrega depois que a pessoa aceita os
// cookies de publicidade no aviso (chave "sibrap_cookies" no localStorage).
const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "733506279098670";
const CHAVE = "sibrap_cookies";

type Fbq = ((...args: unknown[]) => void) & { queue?: unknown[]; loaded?: boolean };
type JanelaFbq = Window & { fbq?: Fbq; _fbq?: Fbq };

function carregar() {
  const w = window as JanelaFbq;
  if (w.fbq) return;
  const n: Fbq = function (...args: unknown[]) {
    (n.queue ??= []).push(args);
  };
  w.fbq = n;
  w._fbq = n;
  n.loaded = true;
  const s = document.createElement("script");
  s.async = true;
  s.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(s);
  n("init", PIXEL_ID);
  n("track", "PageView");
}

function aceito(): boolean {
  try {
    return localStorage.getItem(CHAVE) === "aceito";
  } catch {
    return false;
  }
}

/** Dispara um evento do pixel; não faz nada se o pixel não foi carregado (sem consentimento). */
export function fbqTrack(evento: string, params?: Record<string, unknown>) {
  const f = (window as JanelaFbq).fbq;
  if (f) f("track", evento, params);
}

export function MetaPixel() {
  const pathname = usePathname();
  const primeira = useRef(true);

  useEffect(() => {
    if (aceito()) carregar();
    const aoAceitar = () => carregar();
    window.addEventListener("sibrap:cookies-aceitos", aoAceitar);
    return () => window.removeEventListener("sibrap:cookies-aceitos", aoAceitar);
  }, []);

  // PageView nas navegações seguintes (a primeira já sai no carregamento do pixel)
  useEffect(() => {
    if (primeira.current) {
      primeira.current = false;
      return;
    }
    fbqTrack("PageView");
  }, [pathname]);

  return null;
}
