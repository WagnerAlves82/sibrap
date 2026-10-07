"use client";

import { useEffect, useState } from "react";

const CHAVE = "sibrap_cookies";

type Gtag = (...args: unknown[]) => void;

function atualizarConsentimento(aceito: boolean) {
  const gtag = (window as unknown as { gtag?: Gtag }).gtag;
  const valor = aceito ? "granted" : "denied";
  gtag?.("consent", "update", {
    ad_storage: valor,
    ad_user_data: valor,
    ad_personalization: valor,
    analytics_storage: valor,
  });
}

function gravar(valor: "aceito" | "recusado") {
  try {
    localStorage.setItem(CHAVE, valor);
  } catch {
    // navegador sem localStorage: a escolha vale só para esta visita
  }
}

export function AvisoCookies() {
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    let salvo: string | null = null;
    try {
      salvo = localStorage.getItem(CHAVE);
    } catch {
      salvo = null;
    }
    const reabrir = () => setVisivel(true);
    const inicial = setTimeout(() => {
      if (salvo === null) reabrir();
    }, 0);
    window.addEventListener("sibrap:cookies", reabrir);
    return () => {
      clearTimeout(inicial);
      window.removeEventListener("sibrap:cookies", reabrir);
    };
  }, []);

  if (!visivel) return null;

  function escolher(aceito: boolean) {
    gravar(aceito ? "aceito" : "recusado");
    atualizarConsentimento(aceito);
    setVisivel(false);
  }

  return (
    <div
      role="dialog"
      aria-label="Aviso de cookies"
      className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-[720px] rounded-xl border border-[#D7DEE6] bg-white p-4 shadow-xl sm:p-5"
    >
      <p className="text-[13.5px] leading-relaxed text-[#3A4A63]">
        Usamos cookies essenciais para o site funcionar e, com a sua permissão, cookies de medição de acessos e de
        publicidade (Google). Veja a{" "}
        <a href="/privacidade" className="font-semibold text-brand underline underline-offset-2">
          Política de Privacidade
        </a>
        .
      </p>
      <div className="mt-3 flex flex-wrap justify-end gap-2.5">
        <button
          type="button"
          onClick={() => escolher(false)}
          className="rounded-lg border border-[#D7DEE6] px-4 py-2 text-[13px] font-semibold text-[#3A4A63] hover:bg-surface-2"
        >
          Recusar
        </button>
        <button
          type="button"
          onClick={() => escolher(true)}
          className="rounded-lg bg-brand px-4 py-2 text-[13px] font-semibold text-white hover:bg-brand-deep"
        >
          Aceitar
        </button>
      </div>
    </div>
  );
}

export function BotaoPreferenciasCookies({ className }: { className?: string }) {
  return (
    <button type="button" className={className} onClick={() => window.dispatchEvent(new Event("sibrap:cookies"))}>
      Preferências de cookies
    </button>
  );
}
