"use client";

import { useMemo, useState } from "react";
import { ESFERAS, type PostVitrine } from "@/lib/blog";
import { CardPost } from "@/components/card-post";
import { PromoApostila } from "@/components/promo-apostila";
import type { ApostilaVitrine } from "@/lib/apostilas";

const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB",
  "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

// Concurso público (vagas efetivas) ou processo seletivo (contratação temporária),
// a partir do tipo informado no post ou, na falta dele, do título.
function tipoDoCertame(p: PostVitrine): "concurso" | "processo" | null {
  const t = `${p.certame_tipo ?? ""} ${p.titulo}`.toLowerCase();
  if (/seletivo/.test(t)) return "processo";
  if (/concurso/.test(t)) return "concurso";
  return null;
}

// Vitrine das notícias com filtro por tipo, âmbito e estado, no mesmo espírito da
// vitrine de apostilas: a lista já vem completa do servidor, filtrar no
// navegador evita ida e volta.
export function VitrinePosts({
  posts,
  apostilas = [],
  comBusca = false,
  ufInicial = "",
}: {
  posts: PostVitrine[];
  apostilas?: ApostilaVitrine[];
  comBusca?: boolean;
  ufInicial?: string;
}) {
  const [uf, setUf] = useState(ufInicial);
  const [federal, setFederal] = useState(false);
  const [busca, setBusca] = useState("");
  const [esfera, setEsfera] = useState("");
  const [tipo, setTipo] = useState<"" | "concurso" | "processo">("");

  const ufsComPosts = useMemo(() => new Set(posts.map((p) => p.uf).filter(Boolean)), [posts]);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return posts.filter(
      (p) =>
        (!federal ? !uf || p.uf === uf : p.esfera === "nacional") &&
        (!esfera || p.esfera === esfera) &&
        (!tipo || tipoDoCertame(p) === tipo) &&
        (!termo || `${p.titulo} ${p.resumo ?? ""} ${p.categoria}`.toLowerCase().includes(termo))
    );
  }, [posts, uf, federal, esfera, tipo, busca]);

  const base = "transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0";
  const chipUf = (ativo: boolean, vazio: boolean) =>
    `${base} min-w-[2.6rem] rounded-md border px-2 py-1.5 text-center text-[12.5px] font-bold ${
      ativo
        ? "border-brand bg-brand text-white shadow-md"
        : vazio
          ? "border-[#E6EBF1] bg-white text-[#A5B1C0] hover:border-accent hover:bg-[#FFF7E3] hover:text-[#8A6A1F]"
          : "border-[#D7DEE6] bg-white text-[#33465E] hover:border-accent hover:bg-[#FFF7E3] hover:text-brand hover:shadow-md"
    }`;

  const segmento = (ativo: boolean) =>
    `px-4 py-2 text-[13.5px] font-semibold transition-colors duration-150 ${
      ativo ? "bg-brand text-white" : "bg-white text-[#33465E] hover:bg-[#FFF2CC] hover:text-brand"
    }`;

  const dica =
    tipo === "concurso"
      ? "Vagas para cargos efetivos: a pessoa aprovada é nomeada no quadro permanente."
      : tipo === "processo"
        ? "Contratação temporária, por prazo determinado."
        : "Concurso público: cargo efetivo. Processo seletivo: contratação temporária.";

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <div className="inline-flex overflow-hidden rounded-md border border-[#D7DEE6]" role="group" aria-label="Tipo de certame">
            <button type="button" onClick={() => setTipo("")} className={segmento(tipo === "")} aria-pressed={tipo === ""}>
              Todos
            </button>
            <button type="button" onClick={() => setTipo(tipo === "concurso" ? "" : "concurso")} className={`${segmento(tipo === "concurso")} border-l border-[#D7DEE6]`} aria-pressed={tipo === "concurso"}>
              Concurso público
            </button>
            <button type="button" onClick={() => setTipo(tipo === "processo" ? "" : "processo")} className={`${segmento(tipo === "processo")} border-l border-[#D7DEE6]`} aria-pressed={tipo === "processo"}>
              Processo seletivo
            </button>
          </div>
          <p className="min-w-0 flex-1 text-[12.5px] leading-snug text-[#516278]">{dica}</p>
          <select
            value={esfera}
            onChange={(e) => setEsfera(e.target.value)}
            aria-label="Filtrar por âmbito"
            className="rounded-md border border-[#D7DEE6] bg-white px-3 py-2 text-[13.5px] font-semibold text-[#33465E] transition-colors hover:border-accent hover:bg-[#FFF7E3]"
          >
            <option value="">Todos os âmbitos</option>
            {ESFERAS.map((e) => (
              <option key={e.valor} value={e.valor}>
                {e.rotulo}
              </option>
            ))}
          </select>
          {comBusca && (
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar notícia"
              aria-label="Buscar notícia"
              className="w-full min-w-0 rounded-md border border-[#D7DEE6] bg-white px-3 py-2 text-[13.5px] text-[#14213A] sm:w-48"
            />
          )}
        </div>

        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filtrar por estado">
          <button
            type="button"
            onClick={() => { setUf(""); setFederal(false); }}
            className={chipUf(!uf && !federal, false)}
            aria-pressed={!uf && !federal}
          >
            Todos os estados
          </button>
          <button
            type="button"
            onClick={() => { setFederal(!federal); setUf(""); }}
            className={chipUf(federal, false)}
            aria-pressed={federal}
            title="Concursos de órgãos federais, de todo o país"
          >
            Federal
          </button>
          <span aria-hidden className="mx-1 w-px self-stretch bg-[#D7DEE6]" />
          {UFS.map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => { setUf(uf === u ? "" : u); setFederal(false); }}
              className={chipUf(!federal && uf === u, !ufsComPosts.has(u))}
              aria-pressed={!federal && uf === u}
            >
              {u}
            </button>
          ))}
        </div>
      </div>

      {filtrados.length === 0 ? (
        <p className="border border-dashed border-[#C4CEDA] bg-white px-6 py-12 text-center text-[15px] text-[#516278]">
          {posts.length === 0
            ? "Ainda não publicamos nenhuma notícia por aqui. Volte em breve!"
            : "Nenhuma notícia encontrada com esses filtros."}
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
