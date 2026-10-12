"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

// Pixel da Meta (Facebook/Instagram). O código oficial carrega sempre, mas com o
// consentimento da Meta em "revoke": nada é enviado até a pessoa aceitar os cookies
// no aviso (chave "sibrap_cookies" no localStorage); aí vira "grant".
const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "733506279098670";
const CHAVE = "sibrap_cookies";

type Fbq = ((...args: unknown[]) => void) & {
  queue: unknown[];
  loaded: boolean;
  version: string;
  push: unknown;
  callMethod?: (...args: unknown[]) => void;
};
type JanelaFbq = Window & { fbq?: Fbq; _fbq?: Fbq };

function carregar() {
  const w = window as JanelaFbq;
  if (w.fbq) return;
  // Mesmo "stub" do snippet oficial da Meta: o fbevents.js só assume a fila
  // quando encontra push/version/queue/loaded exatamente assim.
  const n = function () {
    /* eslint-disable prefer-rest-params, prefer-spread */
    if (n.callMethod) n.callMethod.apply(n, arguments as unknown as unknown[]);
    else n.queue.push(arguments);
    /* eslint-enable prefer-rest-params, prefer-spread */
  } as Fbq;
  n.push = n;
  n.loaded = true;
  n.version = "2.0";
  n.queue = [];
  w.fbq = n;
  w._fbq = n;
  const s = document.createElement("script");
  s.async = true;
  s.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(s);
  if (!aceito()) n("consent", "revoke");
  n("init", PIXEL_ID);
  n("track", "PageView");
}

function liberar() {
  const f = (window as JanelaFbq).fbq;
  if (f) f("consent", "grant");
}

function aceito(): boolean {
  try {
    return localStorage.getItem(CHAVE) === "aceito";
  } catch {
    return false;
  }
}

/** Dispara um evento do pixel (fica retido pela Meta até haver consentimento). */
export function fbqTrack(evento: string, params?: Record<string, unknown>) {
  const f = (window as JanelaFbq).fbq;
  if (f) f("track", evento, params);
}

export function MetaPixel() {
  const pathname = usePathname();
  const primeira = useRef(true);

  useEffect(() => {
    carregar();
    const aoAceitar = () => liberar();
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
