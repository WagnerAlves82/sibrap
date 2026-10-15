"use client";

import { useEffect } from "react";

// Guarda de onde a pessoa chegou (campanha, gclid do Google, fbclid do Facebook,
// referenciador e página de entrada) em um cookie próprio, para o servidor
// registrar a origem de cada venda. Quando a URL traz marcação de campanha, ela
// substitui a anterior; sem marcação, só grava se ainda não houver origem.
const COOKIE = "sibrap_origem";
const MARCAS = ["gclid", "fbclid", "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];

export function CapturarOrigem() {
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const dados: Record<string, string> = {};
      for (const m of MARCAS) {
        const v = url.searchParams.get(m);
        if (v) dados[m] = v.slice(0, 150);
      }
      const temMarca = Object.keys(dados).length > 0;
      const existe = document.cookie.split("; ").some((c) => c.startsWith(COOKIE + "="));
      if (!temMarca && existe) return;

      let ref = "";
      try {
        const r = document.referrer ? new URL(document.referrer) : null;
        if (r && r.hostname !== window.location.hostname) ref = r.hostname.replace(/^www\./, "");
      } catch {
        // referrer inválido
      }
      if (ref) dados.referrer = ref;
      dados.pagina = url.pathname.slice(0, 80);

      const valor = encodeURIComponent(JSON.stringify(dados));
      if (valor.length > 1500) return;
      document.cookie = `${COOKIE}=${valor}; max-age=${60 * 24 * 3600}; path=/; SameSite=Lax; Secure`;
    } catch {
      // sem acesso a cookies: segue sem origem
    }
  }, []);

  return null;
}
