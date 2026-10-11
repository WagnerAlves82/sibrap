"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Alert } from "@/components/alert";
import {
  iniciarSimuladoAction,
  abandonarSimuladoAction,
  type QuestaoRetomada,
  salvarRespostaSimuladoAction,
  parcialSimuladoAction,
  finalizarSimuladoAction,
  desempenhoSimuladoAction,
  type QuestaoSimulado,
  type ResultadoSimulado,
  type DesempenhoDisciplina,
  type ParcialDisciplina,
} from "@/app/minha-area/simulado/actions";

type Fase = "intro" | "carregando" | "quiz" | "enviando" | "resultado" | "erro";

export function SimuladoApostilaApp({
  produtoId,
  cargoId,
  tituloApostila,
  slugApostila,
  padrao,
  totalDisponivel,
  retomada,
}: {
  produtoId: string;
  cargoId: string;
  tituloApostila: string;
  slugApostila: string;
  /** quantidade da prova real (ex.: 30) */
  padrao: number;
  /** quantas questões o banco tem para esse cargo */
  totalDisponivel: number;
  /** simulado começado e não encerrado: a página já abre nele, na questão em que a pessoa parou */
  retomada: QuestaoRetomada[] | null;
}) {
  const [fase, setFase] = useState<Fase>(retomada ? "quiz" : "intro");
  const [questoes, setQuestoes] = useState<QuestaoSimulado[]>(retomada ?? []);
  const [respostas, setRespostas] = useState<Record<string, string>>(() => {
    const salvas: Record<string, string> = {};
    for (const q of retomada ?? []) if (q.resposta) salvas[q.questao_id] = q.resposta;
    return salvas;
  });
  const [indice, setIndiceEstado] = useState(() => {
    if (!retomada) return 0;
    const primeira = retomada.findIndex((q) => !q.resposta);
    return primeira === -1 ? 0 : primeira;
  });
  const [resultado, setResultado] = useState<ResultadoSimulado | null>(null);
  const [desempenho, setDesempenho] = useState<DesempenhoDisciplina[]>([]);
  const [parcial, setParcial] = useState<ParcialDisciplina[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [avisoSalvar, setAvisoSalvar] = useState(false);
  const [irPara, setIrPara] = useState("");

  // reabre na questão em que a pessoa estava (lida só no navegador, depois de montar)
  useEffect(() => {
    if (!retomada) return;
    const t = setTimeout(() => {
      const guardada = lerPosicao(retomada[0].tentativa_id);
      if (guardada !== null && guardada < retomada.length) setIndiceEstado(guardada);
    }, 0);
    return () => clearTimeout(t);
  }, [retomada]);

  // guarda a questão atual para a página reabrir exatamente onde a pessoa estava
  function setIndice(valor: number | ((i: number) => number)) {
    setIndiceEstado((atual) => {
      const novo = typeof valor === "function" ? valor(atual) : valor;
      if (questoes[0]) gravarPosicao(questoes[0].tentativa_id, novo);
      return novo;
    });
  }

  const maximo = Math.max(totalDisponivel, 1);
  const base = Math.min(padrao > 0 ? padrao : 30, maximo);
  const [quantidade, setQuantidade] = useState<number>(base);
  const [quantidadeTexto, setQuantidadeTexto] = useState<string>(String(base));

  const areaHref = `/minha-area/apostilas/${slugApostila}`;
  const opcoes = Array.from(new Set([base, 60, 120, 200].filter((n) => n <= maximo))).sort((a, b) => a - b);

  function escolher(n: number) {
    const v = Math.min(Math.max(Math.floor(n) || 1, 1), maximo);
    setQuantidade(v);
    setQuantidadeTexto(String(v));
  }

  function reiniciar() {
    setQuestoes([]);
    setRespostas({});
    setIndice(0);
    setResultado(null);
    setDesempenho([]);
    setParcial(null);
    setErro(null);
    setAvisoSalvar(false);
    setFase("intro");
  }

  async function comecar() {
    setFase("carregando");
    const r = await iniciarSimuladoAction(produtoId, cargoId, quantidade);
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
    setParcial(null);
    setFase("quiz");
  }

  function responder(letra: string) {
    const atual = questoes[indice];
    setRespostas((prev) => ({ ...prev, [atual.questao_id]: letra }));
    setParcial(null);
    salvarRespostaSimuladoAction(atual.tentativa_id, atual.questao_id, letra).then((r) => {
      setAvisoSalvar("erro" in r);
    });
  }

  async function descartar() {
    if (!window.confirm("Descartar este simulado e começar outro? As respostas dele serão perdidas.")) return;
    await abandonarSimuladoAction(questoes[0].tentativa_id);
    apagarPosicao(questoes[0].tentativa_id);
    reiniciar();
  }

  async function verParcial() {
    const r = await parcialSimuladoAction(questoes[0].tentativa_id);
    if ("erro" in r) {
      setErro(r.erro);
      return;
    }
    setParcial(r.parcial);
  }

  async function finalizar() {
    const respondidas = Object.keys(respostas).length;
    if (respondidas === 0) {
      setErro("Responda ao menos uma questão para ver o resultado.");
      return;
    }
    if (respondidas < questoes.length) {
      const ok = window.confirm(
        `Você respondeu ${respondidas} de ${questoes.length} questões. Encerrar agora? O resultado considera só as respondidas.`
      );
      if (!ok) return;
    }
    setErro(null);
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
          {tituloApostila}: questões sorteadas do banco a cada tentativa, na proporção da prova. Você escolhe
          quantas quer fazer, pode parar quando quiser para ver seus acertos e continuar depois de onde parou.
        </p>

        <p className="mt-6 text-[14px] font-bold text-[#14213A]">
          Quantas questões você quer fazer?
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {opcoes.map((n) => (
            <button
              key={n}
              onClick={() => escolher(n)}
              className={`rounded-lg border px-4 py-2 text-[13.5px] font-semibold transition-colors ${
                quantidade === n
                  ? "border-brand bg-brand text-white"
                  : "border-[#D7DEE6] bg-white text-[#33465E] hover:border-[#B9CBDF]"
              }`}
            >
              {n}
              {n === base ? " (como na prova)" : ""}
            </button>
          ))}
          {maximo > 1 && !opcoes.includes(maximo) && (
            <button
              onClick={() => escolher(maximo)}
              className={`rounded-lg border px-4 py-2 text-[13.5px] font-semibold transition-colors ${
                quantidade === maximo
                  ? "border-brand bg-brand text-white"
                  : "border-[#D7DEE6] bg-white text-[#33465E] hover:border-[#B9CBDF]"
              }`}
            >
              Todas ({maximo})
            </button>
          )}
        </div>
        <label className="mt-3 flex items-center gap-2 text-[13.5px] text-[#516278]">
          Ou digite:
          <input
            type="number"
            min={1}
            max={maximo}
            value={quantidadeTexto}
            onChange={(e) => {
              setQuantidadeTexto(e.target.value);
              const n = Math.floor(Number(e.target.value));
              if (n >= 1) setQuantidade(Math.min(n, maximo));
            }}
            onBlur={() => escolher(Number(quantidadeTexto))}
            className="w-24 rounded-lg border border-[#D7DEE6] px-3 py-2 text-[14px] text-[#14213A]"
          />
          <span>(de 1 a {maximo})</span>
        </label>

        <Alert variant="info" claro className="mt-4">
          As questões vêm na proporção de cada matéria na prova. Pode refazer quantas vezes quiser: elas mudam
          a cada tentativa.
        </Alert>
        <button
          onClick={comecar}
          className="mt-6 w-full rounded-lg bg-brand px-5 py-3.5 text-[15px] font-bold text-white transition-colors hover:brightness-125"
        >
          Começar simulado com {quantidade} {quantidade === 1 ? "questão" : "questões"}
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
    const respondidas = Object.keys(respostas).length;

    return (
      <Cartao>
        <div className="mb-1 flex items-center justify-between font-data text-[11.5px] text-[#516278]">
          <span>{atual.disciplina_nome}</span>
          <span>
            Questão {indice + 1} de {questoes.length}
          </span>
        </div>
        <div className="mb-4">
          <div className="h-1.5 overflow-hidden rounded-full bg-[#E7ECF2]">
            <div
              className="h-full rounded-full bg-accent-2 transition-all"
              style={{ width: `${(respondidas / questoes.length) * 100}%` }}
            />
          </div>
          <p className="mt-1 font-data text-[11px] text-[#516278]">
            {respondidas} de {questoes.length} respondidas
          </p>
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

        {avisoSalvar && (
          <Alert variant="aviso" claro className="mt-3">
            Não consegui salvar sua última resposta. Confira a internet; se fechar agora, ela pode não ficar guardada.
          </Alert>
        )}

        <div className="mt-6 flex gap-3">
          <button
            onClick={() => setIndice((i) => Math.max(0, i - 1))}
            disabled={indice === 0}
            className="flex-1 rounded-lg border border-[#D7DEE6] px-4 py-2.5 text-[13.5px] font-semibold text-[#33465E] transition-colors hover:border-[#B9CBDF] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Anterior
          </button>
          <button
            onClick={() => setIndice((i) => Math.min(questoes.length - 1, i + 1))}
            disabled={indice === questoes.length - 1}
            className="flex-1 rounded-lg bg-brand px-4 py-2.5 text-[13.5px] font-bold text-white transition-colors hover:brightness-125 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Próxima
          </button>
        </div>

        <div className="mt-4 flex items-center gap-2 text-[13px] text-[#516278]">
          <label htmlFor="ir-para">Ir para a questão</label>
          <input
            id="ir-para"
            type="number"
            min={1}
            max={questoes.length}
            value={irPara}
            onChange={(e) => setIrPara(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              const n = Math.floor(Number(irPara));
              if (n >= 1 && n <= questoes.length) setIndice(n - 1);
              setIrPara("");
            }}
            className="w-20 rounded-lg border border-[#D7DEE6] px-2 py-1.5 text-[13px] text-[#14213A]"
          />
          <span>(Enter)</span>
        </div>

        {parcial && (
          <div className="mt-5 rounded-lg border border-[#D7DEE6] bg-[#F7F9FC] p-4">
            <p className="text-[14px] font-bold text-[#14213A]">
              Até agora: {parcial.reduce((s, d) => s + d.acertos, 0)} acertos em{" "}
              {parcial.reduce((s, d) => s + d.respondidas, 0)} respondidas
            </p>
            <div className="mt-2 flex flex-col gap-1.5">
              {parcial
                .filter((d) => d.respondidas > 0)
                .map((d) => (
                  <div key={d.disciplina_nome} className="flex justify-between text-[13px] text-[#33465E]">
                    <span>{d.disciplina_nome}</span>
                    <span className="font-data font-bold">
                      {d.acertos}/{d.respondidas}
                    </span>
                  </div>
                ))}
            </div>
            <button
              onClick={() => setParcial(null)}
              className="mt-3 text-[13px] font-semibold text-brand underline underline-offset-4"
            >
              Continuar respondendo
            </button>
          </div>
        )}

        {erro && (
          <Alert variant="aviso" claro className="mt-3">
            {erro}
          </Alert>
        )}

        <div className="mt-6 flex flex-col gap-2 border-t border-[#E7ECF2] pt-5">
          <button
            onClick={verParcial}
            disabled={respondidas === 0}
            className="w-full rounded-lg border border-brand px-4 py-2.5 text-[13.5px] font-bold text-brand transition-colors hover:bg-brand/5 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Ver meus acertos até aqui
          </button>
          <button
            onClick={finalizar}
            disabled={fase === "enviando" || respondidas === 0}
            className="w-full rounded-lg bg-brand px-4 py-2.5 text-[13.5px] font-bold text-white transition-colors hover:brightness-125 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {fase === "enviando" ? "Corrigindo..." : "Encerrar e ver o resultado final"}
          </button>
          <Link
            href={areaHref}
            className="text-center text-[13px] font-semibold text-brand underline underline-offset-4"
          >
            Parar e continuar depois (suas respostas ficam salvas)
          </Link>
          <button
            onClick={descartar}
            className="text-center text-[12.5px] text-[#7A8AA0] underline underline-offset-4 hover:text-[#516278]"
          >
            Descartar este simulado e começar outro
          </button>
        </div>
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
      <p className="mt-1 text-[14px] text-[#516278]">
        Nota: {resultado!.nota.toFixed(1)}
        {resultado!.total < questoes.length && ` · você respondeu ${resultado!.total} de ${questoes.length} questões`}
      </p>

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
          onClick={reiniciar}
          className="w-full rounded-lg bg-brand px-4 py-3 text-center text-[14px] font-bold text-white transition-colors hover:brightness-125"
        >
          Fazer outro simulado
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

const chavePosicao = (tentativaId: string) => `sibrap_sim_pos_${tentativaId}`;

function lerPosicao(tentativaId: string): number | null {
  try {
    const v = localStorage.getItem(chavePosicao(tentativaId));
    return v === null ? null : Math.max(0, Math.floor(Number(v)) || 0);
  } catch {
    return null;
  }
}

function gravarPosicao(tentativaId: string, indice: number) {
  try {
    localStorage.setItem(chavePosicao(tentativaId), String(indice));
  } catch {
    // sem localStorage: ao reabrir, volta para a primeira questão sem resposta
  }
}

function apagarPosicao(tentativaId: string) {
  try {
    localStorage.removeItem(chavePosicao(tentativaId));
  } catch {
    // ignora
  }
}

function Cartao({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border border-[#D7DEE6] bg-white p-6 sm:p-8">{children}</div>;
}
