"use client";

import { Fragment, useMemo, useState } from "react";
import type { ApostilaVitrine } from "@/lib/apostilas";
import { CardApostila } from "@/components/card-apostila";
import { CardDestaqueVitrine } from "@/components/destaque-vitrine";
import { DESTAQUES_VITRINE, POSICOES_DESTAQUE } from "@/lib/destaques-vitrine";
import { FiltroSuspenso } from "@/components/filtro-suspenso";
import { casaComTermos, termosDaBusca, textoDaApostila, UF_NOMES } from "@/lib/busca";

/** "BR" = concurso nacional (IBGE etc.) */
export function nomeEstado(uf: string): string {
  return uf === "BR" ? "Nacional" : (UF_NOMES[uf] ?? uf);
}

// Vitrine com filtros (categoria, estado e busca). A lista é pequena e
// já vem completa do servidor — filtrar no navegador evita ida e volta.
export function VitrineApostilas({
  apostilas,
  comBusca = false,
  limite,
  limiteInicial,
  ufInicial = "",
  porEstado = false,
  compacto = false,
}: {
  apostilas: ApostilaVitrine[];
  comBusca?: boolean;
  limite?: number;
  /** mostra só as N mais recentes até o visitante pedir mais (filtro ou busca mostram tudo) */
  limiteInicial?: number;
  ufInicial?: string;
  /** página /apostilas: estados em botões (com contagem) e lista separada por estado; troca a URL sem recarregar */
  porEstado?: boolean;
  /** home: filtros num botão "Apostilas por estado ▾" (e área), sem a parede de botões */
  compacto?: boolean;
}) {
  const [categoria, setCategoria] = useState("Todas");
  const [uf, setUf] = useState(ufInicial);
  const [busca, setBusca] = useState("");
  const [verTodas, setVerTodas] = useState(false);

  const categorias = useMemo(
    () => ["Todas", ...Array.from(new Set(apostilas.map((a) => a.categoria)))],
    [apostilas]
  );
  const ufs = useMemo(
    () => Array.from(new Set(apostilas.map((a) => a.uf))).sort(),
    [apostilas]
  );
  // estados com contagem: Nacional primeiro, depois quem tem mais apostilas
  const estados = useMemo(() => {
    const n = new Map<string, number>();
    for (const a of apostilas) n.set(a.uf, (n.get(a.uf) ?? 0) + 1);
    return Array.from(n.entries()).sort(
      (x, y) => Number(y[0] === "BR") - Number(x[0] === "BR") || y[1] - x[1] || nomeEstado(x[0]).localeCompare(nomeEstado(y[0]))
    );
  }, [apostilas]);
  function escolherUf(u: string) {
    setUf(u);
    if (porEstado) {
      try {
        window.history.replaceState(null, "", u ? `/apostilas/estado/${u.toLowerCase()}` : "/apostilas");
      } catch {}
    }
  }

  const filtradas = useMemo(() => {
    const termos = termosDaBusca(busca);
    const lista = apostilas.filter(
      (a) => (categoria === "Todas" || a.categoria === categoria) && (!uf || a.uf === uf) && casaComTermos(textoDaApostila(a), termos)
    );
    return limite ? lista.slice(0, limite) : lista;
  }, [apostilas, categoria, uf, busca, limite]);

  // Destaques de linha inteira (só sem filtro): cada um entra na próxima posição livre.
  const semFiltro = categoria === "Todas" && !uf && !busca.trim();
  const recolhida = !!limiteInicial && semFiltro && !verTodas && filtradas.length > limiteInicial;
  const visiveis = recolhida ? filtradas.slice(0, limiteInicial) : filtradas;
  const destaques = useMemo(() => {
    if (!semFiltro) return new Map<number, { d: (typeof DESTAQUES_VITRINE)[number]; a: ApostilaVitrine }>();
    const disponiveis = DESTAQUES_VITRINE.flatMap((d) => {
      const a = apostilas.find((x) => x.slug === d.slug);
      return a ? [{ d, a }] : [];
    });
    return new Map(
      POSICOES_DESTAQUE.filter((pos) => pos < visiveis.length)
        .slice(0, disponiveis.length)
        .map((pos, i) => [pos, disponiveis[i]])
    );
  }, [semFiltro, apostilas, visiveis.length]);

  const chip = (ativo: boolean) =>
    `rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${
      ativo
        ? "border-brand bg-brand text-white"
        : "border-[#D7DEE6] bg-white text-[#516278] hover:border-brand hover:text-brand"
    }`;

  const estadoChip = (ativo: boolean) =>
    `inline-flex shrink-0 items-center gap-1.5 border px-3 py-1.5 text-[13px] font-semibold transition-colors ${
      ativo
        ? "border-[#14213A] bg-[#14213A] text-white"
        : "border-[#D7DEE6] bg-white text-[#3A4A63] hover:border-[#14213A]"
    }`;
  const conta = (n: number, ativo: boolean) => (
    <span className={`text-[11.5px] font-bold ${ativo ? "text-white/70" : "text-[#8A97A8]"}`}>{n}</span>
  );
  // sem filtro nenhum, a página /apostilas mostra uma seção por estado
  const agrupar = porEstado && semFiltro;
  const secoes = agrupar ? estados.map(([u, n]) => ({ uf: u, n, lista: filtradas.filter((a) => a.uf === u) })) : [];
  const destaquesSoltos = agrupar
    ? DESTAQUES_VITRINE.flatMap((d) => {
        const a = apostilas.find((x) => x.slug === d.slug);
        return a ? [{ d, a }] : [];
      })
    : [];

  return (
    <div>
      {porEstado && estados.length > 1 && (
        <nav aria-label="Apostilas por estado" className="mb-4">
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => escolherUf("")} className={estadoChip(!uf)} aria-pressed={!uf}>
              Todos os estados {conta(apostilas.length, !uf)}
            </button>
            {estados.map(([u, n]) => (
              <button key={u} type="button" onClick={() => escolherUf(u)} className={estadoChip(uf === u)} aria-pressed={uf === u}>
                {nomeEstado(u)} {conta(n, uf === u)}
              </button>
            ))}
          </div>
        </nav>
      )}
      {compacto && (
        <div className="mb-5 flex flex-wrap items-center gap-2">
          {estados.length > 1 && (
            <FiltroSuspenso
              rotulo="Por estado"
              valor={uf}
              aoEscolher={escolherUf}
              opcoes={[{ valor: "", rotulo: "Todos os estados", qtd: apostilas.length }, ...estados.map(([u, n]) => ({ valor: u, rotulo: nomeEstado(u), qtd: n }))]}
            />
          )}
          {categorias.length > 2 && (
            <FiltroSuspenso
              rotulo="Por área"
              valor={categoria}
              aoEscolher={setCategoria}
              opcoes={categorias.map((c) => ({ valor: c, rotulo: c === "Todas" ? "Todas as áreas" : c }))}
            />
          )}
          {comBusca && (
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar: cidade, cargo…"
              aria-label="Buscar apostila"
              className="min-h-[40px] w-full min-w-0 rounded-md border border-[#D7DEE6] bg-white px-3 py-2 text-[13.5px] text-[#14213A] sm:ml-auto sm:w-64"
            />
          )}
        </div>
      )}
      {!compacto && (categorias.length > 2 || ufs.length > 1 || comBusca) && (
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por categoria">
            {categorias.map((c) => (
              <button key={c} type="button" onClick={() => setCategoria(c)} className={chip(categoria === c)} aria-pressed={categoria === c}>
                {c}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            {ufs.length > 1 && !porEstado && (
              <select
                aria-label="Filtrar por estado"
                value={uf}
                onChange={(e) => escolherUf(e.target.value)}
                className="rounded-lg border border-[#D7DEE6] bg-white px-3 py-2 text-[13.5px] text-[#14213A]"
              >
                <option value="">Todos os estados</option>
                {ufs.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            )}
            {comBusca && (
              <input
                type="search"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar: apostila, cidade, cargo…"
                aria-label="Buscar apostila"
                className="w-full min-w-0 rounded-lg border border-[#D7DEE6] bg-white px-3 py-2 text-[13.5px] text-[#14213A] sm:w-72"
              />
            )}
          </div>
        </div>
      )}

      {agrupar ? (
        <div className="space-y-12">
          {secoes.map((sec, i) => (
            <Fragment key={sec.uf}>
              <section aria-labelledby={`estado-${sec.uf}`}>
                <div className="mb-4 flex items-baseline justify-between gap-3 border-b border-[#D7DEE6] pb-2">
                  <h2 id={`estado-${sec.uf}`} className="font-display text-[1.3rem] font-extrabold text-[#14213A] sm:text-[1.5rem]">
                    {sec.uf === "BR" ? "Concursos nacionais" : nomeEstado(sec.uf)}
                  </h2>
                  {sec.uf !== "BR" && sec.n > 1 && (
                    <button type="button" onClick={() => { escolherUf(sec.uf); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="shrink-0 text-[13px] font-semibold text-brand hover:underline">
                      Ver só {sec.uf} ({sec.n})
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
                  {sec.lista.map((a) => (
                    <CardApostila key={a.id} apostila={a} />
                  ))}
                </div>
              </section>
              {destaquesSoltos[i] && (
                <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
                  <CardDestaqueVitrine destaque={destaquesSoltos[i].d} apostila={destaquesSoltos[i].a} />
                </div>
              )}
            </Fragment>
          ))}
        </div>
      ) : filtradas.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[#C4CEDA] bg-white px-6 py-12 text-center text-[15px] text-[#516278]">
          {apostilas.length === 0
            ? "As primeiras apostilas estão sendo finalizadas. Volte em breve!"
            : "Nenhuma apostila encontrada com esses filtros."}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
          {visiveis.map((a, i) => {
            const extra = destaques.get(i);
            return (
              <Fragment key={a.id}>
                {extra && <CardDestaqueVitrine destaque={extra.d} apostila={extra.a} />}
                <CardApostila apostila={a} />
              </Fragment>
            );
          })}
        </div>
      )}

      {!agrupar && recolhida && (
        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={() => setVerTodas(true)}
            className="inline-flex items-center gap-2 border-2 border-brand bg-white px-6 py-3 text-[14.5px] font-bold text-brand transition-colors hover:bg-brand hover:text-white"
          >
            Mostrar mais apostilas ({filtradas.length - visiveis.length}) <span aria-hidden>↓</span>
          </button>
        </div>
      )}
    </div>
  );
}
