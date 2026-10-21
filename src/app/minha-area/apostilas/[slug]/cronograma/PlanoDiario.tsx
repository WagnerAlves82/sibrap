"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { marcarItemPlanoAction } from "./planoActions";

export type ItemTela = { id: string; numero: number; titulo: string; minutos: number };
export type DiaTela = { data: string; rotulo: string; tipo: "estudo" | "revisao"; itens: ItemTela[]; minutos: number };

function duracao(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

// Plano de estudos do aluno: o servidor já distribuiu os capítulos que faltam pelos dias até a prova.
// Ao concluir um capítulo, a página recalcula (revalidatePath) e o plano se ajusta sozinho.
export function PlanoDiario({
  slug,
  dias,
  concluidos,
  total,
}: {
  slug: string;
  dias: DiaTela[];
  concluidos: string[];
  total: number;
}) {
  const [feitos, setFeitos] = useState(() => new Set(concluidos));
  const [, iniciar] = useTransition();
  const base = `/minha-area/apostilas/${slug}`;
  const hoje = dias[0];
  const proximos = dias.slice(1);

  function alternar(id: string) {
    const novo = !feitos.has(id);
    setFeitos((prev) => {
      const n = new Set(prev);
      if (novo) n.add(id);
      else n.delete(id);
      return n;
    });
    iniciar(async () => {
      const r = await marcarItemPlanoAction(slug, id, novo);
      if ("erro" in r) {
        setFeitos((prev) => {
          const n = new Set(prev);
          if (novo) n.delete(id);
          else n.add(id);
          return n;
        });
      }
    });
  }

  function Item({ it }: { it: ItemTela }) {
    const feito = feitos.has(it.id);
    return (
      <li className="flex items-center gap-3 px-4 py-3">
        <button
          type="button"
          onClick={() => alternar(it.id)}
          aria-label={feito ? `Desmarcar capítulo ${it.numero}` : `Marcar capítulo ${it.numero} como estudado`}
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 ${
            feito ? "border-accent-2 bg-accent-2 text-white" : "border-[#C3CDD8] text-transparent hover:border-accent-2"
          }`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="m5 13 4 4L19 7" />
          </svg>
        </button>
        <div className="min-w-0 flex-1">
          <p className={`text-[14.5px] font-semibold leading-snug ${feito ? "text-[#7A8A99] line-through" : "text-[#14213A]"}`}>
            Cap. {it.numero}. {it.titulo}
          </p>
          <p className="font-data text-[11.5px] text-[#94A3B8]">~{duracao(it.minutos)}</p>
        </div>
        <Link href={`${base}/ler/${it.numero}`} className="shrink-0 rounded-md border border-brand px-3 py-1.5 text-[12.5px] font-bold text-brand hover:bg-brand/5">
          Ler
        </Link>
      </li>
    );
  }

  const feitosTotal = feitos.size;
  const pct = total > 0 ? Math.round((feitosTotal / total) * 100) : 0;

  return (
    <div>
      <div className="rounded-xl border border-[#D7DEE6] bg-white p-5">
        <div className="flex items-center justify-between">
          <p className="text-[13px] font-bold text-[#33465E]">Seu avanço na apostila</p>
          <p className="font-data text-[13px] text-[#516278]">
            {feitosTotal} de {total} capítulos · <strong className="text-[#14213A]">{pct}%</strong>
          </p>
        </div>
        <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-[#E7EEF4]">
          <div className="h-full rounded-full bg-brand transition-[width] duration-500" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {hoje && (
        <section className="mt-6" aria-label="Estudo de hoje">
          <h2 className="font-display text-[1.15rem] font-extrabold text-[#14213A]">Hoje, {hoje.rotulo}</h2>
          {hoje.tipo === "revisao" ? (
            <p className="mt-2 rounded-xl border border-[#D7DEE6] bg-white p-4 text-[14px] text-[#516278]">
              Dia de revisão: refaça os resumos dos capítulos e treine no simulado.
            </p>
          ) : hoje.itens.length === 0 ? (
            <p className="mt-2 rounded-xl border border-[#D7DEE6] bg-white p-4 text-[14px] text-[#516278]">
              Hoje não há capítulo novo. Aproveite para praticar no simulado e revisar o que já estudou.
            </p>
          ) : (
            <ul className="mt-2 divide-y divide-[#EEF1F5] overflow-hidden rounded-xl border border-[#D7DEE6] bg-white">
              {hoje.itens.map((it) => (
                <Item key={it.id} it={it} />
              ))}
            </ul>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Link href={`${base}/simulado`} className="inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-3 text-[14.5px] font-bold text-white hover:brightness-125">
              Praticar com o simulado <span aria-hidden>→</span>
            </Link>
            {hoje.minutos > 0 && <span className="font-data text-[12.5px] text-[#516278]">Estudo de hoje: ~{duracao(hoje.minutos)}</span>}
          </div>
        </section>
      )}

      {proximos.length > 0 && (
        <section className="mt-8" aria-label="Próximos dias">
          <h2 className="font-display text-[1.15rem] font-extrabold text-[#14213A]">Próximos dias</h2>
          <div className="mt-2 flex flex-col gap-2">
            {proximos.map((d) => (
              <details key={d.data} className="group rounded-xl border border-[#D7DEE6] bg-white">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
                  <span className="text-[14px] font-semibold text-[#14213A]">{d.rotulo}</span>
                  <span className="font-data text-[12px] text-[#516278]">
                    {d.tipo === "revisao"
                      ? "Revisão e simulado"
                      : d.itens.length === 0
                        ? "Praticar"
                        : `${d.itens.length} ${d.itens.length === 1 ? "capítulo" : "capítulos"} · ~${duracao(d.minutos)}`}
                  </span>
                </summary>
                {d.itens.length > 0 && (
                  <ul className="divide-y divide-[#EEF1F5] border-t border-[#EEF1F5]">
                    {d.itens.map((it) => (
                      <Item key={it.id} it={it} />
                    ))}
                  </ul>
                )}
              </details>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
