"use client";

import "bootstrap-icons/font/bootstrap-icons.min.css";
import { useEffect, useState } from "react";

// Menu de rodapé estilo app (só no celular, na home), no lugar da barra de âncoras que rolava
// para o lado (Wagner, 23/11/2026). 5 itens; o da seção visível fica destacado. O rosto do robô
// abre a conversa do SIBRAP IA (src/components/natan.tsx escuta "sibrap-ia:alternar").
type Item = { id: string; href: string; rotulo: string; icone?: string; iconeAtivo?: string };
const ITENS: Item[] = [
  { id: "topo", href: "#topo", rotulo: "Início", icone: "house-door", iconeAtivo: "house-door-fill" },
  { id: "apostilas", href: "#apostilas", rotulo: "Apostilas", icone: "journal-text", iconeAtivo: "journal-text" },
  { id: "cursos-gratuitos", href: "#cursos-gratuitos", rotulo: "Cursos", icone: "mortarboard", iconeAtivo: "mortarboard-fill" },
  { id: "ia", href: "#", rotulo: "SIBRAP IA" },
  { id: "minha-area", href: "/minha-area", rotulo: "Minha área", icone: "person-circle", iconeAtivo: "person-circle" },
];

export function MenuInferior() {
  const [ativo, setAtivo] = useState("topo");
  const [iaAberta, setIaAberta] = useState(false);

  useEffect(() => {
    const secoes = ["apostilas", "cursos-gratuitos"].map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    const aoRolar = () => {
      const meio = window.innerHeight * 0.4;
      let atual = "topo";
      for (const s of secoes) {
        const r = s.getBoundingClientRect();
        if (r.top <= meio && r.bottom > meio) atual = s.id;
      }
      setAtivo(atual);
    };
    const aoMudarIa = (e: Event) => setIaAberta(!!(e as CustomEvent<boolean>).detail);
    aoRolar();
    window.addEventListener("scroll", aoRolar, { passive: true });
    window.addEventListener("sibrap-ia:estado", aoMudarIa);
    return () => {
      window.removeEventListener("scroll", aoRolar);
      window.removeEventListener("sibrap-ia:estado", aoMudarIa);
    };
  }, []);

  return (
    <nav
      aria-label="Menu principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[#D7DEE6] bg-white/97 pb-[env(safe-area-inset-bottom)] shadow-[0_-6px_20px_-12px_rgba(11,42,74,0.35)] backdrop-blur md:hidden"
    >
      <ul className="grid grid-cols-5">
        {ITENS.map((item) => {
          const ehIa = item.id === "ia";
          const marcado = ehIa ? iaAberta : ativo === item.id;
          const classe = `flex w-full flex-col items-center gap-0.5 pt-2 pb-1.5 text-[11px] font-semibold transition-colors ${
            marcado ? "text-brand" : "text-[#516278]"
          }`;
          const miolo = (
            <>
              {ehIa ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src="/sibrap-ia/rosto-menu.webp" alt="" width={30} height={30} className="-mt-1 h-[30px] w-[30px]" />
              ) : (
                <i className={`bi bi-${marcado ? item.iconeAtivo : item.icone} text-[22px] leading-none`} aria-hidden />
              )}
              {item.rotulo}
              <span className={`mt-0.5 h-[3px] w-6 ${marcado ? "bg-accent" : "bg-transparent"}`} aria-hidden />
            </>
          );
          return (
            <li key={item.id}>
              {ehIa ? (
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new Event("sibrap-ia:alternar"))}
                  aria-expanded={iaAberta}
                  aria-label={iaAberta ? "Fechar o SIBRAP IA" : "Abrir o SIBRAP IA, assistente virtual"}
                  className={classe}
                >
                  {miolo}
                </button>
              ) : (
                <a
                  href={item.href}
                  onClick={item.id === "topo" ? (e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); } : undefined}
                  aria-current={marcado ? "page" : undefined}
                  className={classe}
                >
                  {miolo}
                </a>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
