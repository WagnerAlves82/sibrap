"use client";

import { useState } from "react";
import Link from "next/link";
import { Alert } from "@/components/alert";
import {
  iniciarSimuladoAction,
  finalizarSimuladoAction,
  desempenhoSimuladoAction,
  type QuestaoSimulado,
  type ResultadoSimulado,
  type DesempenhoDisciplina,
} from "@/app/minha-area/simulado/actions";

type Fase = "intro" | "carregando" | "quiz" | "enviando" | "resultado" | "erro";

export function SimuladoApostilaApp({
  produtoId,
  cargoId,
  tituloApostila,
  slugApostila,
}: {
  produtoId: string;
  cargoId: string;
  tituloApostila: string;
  slugApostila: string;
}) {
  const [fase, setFase] = useState<Fase>("intro");
  const [questoes, setQuestoes] = useState<QuestaoSimulado[]>([]);
  const [respostas, setRespostas] = useState<Record<string, string>>({});
  const [indice, setIndice] = useState(0);
  const [resultado, setResultado] = useState<ResultadoSimulado | null>(null);
  const [desempenho, setDesempenho] = useState<DesempenhoDisciplina[]>([]);
  const [erro, setErro] = useState<string | null>(null);

  const areaHref = `/minha-area/apostilas/${slugApostila}`;

  function reiniciar() {
    setQuestoes([]);
    setRespostas({});
    setIndice(0);
    setResultado(null);
    setDesempenho([]);
    setErro(null);
    setFase("intro");
  }

  async function comecar() {
    setFase("carregando");
    const r = await iniciarSimuladoAction(produtoId, cargoId);
    if ("erro" in r) {
      setErro(r.erro);
      setFase("erro");
      return;
    }
    if (r.questoes.length === 0) {
      setErro("Ainda não há questões suficientes cadastradas. Tente novamente mais tarde.");
      setFase("erro");
      return;
    }
    setQuestoes(r.questoes);
    setRespostas({});
    setIndice(0);
    setFase("quiz");
  }

  function responder(letra: string) {
    const atual = questoes[indice];
    setRespostas((prev) => ({ ...prev, [atual.questao_id]: letra }));
  }

  async function finalizar() {
    setFase("enviando");
    const tentativaId = questoes[0].tentativa_id;
    const r = await finalizarSimuladoAction(tentativaId, respostas);
    if ("erro" in r) {
      setErro(r.erro);
      setFase("erro");
      return;
    }
    setResultado(r.resultado);

    const d = await desempenhoSimuladoAction(tentativaId);
    if (!("erro" in d)) {
      setDesempenho(d.desempenho);
    }
    setFase("resultado");
  }

  if (fase === "intro") {
    return (
      <Cartao>
        <Link href={areaHref} className="text-[13px] font-semibold text-brand underline underline-offset-4">
          ← Voltar pra apostila
        </Link>
        <h1 className="mt-4 font-display text-2xl font-extrabold text-[#14213A]">Simulado online</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-[#516278]">
          {tituloApostila} — questões sorteadas do banco a cada tentativa, na proporção real da prova. No
          final você vê sua nota e o desempenho por matéria.
        </p>
        <Alert variant="info" claro className="mt-4">
          Pode refazer quantas vezes quiser — as questões mudam a cada tentativa.
        </Alert>
        <button
          onClick={comecar}
          className="mt-6 w-full rounded-lg bg-brand px-5 py-3.5 text-[15px] font-bold text-white transition-colors hover:brightness-125"
        >
          Começar simulado
        </button>
      </Cartao>
    );
  }

  if (fase === "carregando") {
    return (
      <Cartao>
        <p className="text-[14px] text-[#516278]">Preparando suas questões...</p>
      </Cartao>
    );
  }

  if (fase === "erro") {
    return (
      <Cartao>
        <Alert variant="erro" claro>
          {erro}
        </Alert>
        <button onClick={reiniciar} className="mt-6 text-[13.5px] font-semibold text-brand underline underline-offset-4">
          Voltar
        </button>
      </Cartao>
    );
  }

  if (fase === "quiz" || fase === "enviando") {
    const atual = questoes[indice];
    const respostaAtual = respostas[atual.questao_id];
    const todasRespondidas = questoes.every((q) => respostas[q.questao_id]);

    return (
      <Cartao>
        <div className="mb-4 flex items-center justify-between font-data text-[11.5px] text-[#516278]">
          <span>{atual.disciplina_nome}</span>
          <span>
            Questão {indice + 1} de {questoes.length}
          </span>
        </div>

        {atual.inspirada_em && (
          <p className="mb-2 font-data text-[11px] font-bold uppercase tracking-wide text-accent-2">
            {atual.inspirada_em}
          </p>
        )}

        <p className="whitespace-pre-line text-[15px] leading-relaxed text-[#14213A]">{atual.enunciado}</p>

        {atual.diagrama_svg && (
          <div
            className="my-4 rounded-md border border-[#D7DEE6] bg-white p-4"
            dangerouslySetInnerHTML={{ __html: atual.diagrama_svg }}
          />
        )}

        <div className="mt-5 flex flex-col gap-2">
          {atual.alternativas.map((alt) => {
            const selecionada = respostaAtual === alt.letra;
            return (
              <button
                key={alt.letra}
                onClick={() => responder(alt.letra)}
                className={`rounded-lg border px-4 py-3 text-left text-[14px] transition-colors ${
                  selecionada
                    ? "border-brand bg-[#EEF3F8] text-[#14213A]"
                    : "border-[#D7DEE6] bg-white text-[#33465E] hover:border-[#B9CBDF]"
                }`}
              >
                <span className="mr-2 font-bold">{alt.letra})</span>
                {alt.texto}
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={() => setIndice((i) => Math.max(0, i - 1))}
            disabled={indice === 0}
            className="flex-1 rounded-lg border border-[#D7DEE6] px-4 py-2.5 text-[13.5px] font-semibold text-[#33465E] transition-colors hover:border-[#B9CBDF] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Anterior
          </button>
          {indice < questoes.length - 1 ? (
            <button
              onClick={() => setIndice((i) => i + 1)}
              disabled={!respostaAtual}
              className="flex-1 rounded-lg bg-brand px-4 py-2.5 text-[13.5px] font-bold text-white transition-colors hover:brightness-125 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Próxima
            </button>
          ) : (
            <button
              onClick={finalizar}
              disabled={!todasRespondidas || fase === "enviando"}
              className="flex-1 rounded-lg bg-brand px-4 py-2.5 text-[13.5px] font-bold text-white transition-colors hover:brightness-125 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {fase === "enviando" ? "Corrigindo..." : "Finalizar simulado"}
            </button>
          )}
        </div>

        {indice === questoes.length - 1 && !todasRespondidas && (
          <Alert variant="aviso" claro className="mt-3 justify-center text-center">
            Responda todas as questões antes de finalizar.
          </Alert>
        )}
      </Cartao>
    );
  }

  // fase === "resultado"
  return (
    <Cartao>
      <p className="font-data text-[11.5px] uppercase tracking-wide text-[#516278]">{tituloApostila}</p>
      <p className="mt-1 font-display text-3xl font-extrabold text-[#14213A]">
        {resultado!.acertos} de {resultado!.total} corretas
      </p>
      <p className="mt-1 text-[14px] text-[#516278]">Nota: {resultado!.nota.toFixed(1)}</p>

      {desempenho.length > 0 && (
        <div className="mt-6">
          <p className="mb-2 text-[14px] font-bold text-[#14213A]">Desempenho por disciplina</p>
          <div className="flex flex-col gap-2">
            {desempenho.map((d) => (
              <div
                key={d.disciplina_nome}
                className="flex items-center justify-between rounded-lg border border-[#D7DEE6] bg-white px-4 py-2.5 text-[13.5px]"
              >
                <span className="text-[#33465E]">{d.disciplina_nome}</span>
                <span className="font-data font-bold text-[#14213A]">
                  {d.acertos}/{d.total}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 flex flex-col gap-3">
        <button
          onClick={comecar}
          className="w-full rounded-lg bg-brand px-4 py-3 text-center text-[14px] font-bold text-white transition-colors hover:brightness-125"
        >
          Refazer o simulado
        </button>
        <Link
          href={areaHref}
          className="text-center text-[13.5px] font-semibold text-brand underline underline-offset-4"
        >
          Voltar pra apostila
        </Link>
      </div>
    </Cartao>
  );
}

function Cartao({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border border-[#D7DEE6] bg-white p-6 sm:p-8">{children}</div>;
}
