"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

// O código oficial do Pixel da Meta fica no <head> (layout.tsx), com o consentimento
// em "revoke" até a pessoa aceitar os cookies; aqui só liberamos ("grant") ao aceitar
// e enviamos o PageView das navegações seguintes.
type JanelaFbq = Window & { fbq?: (...args: unknown[]) => void; __pixelFormacao?: boolean };

// Pixel do site inteiro (iniciado no <head>) e pixel só da Formação Inicial para Eletricista
// (conjunto de dados "eletric" do portfólio sibrap): este só recebe eventos da página da formação
// e da compra dela. Por isso todo evento usa trackSingle, nunca "track" (que iria para os dois).
export const PIXEL_SITE = "733506279098670";
export const PIXEL_FORMACAO = "30037871909147615";

/** Dispara um evento no pixel do site (a Meta retém até haver consentimento). */
export function fbqTrack(evento: string, params?: Record<string, unknown>) {
  const f = (window as JanelaFbq).fbq;
  if (f) f("trackSingle", PIXEL_SITE, evento, params);
}

/** Dispara um evento só no pixel da formação (inicia o pixel na primeira vez). */
export function fbqFormacao(evento: string, params?: Record<string, unknown>) {
  const w = window as JanelaFbq;
  const f = w.fbq;
  if (!f) return;
  if (!w.__pixelFormacao) {
    f("set", "autoConfig", false, PIXEL_FORMACAO);
    f("init", PIXEL_FORMACAO);
    w.__pixelFormacao = true;
  }
  f("trackSingle", PIXEL_FORMACAO, evento, params);
}

/** PageView no pixel da formação; usar só nas páginas da formação. */
export function PixelFormacao() {
  useEffect(() => {
    fbqFormacao("PageView");
  }, []);
  return null;
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
