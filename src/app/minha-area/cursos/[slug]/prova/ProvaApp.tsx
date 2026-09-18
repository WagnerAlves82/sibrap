"use client";

import { useState } from "react";
import Link from "next/link";
import { Alert } from "@/components/alert";
import { BarraProgresso } from "@/components/reveal";
import {
  finalizarProvaAction,
  iniciarProvaAction,
  revisaoProvaAction,
  type ItemRevisao,
  type QuestaoProva,
  type ResultadoProva,
} from "./actions";

type Fase = "intro" | "carregando" | "prova" | "enviando" | "resultado" | "erro";

const BOTAO =
  "rounded-lg bg-accent px-6 py-3 text-[15px] font-bold text-accent-ink transition-colors hover:brightness-105 disabled:opacity-50";

function Cartao({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[#D7DEE6] bg-white p-6 sm:p-8">{children}</div>
  );
}

export function ProvaApp({
  cursoId,
  cursoHref,
  totalQuestoes,
  notaMinima,
}: {
  cursoId: string;
  cursoHref: string;
  totalQuestoes: number;
  notaMinima: number;
}) {
  const [fase, setFase] = useState<Fase>("intro");
  const [questoes, setQuestoes] = useState<QuestaoProva[]>([]);
  const [respostas, setRespostas] = useState<Record<string, string>>({});
  const [indice, setIndice] = useState(0);
  const [resultado, setResultado] = useState<ResultadoProva | null>(null);
  const [revisao, setRevisao] = useState<ItemRevisao[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function comecar() {
    setFase("carregando");
    setRespostas({});
    setRevisao(null);
    const r = await iniciarProvaAction(cursoId);
    if ("erro" in r) {
      setErro(r.erro);
      setFase("erro");
      return;
    }
    setQuestoes(r.questoes);
    setIndice(0);
    setFase("prova");
  }

  async function avancar() {
    if (indice < questoes.length - 1) {
      setIndice((i) => i + 1);
      return;
    }
    setFase("enviando");
    const r = await finalizarProvaAction(questoes[0].tentativa_id, respostas);
    if ("erro" in r) {
      setErro(r.erro);
      setFase("erro");
      return;
    }
    setResultado(r.resultado);
    setFase("resultado");
  }

  async function verGabarito() {
    const r = await revisaoProvaAction(questoes[0].tentativa_id);
    if ("itens" in r) setRevisao(r.itens);
  }

  if (fase === "intro" || fase === "carregando") {
    return (
      <Cartao>
        <h1 className="font-display text-2xl font-extrabold text-[#14213A]">Prova final</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-[#516278]">
          {totalQuestoes} questões de múltipla escolha sobre tudo o que você
          aprendeu. Para ser aprovado(a), é preciso acertar pelo menos{" "}
          {notaMinima}%. Se não passar, pode refazer com outras questões.
        </p>
        <button onClick={comecar} disabled={fase === "carregando"} className={`mt-6 ${BOTAO}`}>
          {fase === "carregando" ? "Carregando..." : "Começar a prova"}
        </button>
        <Link href={cursoHref} className="mt-4 block text-[14px] font-semibold text-brand underline underline-offset-4">
          Voltar ao curso
        </Link>
      </Cartao>
    );
  }

  if (fase === "erro") {
    return (
      <Cartao>
        <Alert variant="erro" claro className="text-sm">
          {erro}
        </Alert>
        <Link href={cursoHref} className={`mt-5 inline-block ${BOTAO}`}>
          Voltar ao curso
        </Link>
      </Cartao>
    );
  }

  if (fase === "enviando") {
    return (
      <Cartao>
        <p className="text-[#516278]">Corrigindo sua prova...</p>
      </Cartao>
    );
  }

  if (fase === "resultado" && resultado) {
    return (
      <div className="flex flex-col gap-5">
        <Cartao>
          <p className="font-data text-xs font-semibold uppercase tracking-wide text-[#516278]">
            Resultado
          </p>
          <p className="mt-2 font-data text-5xl font-semibold text-[#14213A]">
            {Number(resultado.nota).toFixed(0)}%
          </p>
          <p className="mt-1 text-[15px] text-[#516278]">
            {resultado.acertos} de {resultado.total} questões corretas
          </p>
          {resultado.aprovado ? (
            <Alert variant="sucesso" claro className="mt-5 text-sm">
              Parabéns, você foi aprovado(a)! Agora é só emitir o seu certificado.
            </Alert>
          ) : (
            <Alert variant="aviso" claro className="mt-5 text-sm">
              A nota mínima é {resultado.nota_minima}%. Revise as aulas e tente
              de novo — você pode refazer a prova quantas vezes precisar.
            </Alert>
          )}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            {resultado.aprovado ? (
              <Link href={`${cursoHref}/certificado`} className={BOTAO}>
                Ir para o certificado →
              </Link>
            ) : (
              <button onClick={comecar} className={BOTAO}>
                Refazer a prova
              </button>
            )}
            {!revisao && (
              <button onClick={verGabarito} className="text-[14px] font-semibold text-brand underline underline-offset-4">
                Ver gabarito comentado
              </button>
            )}
            <Link href={cursoHref} className="text-[14px] font-semibold text-brand underline underline-offset-4">
              Voltar ao curso
            </Link>
          </div>
        </Cartao>

        {revisao?.map((item) => (
          <Cartao key={item.ordem}>
            <p className="font-data text-xs text-[#93A0AF]">Questão {item.ordem}</p>
            <p className="mt-2 text-[15.5px] font-semibold leading-relaxed text-[#14213A]">
              {item.enunciado}
            </p>
            <ul className="mt-4 flex flex-col gap-2">
              {item.alternativas.map((alt) => {
                const correta = alt.letra === item.gabarito;
                const marcada = alt.letra === item.marcada;
                return (
                  <li
                    key={alt.letra}
                    className={`rounded-lg border px-4 py-2.5 text-[14.5px] ${
                      correta
                        ? "border-accent-2 bg-[#EAF6F2] text-[#0B5A4D]"
                        : marcada
                          ? "border-[#E8B4B4] bg-[#FBEDED] text-[#8A1F1F]"
                          : "border-[#E7EDF3] text-[#516278]"
                    }`}
                  >
                    <strong>{alt.letra})</strong> {alt.texto}
                    {correta && " ✓"}
                    {marcada && !correta && " (sua resposta)"}
                  </li>
                );
              })}
            </ul>
            {item.comentario && (
              <p className="mt-3 text-[13.5px] leading-relaxed text-[#516278]">
                {item.comentario}
              </p>
            )}
          </Cartao>
        ))}
      </div>
    );
  }

  // fase === "prova"
  const atual = questoes[indice];
  const marcada = respostas[atual.questao_id];
  const ultima = indice === questoes.length - 1;

  return (
    <Cartao>
      <div className="flex items-center justify-between font-data text-xs text-[#516278]">
        <span>
          Questão {indice + 1} de {questoes.length}
        </span>
      </div>
      <BarraProgresso percentual={((indice + 1) / questoes.length) * 100} className="mt-2" />

      <p className="mt-6 text-[16.5px] font-semibold leading-relaxed text-[#14213A]">
        {atual.enunciado}
      </p>

      <div role="radiogroup" className="mt-5 flex flex-col gap-2.5">
        {atual.alternativas.map((alt) => (
          <button
            key={alt.letra}
            type="button"
            role="radio"
            aria-checked={marcada === alt.letra}
            onClick={() => setRespostas((r) => ({ ...r, [atual.questao_id]: alt.letra }))}
            className={`rounded-lg border px-4 py-3 text-left text-[15px] transition-colors ${
              marcada === alt.letra
                ? "border-accent bg-[#FBF5E4] text-[#14213A]"
                : "border-[#D7DEE6] text-[#516278] hover:border-[#93A0AF]"
            }`}
          >
            <strong className="mr-1 text-[#14213A]">{alt.letra})</strong> {alt.texto}
          </button>
        ))}
      </div>

      <button onClick={avancar} disabled={!marcada} className={`mt-6 ${BOTAO}`}>
        {ultima ? "Finalizar prova" : "Próxima questão →"}
      </button>
    </Cartao>
  );
}
