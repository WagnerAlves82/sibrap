"use client";

import { useState } from "react";
import Link from "next/link";
import { Alert } from "@/components/alert";
import {
  iniciarSimuladoGratisAction,
  finalizarSimuladoGratisAction,
  type QuestaoGratis,
  type ResultadoSimuladoGratis,
} from "./actions";

type Fase = "intro" | "carregando" | "quiz" | "enviando" | "resultado" | "erro";

export function SimuladoGratisApp() {
  const [fase, setFase] = useState<Fase>("intro");
  const [questoes, setQuestoes] = useState<QuestaoGratis[]>([]);
  const [respostas, setRespostas] = useState<Record<string, string>>({});
  const [indice, setIndice] = useState(0);
  const [resultado, setResultado] = useState<ResultadoSimuladoGratis | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function comecar() {
    setFase("carregando");
    const r = await iniciarSimuladoGratisAction();
    if ("erro" in r) {
      setErro(r.erro);
      setFase("erro");
      return;
    }
    if (r.questoes.length === 0) {
      setErro("Não há questões de amostra disponíveis no momento.");
      setFase("erro");
      return;
    }
    setQuestoes(r.questoes);
    setIndice(0);
    setFase("quiz");
  }

  function responder(letra: string) {
    const atual = questoes[indice];
    setRespostas((prev) => ({ ...prev, [atual.questao_id]: letra }));
  }

  async function avancar() {
    if (indice < questoes.length - 1) {
      setIndice((i) => i + 1);
      return;
    }

    setFase("enviando");
    const tentativaId = questoes[0].tentativa_id;
    const r = await finalizarSimuladoGratisAction(tentativaId, respostas);
    if ("erro" in r) {
      setErro(r.erro);
      setFase("erro");
      return;
    }
    setResultado(r.resultado);
    setFase("resultado");
  }

  if (fase === "intro") {
    return (
      <Cartao>
        <h1 className="text-xl font-bold text-white">Simulado grátis</h1>
        <p className="mt-3 text-sm text-zinc-400">
          10 questões inéditas no estilo da banca Cesgranrio: 5 de Língua
          Portuguesa e 5 de Matemática e Raciocínio Lógico, baseadas no
          edital do concurso Transpetro 2026.
        </p>
        <Alert variant="aviso" className="mt-4">
          Essa amostra grátis só pode ser feita uma vez por conta — capriche
          nas respostas.
        </Alert>
        <button
          onClick={comecar}
          className="mt-6 w-full rounded-md bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-500"
        >
          Começar amostra grátis
        </button>
      </Cartao>
    );
  }

  if (fase === "carregando") {
    return (
      <Cartao>
        <p className="text-sm text-zinc-400">Preparando suas questões...</p>
      </Cartao>
    );
  }

  if (fase === "erro") {
    return (
      <Cartao>
        <Alert variant="erro">{erro}</Alert>
        <Link
          href="/minha-area"
          className="mt-6 inline-block text-sm text-blue-500 underline"
        >
          Voltar
        </Link>
      </Cartao>
    );
  }

  if (fase === "quiz" || fase === "enviando") {
    const atual = questoes[indice];
    const respostaAtual = respostas[atual.questao_id];

    return (
      <Cartao wide>
        <div className="mb-4 flex items-center justify-between text-xs text-zinc-500">
          <span>{atual.disciplina_nome}</span>
          <span>
            Questão {indice + 1} de {questoes.length}
          </span>
        </div>

        {atual.inspirada_em && (
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-blue-500">
            {atual.inspirada_em}
          </p>
        )}
        <p className="whitespace-pre-line text-white">{atual.enunciado}</p>

        {atual.diagrama_svg && (
          <div
            className="my-4 rounded-md bg-white p-4"
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
                className={`rounded-md border px-4 py-3 text-left text-sm transition-colors ${
                  selecionada
                    ? "border-blue-500 bg-blue-950/40 text-white"
                    : "border-zinc-700 bg-zinc-800 text-zinc-200 hover:border-zinc-600"
                }`}
              >
                <span className="mr-2 font-semibold">{alt.letra})</span>
                {alt.texto}
              </button>
            );
          })}
        </div>

        <button
          onClick={avancar}
          disabled={!respostaAtual || fase === "enviando"}
          className="mt-6 w-full rounded-md bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {fase === "enviando"
            ? "Corrigindo..."
            : indice < questoes.length - 1
              ? "Próxima questão"
              : "Finalizar simulado"}
        </button>
      </Cartao>
    );
  }

  // fase === "resultado"
  return (
    <Cartao wide>
      <p className="text-sm uppercase tracking-wide text-zinc-500">Resultado</p>
      <p className="mt-1 text-3xl font-bold text-white">
        {resultado!.acertos} de {resultado!.total} corretas
      </p>
      <p className="mt-1 text-sm text-zinc-400">
        Nota: {resultado!.nota.toFixed(1)}
      </p>

      <div className="mt-8 rounded-lg border border-blue-700/50 bg-blue-950/30 p-6">
        <p className="font-semibold text-blue-400">Sibrap Premium — R$ 29,90</p>
        <p className="mt-3 text-sm text-zinc-300">
          Para prosseguir na sua preparação, o sibrap tem uma oferta
          especial: por apenas R$ 29,90 (pagamento único), você tem acesso
          a todo o material premium — apostila completa incluindo
          Conhecimentos Específicos, vídeo-aulas e o simulado completo
          (banco de questões com simulação de acordo com o perfil da banca
          Cesgranrio).
        </p>
        <Link
          href="/minha-area/premium"
          className="mt-5 inline-block w-full rounded-md bg-blue-600 px-4 py-3 text-center font-medium text-white transition-colors hover:bg-blue-500"
        >
          Assinar Premium
        </Link>
      </div>
    </Cartao>
  );
}

function Cartao({
  children,
  wide,
}: {
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div
      className={`w-full rounded-lg border border-zinc-800 bg-zinc-900 p-8 ${
        wide ? "max-w-xl" : "max-w-md"
      }`}
    >
      {children}
    </div>
  );
}
