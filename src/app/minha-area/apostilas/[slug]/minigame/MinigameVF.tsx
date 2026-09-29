"use client";

import { useState } from "react";
import Link from "next/link";
import { Alert } from "@/components/alert";
import { sortearPerguntasVFAction, type PerguntaVF } from "./actions";

type Fase = "intro" | "carregando" | "jogo" | "recompensa" | "erro";

export function MinigameVF({
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
  const [perguntas, setPerguntas] = useState<PerguntaVF[]>([]);
  const [rodada, setRodada] = useState(0);
  const [respondido, setRespondido] = useState(false);
  const [acertou, setAcertou] = useState(false);
  const [acertosTotal, setAcertosTotal] = useState(0);
  const [erro, setErro] = useState<string | null>(null);

  const areaHref = `/minha-area/apostilas/${slugApostila}`;

  function reiniciarEstado() {
    setPerguntas([]);
    setRodada(0);
    setRespondido(false);
    setAcertou(false);
    setAcertosTotal(0);
    setErro(null);
  }

  async function comecar() {
    reiniciarEstado();
    setFase("carregando");
    const r = await sortearPerguntasVFAction(produtoId, cargoId);
    if ("erro" in r) {
      setErro(r.erro);
      setFase("erro");
      return;
    }
    setPerguntas(r.perguntas);
    setFase("jogo");
  }

  function responder(escolhaVerdadeiro: boolean) {
    if (respondido) return;
    const atual = perguntas[rodada];
    const certo = escolhaVerdadeiro === atual.correta;
    setAcertou(certo);
    setRespondido(true);
    if (certo) setAcertosTotal((n) => n + 1);
  }

  function proxima() {
    if (rodada + 1 < perguntas.length) {
      setRodada((r) => r + 1);
      setRespondido(false);
    } else {
      setFase("recompensa");
    }
  }

  if (fase === "intro") {
    return (
      <Cartao>
        <Link href={areaHref} className="text-[13px] font-semibold text-brand underline underline-offset-4">
          ← Voltar pra apostila
        </Link>
        <p className="mt-4 font-data text-[11px] font-bold uppercase tracking-wide text-accent">
          Minigame · Verdadeiro ou falso relâmpago
        </p>
        <h1 className="mt-1.5 font-display text-2xl font-extrabold text-[#14213A]">{tituloApostila}</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-[#516278]">
          5 rodadas rápidas: a gente mostra um trecho de uma questão real e uma resposta — você diz se ela está
          certa ou errada. Sem nota, sem pressão, só pra fixar.
        </p>
        <Alert variant="info" claro className="mt-4">
          Pode jogar quantas vezes quiser — as perguntas mudam a cada rodada.
        </Alert>
        <button
          onClick={comecar}
          className="mt-6 w-full rounded-lg bg-brand px-5 py-3.5 text-[15px] font-bold text-white transition-colors hover:brightness-125"
        >
          Começar
        </button>
      </Cartao>
    );
  }

  if (fase === "carregando") {
    return (
      <Cartao>
        <p className="text-[14px] text-[#516278]">Sorteando as perguntas...</p>
      </Cartao>
    );
  }

  if (fase === "erro") {
    return (
      <Cartao>
        <Alert variant="erro" claro>
          {erro}
        </Alert>
        <button onClick={() => setFase("intro")} className="mt-6 text-[13.5px] font-semibold text-brand underline underline-offset-4">
          Voltar
        </button>
      </Cartao>
    );
  }

  if (fase === "jogo") {
    const atual = perguntas[rodada];
    return (
      <Cartao>
        <div className="mb-5 flex flex-col items-center gap-2.5">
          <p className="font-data text-[11px] font-bold uppercase tracking-wide text-accent">
            Verdadeiro ou falso relâmpago
          </p>
          <div className="flex gap-1.5">
            {perguntas.map((_, i) => (
              <span
                key={i}
                className={`h-2 w-2 rounded-full ${
                  i < rodada ? "bg-accent" : i === rodada ? "bg-brand" : "bg-[#D7DEE6]"
                }`}
              />
            ))}
          </div>
        </div>

        <p className="text-center text-[16px] font-bold leading-relaxed text-[#14213A]">{atual.enunciado}</p>
        <p className="mt-4 rounded-lg bg-surface-2 px-4 py-3.5 text-center text-[15px] text-[#33465E]">
          {atual.alternativa}
        </p>

        <div className="mt-5 flex gap-3">
          <button
            onClick={() => responder(true)}
            disabled={respondido}
            className={`flex-1 rounded-lg px-4 py-3.5 text-[15px] font-extrabold text-white transition-colors ${
              respondido
                ? atual.correta
                  ? "bg-accent-2"
                  : "bg-[#94A3B8]"
                : "bg-brand hover:brightness-125"
            }`}
          >
            Verdadeiro
          </button>
          <button
            onClick={() => responder(false)}
            disabled={respondido}
            className={`flex-1 rounded-lg px-4 py-3.5 text-[15px] font-extrabold text-white transition-colors ${
              respondido
                ? !atual.correta
                  ? "bg-accent-2"
                  : "bg-[#94A3B8]"
                : "bg-brand hover:brightness-125"
            }`}
          >
            Falso
          </button>
        </div>

        {respondido && (
          <p className={`mt-4 text-center text-[13.5px] font-bold ${acertou ? "text-accent-2" : "text-[#B23B3B]"}`}>
            {acertou ? "Isso aí!" : `Quase — o certo era "${atual.correta ? "Verdadeiro" : "Falso"}".`}
          </p>
        )}

        {respondido && (
          <button
            onClick={proxima}
            className="mt-4 w-full rounded-lg bg-[#14213A] px-4 py-3 text-[14px] font-bold text-white transition-colors hover:brightness-125"
          >
            {rodada + 1 < perguntas.length ? "Próxima →" : "Ver resultado →"}
          </button>
        )}
      </Cartao>
    );
  }

  // fase === "recompensa"
  return (
    <Cartao>
      <div className="relative mx-auto mb-4 h-[88px] w-[88px]">
        <span className="confete" style={{ "--dx": "-70px", background: "#b9862a", animationDelay: "0s" } as React.CSSProperties} />
        <span className="confete" style={{ "--dx": "-40px", background: "#0e7c6b", animationDelay: ".06s" } as React.CSSProperties} />
        <span className="confete" style={{ "--dx": "-14px", background: "#0b2a4a", animationDelay: ".12s" } as React.CSSProperties} />
        <span className="confete" style={{ "--dx": "14px", background: "#0e7c6b", animationDelay: ".04s" } as React.CSSProperties} />
        <span className="confete" style={{ "--dx": "40px", background: "#b9862a", animationDelay: ".1s" } as React.CSSProperties} />
        <span className="confete" style={{ "--dx": "70px", background: "#0b2a4a", animationDelay: ".16s" } as React.CSSProperties} />
        <svg className="medalha-pop" width="88" height="88" viewBox="0 0 88 88">
          <circle cx="44" cy="34" r="26" fill="#b9862a" />
          <circle cx="44" cy="34" r="26" fill="none" stroke="#ffffff" strokeWidth="3" />
          <path d="m32 34 8 8 16-16" fill="none" stroke="#ffffff" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M32 52 24 76l20-9 20 9-8-24" fill="#0e7c6b" />
        </svg>
      </div>

      <h2 className="recompensa-texto text-center font-display text-xl font-extrabold text-[#14213A]">
        Desafio concluído!
      </h2>
      <p className="recompensa-texto mt-2 text-center text-[14px] text-[#516278]">
        Você acertou {acertosTotal} de {perguntas.length}
      </p>

      <div className="recompensa-texto mt-7 flex flex-col gap-3">
        <button
          onClick={comecar}
          className="w-full rounded-lg bg-brand px-4 py-3.5 text-center text-[14px] font-bold text-white transition-colors hover:brightness-125"
        >
          Jogar de novo
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
