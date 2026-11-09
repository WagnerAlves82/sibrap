import Link from "next/link";
import type { Avaliacao } from "@/lib/redacao";
import { reescreverAction } from "../actions";

const virgula = (n: number) => String(n).replace(".", ",");

/** Texto com os trechos apontados na correção marcados (numerados como na lista). */
function TextoMarcado({ texto, trechos }: { texto: string; trechos: string[] }) {
  type Parte = { t: string; n?: number };
  let partes: Parte[] = [{ t: texto }];
  trechos.forEach((trecho, i) => {
    if (!trecho.trim()) return;
    const novas: Parte[] = [];
    let feito = false;
    for (const p of partes) {
      const pos = feito || p.n !== undefined ? -1 : p.t.indexOf(trecho);
      if (pos < 0) {
        novas.push(p);
        continue;
      }
      feito = true;
      novas.push({ t: p.t.slice(0, pos) }, { t: trecho, n: i + 1 }, { t: p.t.slice(pos + trecho.length) });
    }
    partes = novas;
  });
  return (
    <div className="whitespace-pre-wrap font-serif text-[16px] leading-[1.9] text-[#14213A]">
      {partes.map((p, i) =>
        p.n ? (
          <mark key={i} className="bg-[#FCE3C2] text-inherit">
            {p.t}
            <sup className="ml-0.5 font-data text-[10px] font-bold text-[#8A5A00]">{p.n}</sup>
          </mark>
        ) : (
          <span key={i}>{p.t}</span>
        )
      )}
    </div>
  );
}

export function ResultadoRedacao({
  id,
  tema,
  texto,
  banca,
  avaliacao: a,
}: {
  id: string;
  tema: string;
  texto: string;
  banca: string;
  avaliacao: Avaliacao;
}) {
  const pct = a.notaMax ? a.nota / a.notaMax : 0;
  const caixa = "border border-[#D7DEE6] bg-white p-5 sm:p-6";

  return (
    <div className="mt-3">
      <p className="font-data text-xs font-semibold uppercase tracking-[0.12em] text-accent-2">Correção · {banca}</p>
      <h1 className="mt-1 font-display text-2xl font-extrabold text-[#14213A] sm:text-3xl">{tema}</h1>

      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          <section className={caixa}>
            <div className="flex flex-wrap items-end gap-4">
              <p className="font-display text-6xl font-extrabold text-[#14213A]">
                {virgula(a.nota)}
                <span className="text-2xl text-[#8B97A8]">/{a.notaMax}</span>
              </p>
              <p className="pb-2 text-[14px] text-[#33465E]">≈ {a.linhas} linhas</p>
            </div>
            <div className="mt-3 h-2 bg-[#E7EEF4]">
              <div className="h-2" style={{ width: `${Math.round(pct * 100)}%`, background: pct >= 0.7 ? "#0E7C6B" : pct >= 0.5 ? "#E3A92B" : "#B42318" }} />
            </div>
            {a.abaixoDoMinimo && (
              <p className="mt-3 text-[14px] font-bold text-[#B42318]">
                Pela estimativa, o texto ficou abaixo do mínimo de linhas. Na prova, isso zera a redação: confira na folha.
              </p>
            )}
            {a.fugaAoTema && <p className="mt-3 text-[14px] font-bold text-[#B42318]">Fuga ao tema: releia a proposta antes de reescrever.</p>}
            <p className="mt-3 text-[15px] text-[#33465E]">{a.resumo}</p>
          </section>

          <section className={caixa}>
            <h2 className="font-display text-lg font-extrabold text-[#14213A]">Seu texto</h2>
            <div className="mt-3">
              <TextoMarcado texto={texto} trechos={a.melhorias.map((m) => m.trecho)} />
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-4">
          <section className={caixa}>
            <h2 className="font-display text-lg font-extrabold text-[#14213A]">Critérios</h2>
            <ul className="mt-3 space-y-4">
              {a.criterios.map((c) => (
                <li key={c.nome}>
                  <div className="flex justify-between text-[14px] font-bold text-[#14213A]">
                    <span>{c.nome}</span>
                    <span className="font-data">{virgula(c.nota)}/{c.max}</span>
                  </div>
                  <div className="mt-1 h-1.5 bg-[#E7EEF4]">
                    <div className="h-1.5 bg-brand" style={{ width: `${(c.nota / c.max) * 100}%` }} />
                  </div>
                  <p className="mt-1.5 text-[13.5px] text-[#516278]">{c.comentario}</p>
                </li>
              ))}
            </ul>
          </section>

          {a.pontosFortes.length > 0 && (
            <section className={caixa}>
              <h2 className="font-display text-lg font-extrabold text-[#14213A]">Pontos fortes</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-[14px] text-[#33465E]">
                {a.pontosFortes.map((p) => <li key={p}>{p}</li>)}
              </ul>
            </section>
          )}

          <section className={caixa}>
            <h2 className="font-display text-lg font-extrabold text-[#14213A]">O que melhorar</h2>
            <ol className="mt-3 space-y-3">
              {a.melhorias.map((m, i) => (
                <li key={i} className="border-l-[3px] border-accent pl-3 text-[14px]">
                  <p className="font-bold text-[#14213A]">
                    <span className="font-data text-[#8A5A00]">{i + 1}.</span> {m.problema}
                  </p>
                  {m.trecho && <p className="mt-0.5 text-[13px] italic text-[#8B97A8]">“{m.trecho}”</p>}
                  <p className="mt-1 text-[#0B5A4D]">{m.como_melhorar}</p>
                </li>
              ))}
            </ol>
          </section>

          {a.reescritaIntroducao && (
            <section className={caixa}>
              <h2 className="font-display text-lg font-extrabold text-[#14213A]">Sua introdução, nível nota máxima</h2>
              <p className="mt-2 font-serif text-[15px] leading-[1.8] text-[#33465E]">{a.reescritaIntroducao}</p>
            </section>
          )}

          <div className="flex flex-wrap gap-3">
            <form action={reescreverAction.bind(null, id)}>
              <button className="bg-accent px-5 py-2.5 text-[14.5px] font-bold text-accent-ink hover:brightness-105">
                Reescrever com as dicas
              </button>
            </form>
            <Link href="/minha-area/redacao" className="border border-brand px-5 py-2.5 text-[14.5px] font-bold text-brand">
              Nova redação
            </Link>
          </div>
          <p className="text-[12px] text-[#8B97A8]">Nota estimada por IA com a grade da banca. Serve de treino e pode variar da correção oficial.</p>
        </div>
      </div>
    </div>
  );
}
