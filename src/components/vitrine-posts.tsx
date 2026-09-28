"use client";

import { useMemo, useState } from "react";
import { REGIOES, type PostVitrine } from "@/lib/blog";
import { CardPost } from "@/components/card-post";

// Vitrine do blog com filtro por região e estado, no mesmo espírito da
// vitrine de apostilas: a lista já vem completa do servidor, filtrar no
// navegador evita ida e volta.
export function VitrinePosts({
  posts,
  comBusca = false,
  regiaoInicial = "",
  ufInicial = "",
}: {
  posts: PostVitrine[];
  comBusca?: boolean;
  regiaoInicial?: string;
  ufInicial?: string;
}) {
  const [regiao, setRegiao] = useState(regiaoInicial);
  const [uf, setUf] = useState(ufInicial);
  const [busca, setBusca] = useState("");

  const ufsDaRegiao = useMemo(() => {
    const todas = new Set(posts.filter((p) => !regiao || p.regiao === regiao).map((p) => p.uf).filter((u): u is string => !!u));
    return Array.from(todas).sort();
  }, [posts, regiao]);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return posts.filter(
      (p) =>
        (!regiao || p.regiao === regiao) &&
        (!uf || p.uf === uf) &&
        (!termo || `${p.titulo} ${p.resumo ?? ""} ${p.categoria}`.toLowerCase().includes(termo))
    );
  }, [posts, regiao, uf, busca]);

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
          <button type="button" onClick={() => { setRegiao(""); setUf(""); }} className={chip(!regiao)}>
            Todas as regiões
          </button>
          {REGIOES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => { setRegiao(r); setUf(""); }}
              className={chip(regiao === r)}
              aria-pressed={regiao === r}
            >
              {r}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {ufsDaRegiao.length > 1 && (
            <select
              aria-label="Filtrar por estado"
              value={uf}
              onChange={(e) => setUf(e.target.value)}
              className="rounded-lg border border-[#D7DEE6] bg-white px-3 py-2 text-[13.5px] text-[#14213A]"
            >
              <option value="">Todos os estados{regiao ? ` (${regiao})` : ""}</option>
              {ufsDaRegiao.map((u) => (
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
          {filtrados.map((p) => (
            <CardPost key={p.id} post={p} />
          ))}
        </div>
      )}
    </div>
  );
}
