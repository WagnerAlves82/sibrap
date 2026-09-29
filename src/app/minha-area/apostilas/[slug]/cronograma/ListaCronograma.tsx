"use client";

import { useState, useTransition } from "react";
import { marcarTopicoCronogramaAction } from "./actions";

export type TopicoCronograma = {
  id: string;
  ordem: number;
  titulo: string;
  minutos: number;
  disciplina: string;
  concluido: boolean;
};

export function ListaCronograma({
  topicos,
  slugApostila,
}: {
  topicos: TopicoCronograma[];
  slugApostila: string;
}) {
  const [estado, setEstado] = useState(() => new Map(topicos.map((t) => [t.id, t.concluido])));
  const [, iniciarTransicao] = useTransition();

  function alternar(id: string) {
    const atual = estado.get(id) ?? false;
    const novo = !atual;
    setEstado((prev) => new Map(prev).set(id, novo));
    iniciarTransicao(async () => {
      const r = await marcarTopicoCronogramaAction(id, novo, slugApostila);
      if ("erro" in r) {
        // reverte se a chamada falhar
        setEstado((prev) => new Map(prev).set(id, atual));
      }
    });
  }

  const grupos: { disciplina: string; itens: TopicoCronograma[] }[] = [];
  for (const t of topicos) {
    const grupo = grupos.at(-1);
    if (grupo && grupo.disciplina === t.disciplina) {
      grupo.itens.push(t);
    } else {
      grupos.push({ disciplina: t.disciplina, itens: [t] });
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {grupos.map((g) => (
        <div key={g.disciplina}>
          <p className="mb-2 font-data text-[11px] font-bold uppercase tracking-wide text-accent-2">
            {g.disciplina}
          </p>
          <div className="overflow-hidden rounded-xl border border-[#D7DEE6] bg-white">
            {g.itens.map((t, i) => {
              const feito = estado.get(t.id) ?? false;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => alternar(t.id)}
                  className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
                    i > 0 ? "border-t border-[#EEF1F5]" : ""
                  } ${feito ? "bg-[#F6FBF9]" : "hover:bg-[#F9FAFB]"}`}
                >
                  <span
                    aria-hidden
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                      feito ? "border-accent-2 bg-accent-2 text-white" : "border-[#D7DEE6] text-transparent"
                    }`}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m5 13 4 4L19 7" />
                    </svg>
                  </span>
                  <span
                    className={`flex-1 text-[14px] ${feito ? "text-[#7A8A99] line-through" : "text-[#33465E]"}`}
                  >
                    {t.titulo}
                  </span>
                  <span className="shrink-0 font-data text-[11.5px] text-[#94A3B8]">~{t.minutos} min</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
