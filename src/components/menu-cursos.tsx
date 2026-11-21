"use client";

// Menu lateral de cursos no canto superior esquerdo do cabeçalho (Wagner, 21/11/2026).
// Computador: abre ao passar o mouse; categorias à esquerda e, ao lado, a lista de cursos da categoria (sem foto).
// Celular: botão hambúrguer abre a gaveta pela esquerda, com as categorias em sanfona.
// A lista vem do catálogo em cache (/api/natan/catalogo, 1 h) e só é buscada quando o menu abre:
// nada de dados nem cookies a mais nas páginas públicas.
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ItemCatalogo } from "@/lib/natan";
import { ORDEM_CATEGORIAS } from "@/components/vitrine-cursos";
import { sairDaConta } from "@/app/login/actions";
import { COOKIE_LOGADO } from "@/lib/marca-logado";

type Categoria = { nome: string; itens: ItemCatalogo[] };

const LINKS_SITE: [string, string][] = [
  ["Apostilas para concursos", "/apostilas"],
  ["Notícias de concursos", "/noticias"],
  ["Profissões", "/profissoes"],
  ["Currículo grátis", "/curriculo"],
  ["Validar certificado", "/validar"],
];

function agrupar(itens: ItemCatalogo[]): Categoria[] {
  const mapa = new Map<string, ItemCatalogo[]>();
  for (const i of itens) {
    if (i.tipo === "apostila" || !i.area) continue;
    mapa.set(i.area, [...(mapa.get(i.area) ?? []), i]);
  }
  const ordem = (n: string) => {
    const k = ORDEM_CATEGORIAS.indexOf(n);
    return k < 0 ? 99 : k;
  };
  return [...mapa.entries()]
    .sort((a, b) => ordem(a[0]) - ordem(b[0]) || a[0].localeCompare(b[0]))
    .map(([nome, lista]) => ({ nome, itens: lista.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")) }));
}

const rotuloItem = (i: ItemCatalogo) =>
  i.tipo === "curso-gratis" ? "Grátis" : i.tipo === "formacao" ? "Formação" : i.preco ?? "Pago";

function Hamburguer({ aberto }: { aberto: boolean }) {
  return (
    <svg aria-hidden width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="square">
      {aberto ? (
        <path d="M6 6l12 12M18 6L6 18" />
      ) : (
        <>
          <path d="M3 6h18" />
          <path d="M3 12h18" />
          <path d="M3 18h18" />
        </>
      )}
    </svg>
  );
}

export function MenuCursos() {
  const [aberto, setAberto] = useState(false);
  const [cats, setCats] = useState<Categoria[] | null>(null);
  const [erro, setErro] = useState(false);
  const [ativa, setAtiva] = useState<string | null>(null);
  const [logado, setLogado] = useState(false);
  const fechar = useRef<ReturnType<typeof setTimeout> | null>(null);
  const comMouse = useRef(false);

  const carregar = useCallback(() => {
    if (cats || erro) return;
    fetch("/api/natan/catalogo")
      .then((r) => r.json())
      .then((d: ItemCatalogo[]) => {
        const g = agrupar(d);
        setCats(g);
        // computador: já mostra a 1ª categoria no painel ao lado; celular: começa com a sanfona fechada
        setAtiva((a) => a ?? (comMouse.current ? (g[0]?.nome ?? null) : null));
      })
      .catch(() => setErro(true));
  }, [cats, erro]);

  const abrir = useCallback(() => {
    if (fechar.current) clearTimeout(fechar.current);
    carregar();
    // mesmo cookie-sinal do botão do cabeçalho (páginas em cache não sabem quem está logado)
    setLogado(document.cookie.split("; ").some((c) => c === `${COOKIE_LOGADO}=1`));
    setAberto(true);
  }, [carregar]);

  useEffect(() => {
    comMouse.current = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  }, []);

  useEffect(() => {
    if (!aberto) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setAberto(false);
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [aberto]);

  const lista = cats?.find((c) => c.nome === ativa);

  return (
    <div
      className="shrink-0"
      onMouseEnter={() => comMouse.current && abrir()}
      onMouseLeave={() => {
        if (!comMouse.current) return;
        fechar.current = setTimeout(() => setAberto(false), 220);
      }}
    >
      <button
        type="button"
        onClick={() => (aberto ? setAberto(false) : abrir())}
        aria-expanded={aberto}
        aria-controls="menu-cursos"
        className={`flex h-10 items-center gap-2 px-2 text-[14px] font-bold transition-colors sm:px-2.5 ${
          aberto ? "bg-brand text-white" : "text-brand hover:bg-[#F0F4F8]"
        }`}
      >
        <Hamburguer aberto={aberto} />
        <span className="hidden lg:inline">Cursos</span>
        <span className="sr-only lg:hidden">Menu de cursos</span>
      </button>

      {aberto && (
        <>
          {/* fundo escuro: só no celular/tablet; no computador o menu fecha ao tirar o mouse */}
          <button type="button" aria-label="Fechar menu" onClick={() => setAberto(false)} className="fixed inset-0 z-[70] bg-[#071B33]/55 lg:bg-[#071B33]/25" />

          <nav
            id="menu-cursos"
            aria-label="Cursos por categoria"
            className="fixed left-0 top-0 z-[71] flex h-dvh w-[min(88vw,320px)] flex-col border-r-[3px] border-accent bg-white shadow-[8px_0_30px_-10px_rgba(7,27,51,0.45)] motion-safe:animate-[entrar-esquerda_.18s_ease-out]"
          >
            <div className="flex items-center justify-between bg-brand px-4 py-3 text-white">
              <span className="font-display text-[17px] font-extrabold">Cursos por categoria</span>
              <button type="button" onClick={() => setAberto(false)} aria-label="Fechar" className="p-1 text-[#C9D6E5] hover:text-white">
                <Hamburguer aberto />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {!cats && !erro && <p className="px-4 py-4 text-[14px] text-[#516278]">Carregando cursos…</p>}
              {erro && (
                <p className="px-4 py-4 text-[14px] text-[#516278]">
                  Não foi possível carregar agora. <Link href="/cursos" className="font-bold text-brand underline">Ver todos os cursos</Link>
                </p>
              )}
              <ul>
                {cats?.map((c) => {
                  const sel = c.nome === ativa;
                  return (
                    <li key={c.nome} className="border-b border-[#EEF2F6]">
                      <button
                        type="button"
                        onMouseEnter={() => comMouse.current && setAtiva(c.nome)}
                        onClick={() => setAtiva(sel && !comMouse.current ? null : c.nome)}
                        aria-expanded={sel}
                        className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-[15px] font-bold transition-colors ${
                          sel ? "border-l-4 border-accent bg-[#F0F4F8] text-brand" : "border-l-4 border-transparent text-[#14213A] hover:bg-[#F6F8FB]"
                        }`}
                      >
                        <span>{c.nome}</span>
                        <span className="flex shrink-0 items-center gap-2 font-data text-[12px] font-semibold text-[#8A97A8]">
                          {c.itens.length}
                          <span aria-hidden className={`text-brand transition-transform ${sel ? "rotate-90 lg:rotate-0" : ""}`}>›</span>
                        </span>
                      </button>
                      {/* celular/tablet: sanfona com os cursos da categoria */}
                      {sel && (
                        <ul className="bg-[#F6F8FB] pb-2 lg:hidden">
                          {c.itens.map((i) => (
                            <ItemCurso key={i.id} item={i} aoClicar={() => setAberto(false)} />
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* celular/tablet: o resto do menu do site e a conta, que não cabem no cabeçalho (Wagner, 21/11/2026) */}
            <div className="border-t-[3px] border-[#EEF2F6] lg:hidden">
              <p className="px-4 pt-3 font-data text-[11.5px] font-semibold uppercase tracking-wide text-[#8A97A8]">Mais no SIBRAP</p>
              <ul className="py-1">
                {LINKS_SITE.map(([rotulo, href]) => (
                  <li key={href}>
                    <Link href={href} onClick={() => setAberto(false)} className="block px-4 py-2.5 text-[15px] font-semibold text-[#14213A] hover:bg-[#F6F8FB] hover:text-brand">
                      {rotulo}
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="flex items-center gap-2 border-t border-[#EEF2F6] px-4 py-3">
                <Link
                  href={logado ? "/minha-area" : "/login"}
                  onClick={() => setAberto(false)}
                  className="flex-1 bg-brand px-3 py-2.5 text-center text-[14.5px] font-bold text-white hover:brightness-125"
                >
                  {logado ? "Minha área" : "Entrar · Área do aluno"}
                </Link>
                {logado && (
                  <form action={sairDaConta}>
                    <button type="submit" className="border-2 border-[#C5CFDA] px-3 py-2 text-[14.5px] font-bold text-[#516278] hover:border-brand hover:text-brand">
                      Sair
                    </button>
                  </form>
                )}
              </div>
            </div>

            <Link href="/cursos" onClick={() => setAberto(false)} className="block bg-accent px-4 py-3 text-center text-[15px] font-extrabold text-accent-ink hover:brightness-105">
              Ver todos os cursos →
            </Link>
          </nav>

          {/* computador: painel ao lado com os cursos da categoria em foco */}
          {lista && (
            <div className="fixed left-[320px] top-0 z-[71] hidden h-dvh w-[360px] flex-col border-r border-[#D7DEE6] bg-[#F6F8FB] shadow-[8px_0_30px_-12px_rgba(7,27,51,0.35)] lg:flex">
              <p className="border-b border-[#D7DEE6] bg-white px-5 py-3.5 font-display text-[16px] font-extrabold text-[#14213A]">{lista.nome}</p>
              <ul className="flex-1 overflow-y-auto py-2">
                {lista.itens.map((i) => (
                  <ItemCurso key={i.id} item={i} aoClicar={() => setAberto(false)} />
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ItemCurso({ item, aoClicar }: { item: ItemCatalogo; aoClicar: () => void }) {
  return (
    <li>
      <Link
        href={item.url}
        onClick={aoClicar}
        className="group flex items-start justify-between gap-3 px-5 py-2.5 text-[14.5px] leading-snug text-[#14213A] transition-colors hover:bg-white hover:text-brand"
      >
        <span className="group-hover:underline group-hover:underline-offset-2">{item.nome}</span>
        <span className="shrink-0 pt-0.5 font-data text-[11.5px] font-semibold text-[#0E7C6B]">
          {item.horas ? `${item.horas} h · ` : ""}
          {rotuloItem(item)}
        </span>
      </Link>
    </li>
  );
}
