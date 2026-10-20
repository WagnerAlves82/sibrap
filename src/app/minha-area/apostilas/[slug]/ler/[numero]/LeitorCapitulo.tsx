"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { registrarLeituraAction, registrarLeituraAposQuestaoAction } from "../actions";

type ItemIndice = { numero: number; titulo: string };
type Secao = { id: string; titulo: string };

// Leitor do capítulo da apostila no AVA: pensado para o celular (barra fixa em cima e embaixo,
// setas de capítulo anterior/próximo, menu com as seções) e funciona igual no computador.
export function LeitorCapitulo({
  slug,
  tituloApostila,
  capitulo,
  secoes,
  indice,
  anterior,
  proximo,
  secaoAlvo,
  vindoDoSimulado,
}: {
  slug: string;
  tituloApostila: string;
  capitulo: { numero: number; titulo: string; html: string };
  secoes: Secao[];
  indice: ItemIndice[];
  anterior: ItemIndice | null;
  proximo: ItemIndice | null;
  secaoAlvo: string | null;
  vindoDoSimulado: boolean;
}) {
  const [menu, setMenu] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const fim = useRef<HTMLDivElement>(null);
  const base = `/minha-area/apostilas/${slug}`;
  const hrefCap = (n: number) => `${base}/ler/${n}`;

  // vai ao trecho da questão (se veio de uma) e o destaca por alguns segundos
  useEffect(() => {
    if (!secaoAlvo) {
      window.scrollTo(0, 0);
      return;
    }
    const el = document.getElementById(secaoAlvo);
    if (!el) return;
    const t = setTimeout(() => {
      el.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
      el.classList.add("secao-destaque");
    }, 150);
    return () => clearTimeout(t);
  }, [secaoAlvo, capitulo.numero]);

  // crédito de estudo: ao ficar um tempo no trecho vindo do simulado, e ao chegar ao fim do capítulo
  useEffect(() => {
    if (!vindoDoSimulado) return;
    const t = setTimeout(() => {
      registrarLeituraAposQuestaoAction(slug, capitulo.numero).then((r) => {
        if ("saldo" in r) setAviso("Você ganhou créditos de ajuda por estudar este trecho.");
      });
    }, 12000);
    return () => clearTimeout(t);
  }, [vindoDoSimulado, slug, capitulo.numero]);

  useEffect(() => {
    const alvo = fim.current;
    if (!alvo) return;
    let enviado = false;
    const obs = new IntersectionObserver(
      (entradas) => {
        if (entradas[0].isIntersecting && !enviado) {
          enviado = true;
          registrarLeituraAction(slug, capitulo.numero).then((r) => {
            if ("saldo" in r) setAviso("Capítulo concluído! Você ganhou créditos de ajuda.");
          });
        }
      },
      { threshold: 0.6 }
    );
    obs.observe(alvo);
    return () => obs.disconnect();
  }, [slug, capitulo.numero]);

  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(null), 4500);
    return () => clearTimeout(t);
  }, [aviso]);

  const botao =
    "flex h-10 min-w-10 items-center justify-center rounded-full border border-[#D7DEE6] bg-white px-3 text-[18px] font-bold text-brand transition-colors hover:bg-surface-2 aria-disabled:pointer-events-none aria-disabled:opacity-35";

  return (
    <div className="min-h-screen bg-[#F6F8FB] font-body text-[#1c2b3f]" style={{ colorScheme: "light" }}>
      {/* Barra superior fixa */}
      <header className="fixed inset-x-0 top-0 z-30 border-b border-[#D7DEE6] bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[720px] items-center gap-2 px-3 sm:px-5">
          <Link
            href={vindoDoSimulado ? `${base}/simulado` : `${base}/ler`}
            className="shrink-0 rounded-full px-2 py-1.5 text-[13px] font-bold text-brand"
            aria-label={vindoDoSimulado ? "Voltar ao simulado" : "Índice da apostila"}
          >
            ← {vindoDoSimulado ? "Simulado" : "Índice"}
          </Link>
          <p className="min-w-0 flex-1 truncate text-center font-data text-[11.5px] font-semibold text-[#516278]">
            Cap. {capitulo.numero} de {indice.length}
          </p>
          <Link href={anterior ? hrefCap(anterior.numero) : "#"} aria-disabled={!anterior} aria-label="Capítulo anterior" className={botao}>
            ‹
          </Link>
          <Link href={proximo ? hrefCap(proximo.numero) : "#"} aria-disabled={!proximo} aria-label="Próximo capítulo" className={botao}>
            ›
          </Link>
          <button type="button" onClick={() => setMenu(true)} aria-label="Abrir menu do capítulo" className={botao}>
            ☰
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[720px] px-4 pb-32 pt-[72px] sm:px-6">
        <p className="mb-3 text-[12px] font-semibold text-[#516278]">{tituloApostila}</p>
        <article className="leitor-conteudo" dangerouslySetInnerHTML={{ __html: capitulo.html }} />
        <div ref={fim} className="h-4" />

        <div className="mt-8 grid grid-cols-2 gap-3">
          {anterior ? (
            <Link href={hrefCap(anterior.numero)} className="rounded-xl border border-[#D7DEE6] bg-white px-4 py-3 text-[13px] font-semibold text-brand">
              <span className="block text-[11px] font-bold uppercase text-[#516278]">← Anterior</span>
              <span className="line-clamp-2">{anterior.titulo}</span>
            </Link>
          ) : (
            <span />
          )}
          {proximo ? (
            <Link href={hrefCap(proximo.numero)} className="rounded-xl bg-brand px-4 py-3 text-right text-[13px] font-semibold text-white">
              <span className="block text-[11px] font-bold uppercase text-[#B9D0EA]">Próximo →</span>
              <span className="line-clamp-2">{proximo.titulo}</span>
            </Link>
          ) : (
            <Link href={`${base}/simulado`} className="rounded-xl bg-accent-2 px-4 py-3 text-right text-[13px] font-bold text-white">
              <span className="block text-[11px] font-bold uppercase text-[#CDEFE8]">Fim da apostila</span>
              Praticar no simulado →
            </Link>
          )}
        </div>
      </main>

      {/* Atalho para voltar à questão */}
      {vindoDoSimulado && (
        <Link
          href={`${base}/simulado`}
          className="fixed bottom-[max(16px,env(safe-area-inset-bottom))] left-1/2 z-30 -translate-x-1/2 rounded-full bg-accent px-5 py-3 text-[13.5px] font-bold text-accent-ink shadow-lg"
        >
          ← Voltar à questão
        </Link>
      )}

      {aviso && (
        <p
          role="status"
          className="fixed inset-x-4 bottom-20 z-40 mx-auto max-w-[420px] rounded-xl bg-brand px-4 py-3 text-center text-[13px] font-semibold text-white shadow-lg"
        >
          {aviso}
        </p>
      )}

      {/* Menu: seções do capítulo e lista de capítulos */}
      {menu && (
        <div className="fixed inset-0 z-50">
          <button type="button" aria-label="Fechar menu" onClick={() => setMenu(false)} className="absolute inset-0 bg-[#0B1C33]/45" />
          <div
            role="dialog"
            aria-label="Menu do capítulo"
            className="absolute inset-x-0 bottom-0 max-h-[78vh] overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl sm:inset-x-auto sm:right-4 sm:top-16 sm:bottom-auto sm:w-[380px] sm:rounded-2xl"
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="font-display text-[15px] font-extrabold text-[#14213A]">Neste capítulo</p>
              <button type="button" onClick={() => setMenu(false)} aria-label="Fechar" className="flex h-8 w-8 items-center justify-center rounded-full text-[#516278] hover:bg-surface-2">
                ✕
              </button>
            </div>
            <ul className="mb-5 flex flex-col gap-1">
              {secoes.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    onClick={() => setMenu(false)}
                    className="block rounded-lg px-3 py-2 text-[13.5px] font-semibold text-brand hover:bg-surface-2"
                  >
                    {s.titulo}
                  </a>
                </li>
              ))}
            </ul>
            <p className="mb-2 font-display text-[15px] font-extrabold text-[#14213A]">Todos os capítulos</p>
            <ol className="flex flex-col gap-1">
              {indice.map((c) => (
                <li key={c.numero}>
                  <Link
                    href={hrefCap(c.numero)}
                    onClick={() => setMenu(false)}
                    className={`flex gap-2 rounded-lg px-3 py-2 text-[13px] leading-snug hover:bg-surface-2 ${
                      c.numero === capitulo.numero ? "bg-[#EAF2FB] font-bold text-brand" : "text-[#33465E]"
                    }`}
                  >
                    <span className="w-6 shrink-0 font-data font-bold">{c.numero}</span>
                    <span>{c.titulo}</span>
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
