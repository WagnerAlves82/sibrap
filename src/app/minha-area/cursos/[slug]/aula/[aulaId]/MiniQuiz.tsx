"use client";

import { useState } from "react";
import { conferirMiniquizAction, type ResultadoMiniquiz } from "./actions";

type Alternativa = { letra: string; texto: string };
export type QuestaoMini = {
  questao_id: string;
  ordem: number;
  enunciado: string;
  alternativas: Alternativa[];
};

type Resposta = ResultadoMiniquiz & { marcada: string };

// Exercício de fixação: resposta e explicação na hora, sem nota e sem
// bloquear nada. Serve para o aluno perceber o que ficou.
export function MiniQuiz({ questoes }: { questoes: QuestaoMini[] }) {
  const [respostas, setRespostas] = useState<Record<string, Resposta>>({});
  const [carregando, setCarregando] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function responder(q: QuestaoMini, letra: string) {
    if (respostas[q.questao_id] || carregando) return;
    setCarregando(q.questao_id);
    setErro(null);
    const r = await conferirMiniquizAction(q.questao_id, letra);
    setCarregando(null);
    if ("erro" in r) {
      setErro(r.erro);
      return;
    }
    setRespostas((atual) => ({ ...atual, [q.questao_id]: { ...r, marcada: letra } }));
  }

  const respondidas = Object.keys(respostas).length;
  const acertos = Object.values(respostas).filter((r) => r.correta).length;

  return (
    <div className="flex flex-col gap-5">
      {questoes.map((q) => {
        const r = respostas[q.questao_id];
        return (
          <div key={q.questao_id} className="rounded-xl border border-[#D7DEE6] bg-white p-5">
            <p className="text-[15.5px] font-semibold leading-relaxed text-[#14213A]">
              <span className="mr-2 font-data text-xs text-[#93A0AF]">{q.ordem}.</span>
              {q.enunciado}
            </p>
            <div role="radiogroup" className="mt-3 flex flex-col gap-2">
              {q.alternativas.map((alt) => {
                const correta = r && alt.letra === r.gabarito;
                const errada = r && alt.letra === r.marcada && !r.correta;
                return (
                  <button
                    key={alt.letra}
                    type="button"
                    role="radio"
                    aria-checked={r?.marcada === alt.letra}
                    disabled={!!r || carregando === q.questao_id}
                    onClick={() => responder(q, alt.letra)}
                    className={`rounded-lg border px-4 py-2.5 text-left text-[14.5px] transition-colors ${
                      correta
                        ? "border-accent-2 bg-[#EAF6F2] text-[#0B5A4D]"
                        : errada
                          ? "border-[#E8B4B4] bg-[#FBEDED] text-[#8A1F1F]"
                          : r
                            ? "border-[#E7EDF3] text-[#93A0AF]"
                            : "border-[#D7DEE6] text-[#516278] hover:border-[#93A0AF]"
                    }`}
                  >
                    <strong className="mr-1">{alt.letra})</strong> {alt.texto}
                    {correta && " ✓"}
                  </button>
                );
              })}
            </div>
            {r && (
              <p className={`mt-3 text-[13.5px] leading-relaxed ${r.correta ? "text-[#0B5A4D]" : "text-[#8A1F1F]"}`}>
                <strong>{r.correta ? "Isso mesmo! " : "Quase! "}</strong>
                {r.comentario}
              </p>
            )}
          </div>
        );
      })}
      {erro && (
        <p role="alert" className="text-sm text-[#B3261E]">
          {erro}
        </p>
      )}
      {respondidas === questoes.length && (
        <p className="font-data text-sm text-[#516278]">
          Você acertou {acertos} de {questoes.length}.
        </p>
      )}
    </div>
  );
}
