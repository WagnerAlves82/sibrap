"use client";

import { useMemo, useState } from "react";
import { ESFERAS, REGIOES, type PostVitrine } from "@/lib/blog";
import { CardPost } from "@/components/card-post";
import { PromoApostila } from "@/components/promo-apostila";
import type { ApostilaVitrine } from "@/lib/apostilas";

// Vitrine do blog com filtro por região e estado, no mesmo espírito da
// vitrine de apostilas: a lista já vem completa do servidor, filtrar no
// navegador evita ida e volta.
export function VitrinePosts({
  posts,
  apostilas = [],
  comBusca = false,
  regiaoInicial = "",
  ufInicial = "",
}: {
  posts: PostVitrine[];
  apostilas?: ApostilaVitrine[];
  comBusca?: boolean;
  regiaoInicial?: string;
  ufInicial?: string;
}) {
  const [regiao, setRegiao] = useState(regiaoInicial);
  const [uf, setUf] = useState(ufInicial);
  const [federal, setFederal] = useState(false);
  const [busca, setBusca] = useState("");
  const [esfera, setEsfera] = useState("");

  // Estados em ordem do concurso/post mais atual (a lista já vem do mais
  // novo pro mais antigo), com a contagem de posts de cada um.
  const ufsRecentes = useMemo(() => {
    const vistos = new Map<string, number>();
    for (const p of posts) if (p.uf) vistos.set(p.uf, (vistos.get(p.uf) ?? 0) + 1);
    return Array.from(vistos.entries());
  }, [posts]);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return posts.filter(
      (p) =>
        (!federal ? (!regiao || p.regiao === regiao) && (!uf || p.uf === uf) : !p.uf && !p.regiao) &&
        (!esfera || p.esfera === esfera) &&
        (!termo || `${p.titulo} ${p.resumo ?? ""} ${p.categoria}`.toLowerCase().includes(termo))
    );
  }, [posts, regiao, uf, federal, esfera, busca]);

  const chip = (ativo: boolean) =>
    `rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${
      ativo
        ? "border-brand bg-brand text-white"
        : "border-[#D7DEE6] bg-white text-[#516278] hover:border-brand hover:text-brand"
    }`;

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por região">
          <button
            type="button"
            onClick={() => { setRegiao(""); setUf(""); setFederal(false); }}
            className={chip(!regiao && !federal)}
          >
            Todas as regiões
          </button>
          {REGIOES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => { setRegiao(r); setUf(""); setFederal(false); }}
              className={chip(!federal && regiao === r)}
              aria-pressed={!federal && regiao === r}
            >
              {r}
            </button>
          ))}
          <button
            type="button"
            onClick={() => { setFederal(true); setRegiao(""); setUf(""); }}
            className={chip(federal)}
            aria-pressed={federal}
          >
            Federal
          </button>
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por tipo de concurso">
          <button type="button" onClick={() => setEsfera("")} className={chip(!esfera)} aria-pressed={!esfera}>
            Todos os tipos
          </button>
          {ESFERAS.map((e) => (
            <button
              key={e.valor}
              type="button"
              onClick={() => setEsfera(esfera === e.valor ? "" : e.valor)}
              className={chip(esfera === e.valor)}
              aria-pressed={esfera === e.valor}
            >
              {e.rotulo}
            </button>
          ))}
        </div>
        {ufsRecentes.length > 0 && (
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por estado">
            {ufsRecentes.map(([u, n]) => (
              <button
                key={u}
                type="button"
                onClick={() => { setUf(uf === u ? "" : u); setRegiao(""); setFederal(false); }}
                className={chip(!federal && uf === u)}
                aria-pressed={!federal && uf === u}
              >
                {u} <span className="opacity-60">({n})</span>
              </button>
            ))}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2">
          {comBusca && (
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por título ou assunto"
              aria-label="Buscar post"
              className="w-full min-w-0 rounded-lg border border-[#D7DEE6] bg-white px-3 py-2 text-[13.5px] text-[#14213A] sm:w-64"
            />
          )}
        </div>
      </div>

      {filtrados.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[#C4CEDA] bg-white px-6 py-12 text-center text-[15px] text-[#516278]">
          {posts.length === 0
            ? "Ainda não publicamos nenhum post por aqui. Volte em breve!"
            : "Nenhum post encontrado com esses filtros."}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
          {filtrados.flatMap((p, i) => {
            const itens = [<CardPost key={p.id} post={p} />];
            // a cada 6 matérias, uma apostila em destaque (rotaciona entre as publicadas)
            if (apostilas.length > 0 && (i + 1) % 6 === 0) {
              const a = apostilas[((i + 1) / 6 - 1) % apostilas.length];
              itens.push(<PromoApostila key={`promo-${i}`} apostila={a} variante="faixa" origem="blog-lista" />);
            }
            return itens;
          })}
        </div>
      )}
    </div>
  );
}
