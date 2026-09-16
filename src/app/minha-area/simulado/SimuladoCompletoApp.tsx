"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Alert } from "@/components/alert";
import {
  iniciarSimuladoAction,
  finalizarSimuladoAction,
  desempenhoSimuladoAction,
  type QuestaoSimulado,
  type ResultadoSimulado,
  type DesempenhoDisciplina,
} from "./actions";

type Cargo = {
  id: string;
  nome: string;
  quadro: string | null;
  conteudoCompleto: boolean;
};

type Fase =
  | "escolher-cargo"
  | "intro"
  | "carregando"
  | "quiz"
  | "enviando"
  | "resultado"
  | "erro";

export function SimuladoCompletoApp({
  produtoId,
  cargos,
}: {
  produtoId: string;
  cargos: Cargo[];
}) {
  const [fase, setFase] = useState<Fase>("escolher-cargo");
  const [cargoId, setCargoId] = useState<string | null>(null);
  const [questoes, setQuestoes] = useState<QuestaoSimulado[]>([]);
  const [respostas, setRespostas] = useState<Record<string, string>>({});
  const [indice, setIndice] = useState(0);
  const [resultado, setResultado] = useState<ResultadoSimulado | null>(null);
  const [desempenho, setDesempenho] = useState<DesempenhoDisciplina[]>([]);
  const [erro, setErro] = useState<string | null>(null);

  const cargoSelecionado = useMemo(
    () => cargos.find((c) => c.id === cargoId) ?? null,
    [cargos, cargoId]
  );

  const cargosTerra = cargos.filter((c) => c.quadro === "Terra");
  const cargosMar = cargos.filter((c) => c.quadro === "Mar");

  function reiniciar() {
    setCargoId(null);
    setQuestoes([]);
    setRespostas({});
    setIndice(0);
    setResultado(null);
    setDesempenho([]);
    setErro(null);
    setFase("escolher-cargo");
  }

  async function comecar() {
    if (!cargoId) return;
    setFase("carregando");
    const r = await iniciarSimuladoAction(produtoId, cargoId);
    if ("erro" in r) {
      setErro(r.erro);
      setFase("erro");
      return;
    }
    if (r.questoes.length === 0) {
      setErro(
        "Ainda não há questões cadastradas para esse cargo. Escolha outro ou tente novamente mais tarde."
      );
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

  // fase: escolher-cargo
  if (fase === "escolher-cargo") {
    return (
      <Cartao wide>
        <h1 className="text-xl font-bold text-white">Simulado completo</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Escolha o cargo pra montar um simulado com a proporção real de
          questões da prova (Português, Matemática e Conhecimentos
          Específicos).
        </p>

        {cargosTerra.length > 0 && (
          <GrupoCargos titulo="Quadro Terra" cargos={cargosTerra} cargoId={cargoId} onEscolher={setCargoId} />
        )}
        {cargosMar.length > 0 && (
          <GrupoCargos titulo="Quadro Mar" cargos={cargosMar} cargoId={cargoId} onEscolher={setCargoId} />
        )}

        <button
          onClick={() => setFase("intro")}
          disabled={!cargoId}
          className="mt-6 w-full rounded-md bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Continuar
        </button>
      </Cartao>
    );
  }

  if (fase === "intro") {
    return (
      <Cartao>
        <h1 className="text-xl font-bold text-white">
          {cargoSelecionado?.nome}
        </h1>
        <p className="mt-3 text-sm text-zinc-400">
          Você vai responder um simulado completo com questões de Português,
          Matemática e Conhecimentos Específicos dessa ênfase, no estilo da
          banca Cesgranrio.
        </p>
        <Alert variant="info" className="mt-4">
          Você pode refazer o simulado quantas vezes quiser — as questões são
          sorteadas do banco a cada tentativa.
        </Alert>
        {cargoSelecionado && !cargoSelecionado.conteudoCompleto && (
          <Alert variant="aviso" className="mt-3">
            O banco de Conhecimentos Específicos dessa ênfase ainda está em
            construção — o simulado pode vir com menos questões dessa parte
            do que o normal da prova.
          </Alert>
        )}
        <button
          onClick={comecar}
          className="mt-6 w-full rounded-md bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-500"
        >
          Começar simulado
        </button>
        <button
          onClick={reiniciar}
          className="mt-2 w-full text-sm text-zinc-500 underline hover:text-zinc-300"
        >
          Trocar cargo
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
        <button
          onClick={reiniciar}
          className="mt-6 text-sm text-blue-500 underline"
        >
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

        <div className="mt-6 flex gap-3">
          <button
            onClick={() => setIndice((i) => Math.max(0, i - 1))}
            disabled={indice === 0}
            className="flex-1 rounded-md border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Anterior
          </button>
          {indice < questoes.length - 1 ? (
            <button
              onClick={() => setIndice((i) => i + 1)}
              disabled={!respostaAtual}
              className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Próxima
            </button>
          ) : (
            <button
              onClick={finalizar}
              disabled={!todasRespondidas || fase === "enviando"}
              className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {fase === "enviando" ? "Corrigindo..." : "Finalizar simulado"}
            </button>
          )}
        </div>

        {indice === questoes.length - 1 && !todasRespondidas && (
          <Alert variant="aviso" className="mt-3 justify-center text-center">
            Responda todas as questões antes de finalizar.
          </Alert>
        )}
      </Cartao>
    );
  }

  // fase === "resultado"
  return (
    <Cartao wide>
      <p className="text-sm uppercase tracking-wide text-zinc-500">
        Resultado — {cargoSelecionado?.nome}
      </p>
      <p className="mt-1 text-3xl font-bold text-white">
        {resultado!.acertos} de {resultado!.total} corretas
      </p>
      <p className="mt-1 text-sm text-zinc-400">
        Nota: {resultado!.nota.toFixed(1)}
      </p>

      {desempenho.length > 0 && (
        <div className="mt-6">
          <p className="mb-2 text-sm font-semibold text-white">
            Desempenho por disciplina
          </p>
          <div className="flex flex-col gap-2">
            {desempenho.map((d) => (
              <div
                key={d.disciplina_nome}
                className="flex items-center justify-between rounded-md border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm"
              >
                <span className="text-zinc-300">{d.disciplina_nome}</span>
                <span className="text-zinc-400">
                  {d.acertos}/{d.total}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 flex flex-col gap-3">
        <button
          onClick={() => setFase("intro")}
          className="w-full rounded-md bg-blue-600 px-4 py-3 text-center font-medium text-white transition-colors hover:bg-blue-500"
        >
          Refazer esse simulado
        </button>
        <button
          onClick={reiniciar}
          className="w-full rounded-md border border-zinc-700 px-4 py-3 text-center text-sm font-medium text-zinc-300 hover:border-zinc-600"
        >
          Escolher outro cargo
        </button>
        <Link
          href="/minha-area"
          className="text-center text-sm text-zinc-500 underline hover:text-zinc-300"
        >
          Voltar pra minha área
        </Link>
      </div>
    </Cartao>
  );
}

function GrupoCargos({
  titulo,
  cargos,
  cargoId,
  onEscolher,
}: {
  titulo: string;
  cargos: Cargo[];
  cargoId: string | null;
  onEscolher: (id: string) => void;
}) {
  return (
    <div className="mt-5">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
        {titulo}
      </p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {cargos.map((c) => {
          const selecionado = cargoId === c.id;
          return (
            <button
              key={c.id}
              onClick={() => onEscolher(c.id)}
              className={`rounded-md border px-4 py-2 text-left text-sm transition-colors ${
                selecionado
                  ? "border-blue-500 bg-blue-950/40 text-white"
                  : "border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-600"
              }`}
            >
              {c.nome}
              {!c.conteudoCompleto && (
                <span className="ml-2 text-yellow-500" title="Conteúdo específico em construção">
                  ⚠
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
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
        wide ? "max-w-2xl" : "max-w-md"
      }`}
    >
      {children}
    </div>
  );
}
