"use client";

import "bootstrap-icons/font/bootstrap-icons.min.css";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

// Menu de rodapé estilo app, só no celular, em todo o site público (Wagner, 23/11/2026).
// Na home os itens rolam até os produtos; nas outras páginas levam às vitrines. O rosto do robô
// abre a conversa do SIBRAP IA (src/components/natan.tsx escuta "sibrap-ia:alternar").
// Fica de fora: área logada (tem menus próprios), admin, certificado, formulário neutro e as
// páginas de produto, que já têm a barra fixa de compra no rodapé.

const ESCONDER = /^\/(admin|minha-area|certificado|solicitacao)(\/|$)/;
const COM_BARRA_COMPRA = /^\/(apostilas\/(?!estado\/)[^/]+|combos\/[^/]+|cursos\/(?!profissionalizantes\/?$)[^/]+)\/?$/;

type Item = { id: string; rotulo: string; ancora?: string; rota?: string; icone?: string; iconeAtivo?: string };
const ITENS: Item[] = [
  { id: "topo", rotulo: "Início", ancora: "#topo", rota: "/", icone: "house-door", iconeAtivo: "house-door-fill" },
  { id: "apostilas", rotulo: "Apostilas", ancora: "#apostilas-produtos", rota: "/apostilas", icone: "journal-text", iconeAtivo: "journal-text" },
  { id: "cursos-gratuitos", rotulo: "Cursos", ancora: "#cursos-produtos", rota: "/cursos", icone: "mortarboard", iconeAtivo: "mortarboard-fill" },
  { id: "ia", rotulo: "SIBRAP IA" },
  { id: "minha-area", rotulo: "Minha área", rota: "/minha-area", icone: "person-circle", iconeAtivo: "person-circle" },
];

export function MenuInferior() {
  const caminho = usePathname() ?? "/";
  const naHome = caminho === "/";
  const [secaoHome, setSecaoHome] = useState("topo");
  const [iaAberta, setIaAberta] = useState(false);

  useEffect(() => {
    const aoMudarIa = (e: Event) => setIaAberta(!!(e as CustomEvent<boolean>).detail);
    window.addEventListener("sibrap-ia:estado", aoMudarIa);
    return () => window.removeEventListener("sibrap-ia:estado", aoMudarIa);
  }, []);

  // na home, o item da seção visível fica aceso
  useEffect(() => {
    if (!naHome) return;
    const secoes = ["apostilas", "cursos-gratuitos"].map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    const aoRolar = () => {
      const meio = window.innerHeight * 0.4;
      let atual = "topo";
      for (const s of secoes) {
        const r = s.getBoundingClientRect();
        if (r.top <= meio && r.bottom > meio) atual = s.id;
      }
      setSecaoHome(atual);
    };
    aoRolar();
    window.addEventListener("scroll", aoRolar, { passive: true });
    return () => window.removeEventListener("scroll", aoRolar);
  }, [naHome]);

  if (ESCONDER.test(caminho) || COM_BARRA_COMPRA.test(caminho)) return null;

  const ativo = naHome
    ? secaoHome
    : caminho.startsWith("/apostilas")
      ? "apostilas"
      : caminho.startsWith("/cursos")
        ? "cursos-gratuitos"
        : "";

  return (
    <>
      {/* espaço no fim da página para o menu não cobrir o rodapé */}
      <div className="h-16 md:hidden" aria-hidden />
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
            if (ehIa) {
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => window.dispatchEvent(new Event("sibrap-ia:alternar"))}
                    aria-expanded={iaAberta}
                    aria-label={iaAberta ? "Fechar o SIBRAP IA" : "Abrir o SIBRAP IA, assistente virtual"}
                    className={classe}
                  >
                    {miolo}
                  </button>
                </li>
              );
            }
            // na home: âncora (rola até os produtos); fora dela: link para a vitrine
            if (naHome && item.ancora) {
              return (
                <li key={item.id}>
                  <a
                    href={item.ancora}
                    onClick={item.id === "topo" ? (e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); } : undefined}
                    aria-current={marcado ? "page" : undefined}
                    className={classe}
                  >
                    {miolo}
                  </a>
                </li>
              );
            }
            return (
              <li key={item.id}>
                <Link href={item.rota!} aria-current={marcado ? "page" : undefined} className={classe}>
                  {miolo}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
