"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";

// Conteúdo interativo das aulas (coluna aulas.conteudo): textos, frases com áudio, cards que viram,
// abas, diálogos, áudios gravados e exercícios. Cada bloco "ativo" conta no placar do topo,
// para o aluno ver o próprio avanço dentro da aula e não só rolar a página.

export type Frase = { en: string; pt: string };
export type Bloco =
  | { tipo: "texto"; titulo?: string; paragrafos: string[] }
  | { tipo: "dica"; texto: string }
  | { tipo: "imagem"; src: string; alt: string; legenda?: string }
  | {
      tipo: "frases";
      titulo?: string;
      intro?: string;
      itens: Frase[];
      repetir?: boolean;
    }
  | {
      tipo: "audio";
      titulo: string;
      intro?: string;
      src: string;
      transcricao?: Frase[];
    }
  | {
      tipo: "cards";
      titulo?: string;
      intro?: string;
      itens: { frente: string; verso: string; icone?: string }[];
    }
  | {
      tipo: "abas";
      titulo?: string;
      intro?: string;
      abas: { titulo: string; itens: Frase[] }[];
    }
  | {
      tipo: "dialogos";
      titulo?: string;
      intro?: string;
      // escuta: o texto fica escondido até o aluno pedir (treino de listening)
      escuta?: boolean;
      dialogos: {
        titulo: string;
        falas: { quem: string; en: string; pt: string }[];
      }[];
    }
  | {
      tipo: "email";
      titulo?: string;
      intro?: string;
      assunto: string;
      linhas: Frase[];
    }
  | {
      tipo: "escolha";
      titulo?: string;
      contexto?: string;
      pergunta: string;
      opcoes: string[];
      correta: number;
      explicacao: string;
    }
  | {
      tipo: "vf";
      titulo?: string;
      intro?: string;
      itens: { texto: string; verdadeiro: boolean; explicacao: string }[];
    }
  | { tipo: "ordenar"; titulo?: string; intro?: string; itens: Frase[] }
  // vocabulário em Libras: cada palavra abre o vídeo do sinal no dicionário SpreadTheSign (Libras, pt-BR)
  | {
      tipo: "sinais";
      titulo?: string;
      intro?: string;
      grupos: {
        titulo: string;
        itens: (string | { t: string; url: string })[];
      }[];
    }
  // rotina para marcar item a item (ex.: abertura do turno na guarita)
  | { tipo: "checklist"; titulo?: string; intro?: string; itens: string[] }
  // passo a passo revelado etapa por etapa (fluxograma vertical)
  | { tipo: "fluxo"; titulo?: string; intro?: string; etapas: { titulo: string; texto: string; icone?: string }[] }
  // tela de sistema simulada (não é print de software real): o aluno preenche a partir do cenário e confirma
  | {
      tipo: "simulador";
      titulo?: string;
      intro?: string;
      sistema: string;
      cenario: string;
      campos: { rotulo: string; tipo: "texto" | "opcao"; opcoes?: string[]; correto?: string; placeholder?: string }[];
      acao: string;
      sucesso: string;
    }
  // jogo rápido "Libera ou barra?": situações em sequência, resposta em um toque e pontuação no fim
  | {
      tipo: "triagem";
      titulo?: string;
      intro?: string;
      opcoes: [string, string];
      casos: { situacao: string; certa: 0 | 1; explicacao: string }[];
    }
  // ligar os pares: toca num item da esquerda e depois no par da direita
  | { tipo: "associar"; titulo?: string; intro?: string; pares: { a: string; b: string }[] }
  // tabela comparativa; células "sim"/"não" viram ✓ verde e ✕ vermelho; "legenda" vai embaixo
  | { tipo: "tabela"; titulo?: string; intro?: string; colunas: string[]; linhas: string[][]; legenda?: string }
  // certo × errado lado a lado (postura, modelos de texto); "texto" mostra um documento, "itens" uma lista
  | {
      tipo: "comparar";
      titulo?: string;
      intro?: string;
      errado: { titulo: string; itens?: string[]; texto?: string };
      certo: { titulo: string; itens?: string[]; texto?: string };
    }
  // caça ao erro: o aluno toca nos trechos problemáticos de um texto; cada erro tem a explicação
  | { tipo: "caca"; titulo?: string; intro?: string; trechos: { t: string; erro?: string }[] }
  // cards de lei: fechados mostram artigo e nome; abertos mostram o texto, a pena, a aplicação na portaria e o link oficial
  | {
      tipo: "leis";
      titulo?: string;
      intro?: string;
      itens: { lei: string; artigo: string; nome: string; texto: string; pena?: string; portaria: string; url: string }[];
    }
  // calendário de escala: o aluno marca os dias de plantão do mês e confere; inicio = dia da semana do dia 1 (0 = domingo)
  | {
      tipo: "calendario";
      titulo?: string;
      intro?: string;
      mes: string;
      inicio: number;
      dias: number;
      plantoes: number[];
      feriados?: { dia: number; nome: string }[];
      explicacao?: string;
    }
  // ditado: ouve a frase (normal ou devagar) e escreve o que ouviu; a correção mostra palavra por palavra
  | { tipo: "ditado"; titulo?: string; intro?: string; itens: Frase[] }
  // fala: ouve, fala no microfone e o reconhecimento de voz do navegador confere a pronúncia
  | { tipo: "fala"; titulo?: string; intro?: string; itens: Frase[] };

// qualquer bloco pode ter "voz" própria (ex.: "en-US" para a pronúncia do alfabeto da OTAN num curso em português)
type ComVoz = { voz?: string | null };

const ATIVOS = new Set(["frases", "cards", "escolha", "vf", "ordenar", "dialogos", "sinais", "checklist", "fluxo", "simulador", "triagem", "associar", "caca", "leis", "calendario", "ditado", "fala"]);

const Placar = createContext<(id: string) => void>(() => {});
// idioma da voz do navegador (en-US no inglês); null = curso sem voz (ex.: Libras)
const Voz = createContext<string | null>("en-US");

function useConcluir(id: string) {
  const marcar = useContext(Placar);
  return useCallback(() => marcar(id), [marcar, id]);
}

// voz do navegador em inglês (funciona no Chrome, Edge, Safari e na maioria dos celulares);
// com várias falas, alterna duas vozes quando o aparelho tiver, para parecer uma conversa
function falar(texto: string | string[], idioma: string | null = "en-US", velocidade = 0.9) {
  if (!idioma || typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const vozes = window.speechSynthesis.getVoices().filter((v) => v.lang.startsWith(idioma.slice(0, 2)));
  window.speechSynthesis.cancel();
  (Array.isArray(texto) ? texto : [texto]).forEach((t, i) => {
    const u = new SpeechSynthesisUtterance(t);
    u.lang = idioma;
    u.rate = velocidade;
    const voz = vozes[vozes.length > 1 ? i % 2 : 0];
    if (voz) u.voice = voz;
    window.speechSynthesis.speak(u);
  });
}

function BotaoOuvir({ texto }: { texto: string }) {
  const idioma = useContext(Voz);
  // no servidor não há voz; no navegador, só mostra o botão se ele falar
  const tem = useSyncExternalStore(
    () => () => {},
    () => "speechSynthesis" in window,
    () => false,
  );
  if (!tem || !idioma) return null;
  return (
    <button
      type="button"
      onClick={() => falar(texto, idioma)}
      aria-label={`Ouvir: ${texto}`}
      className="flex h-8 w-8 shrink-0 items-center justify-center border border-[#D7DEE6] bg-white text-[16.5px] text-brand hover:border-brand"
    >
      🔊
    </button>
  );
}

function Caixa({ titulo, intro, children }: { titulo?: string; intro?: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      {titulo && <h2 className="font-display text-xl font-extrabold text-[#14213A]">{titulo}</h2>}
      {intro && <p className="mt-1 text-[16.5px] leading-relaxed text-[#516278]">{intro}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Texto({ b }: { b: Extract<Bloco, { tipo: "texto" }> }) {
  return (
    <Caixa titulo={b.titulo}>
      {b.paragrafos.map((p, i) => (
        <p key={i} className="mb-3 text-[17px] leading-relaxed text-[#14213A]">
          {p}
        </p>
      ))}
    </Caixa>
  );
}

function Frases({ b, id }: { b: Extract<Bloco, { tipo: "frases" }>; id: string }) {
  const concluir = useConcluir(id);
  const [feitas, setFeitas] = useState<Set<number>>(new Set());
  const marcar = (i: number) => {
    const n = new Set(feitas);
    if (n.has(i)) n.delete(i);
    else n.add(i);
    setFeitas(n);
    if (n.size === b.itens.length) concluir();
  };
  return (
    <Caixa titulo={b.titulo ?? (b.repetir ? "Speak up: ouça e repita" : "Frases úteis")} intro={b.intro}>
      {b.repetir && (
        <p className="mb-3 text-[15px] text-[#516278]">
          Toque em 🔊, repita a frase em voz alta e marque ✓. Não precisa acertar de primeira!
        </p>
      )}
      <ul className="border border-[#D7DEE6] bg-white">
        {b.itens.map((f, i) => (
          <li key={i} className="flex items-center gap-3 border-t border-[#EEF2F6] px-4 py-3 first:border-t-0">
            <BotaoOuvir texto={f.en} />
            <div className="min-w-0 flex-1">
              <p className="text-[17px] font-semibold text-[#14213A]">{f.en}</p>
              <p className="text-[15px] text-[#516278]">{f.pt}</p>
            </div>
            {b.repetir ? (
              <button
                type="button"
                onClick={() => marcar(i)}
                aria-pressed={feitas.has(i)}
                aria-label="Marcar como repetida"
                className={`h-8 w-8 shrink-0 border text-[15.5px] font-bold ${feitas.has(i) ? "border-accent-2 bg-accent-2 text-white" : "border-[#C4CEDA] bg-white text-[#C4CEDA]"}`}
              >
                ✓
              </button>
            ) : null}
          </li>
        ))}
      </ul>
      {!b.repetir && <MarcarLido id={id} />}
    </Caixa>
  );
}

function MarcarLido({ id }: { id: string }) {
  const concluir = useConcluir(id);
  const [ok, setOk] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        setOk(true);
        concluir();
      }}
      disabled={ok}
      className="mt-2 text-[15px] font-semibold text-brand underline underline-offset-4 disabled:text-accent-2 disabled:no-underline"
    >
      {ok ? "✓ Estudado" : "Já estudei estas frases"}
    </button>
  );
}

function Audio({ b }: { b: Extract<Bloco, { tipo: "audio" }> }) {
  const [ver, setVer] = useState(false);
  return (
    <Caixa titulo={b.titulo} intro={b.intro}>
      <div className="border border-[#D7DEE6] bg-white p-4">
        <audio controls preload="none" src={b.src} className="w-full">
          Seu navegador não toca áudio.
        </audio>
        {b.transcricao && (
          <>
            <button
              type="button"
              onClick={() => setVer(!ver)}
              className="mt-3 text-[15px] font-semibold text-brand underline underline-offset-4"
            >
              {ver ? "Esconder a transcrição" : "Ver a transcrição com tradução"}
            </button>
            {ver && (
              <ul className="mt-3 flex flex-col gap-2">
                {b.transcricao.map((f, i) => (
                  <li key={i} className="border-l-2 border-accent pl-3">
                    <p className="text-[16.5px] font-semibold text-[#14213A]">{f.en}</p>
                    <p className="text-[15px] text-[#516278]">{f.pt}</p>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </Caixa>
  );
}

function Cards({ b, id }: { b: Extract<Bloco, { tipo: "cards" }>; id: string }) {
  const concluir = useConcluir(id);
  const idioma = useContext(Voz);
  const [virados, setVirados] = useState<Set<number>>(new Set());
  const [vistos, setVistos] = useState<Set<number>>(new Set());
  const virar = (i: number) => {
    const n = new Set(virados);
    if (n.has(i)) n.delete(i);
    else n.add(i);
    setVirados(n);
    const v = new Set(vistos).add(i);
    setVistos(v);
    if (v.size === b.itens.length) concluir();
    if (!virados.has(i)) falar(b.itens[i].frente, idioma);
  };
  return (
    <Caixa
      titulo={b.titulo}
      intro={b.intro ?? (idioma ? "Toque nos cards para ver a tradução e ouvir a pronúncia." : "Toque nos cards para ver a resposta.")}
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {b.itens.map((c, i) => {
          const v = virados.has(i);
          return (
            <button key={i} type="button" onClick={() => virar(i)} aria-pressed={v} className="group h-32 [perspective:800px]">
              <span
                className={`relative block h-full w-full transition-transform duration-500 [transform-style:preserve-3d] motion-reduce:transition-none ${v ? "[transform:rotateY(180deg)]" : ""}`}
              >
                <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 border border-[#D7DEE6] bg-white p-3 [backface-visibility:hidden]">
                  {c.icone && (
                    <span className="text-3xl" aria-hidden>
                      {c.icone}
                    </span>
                  )}
                  <span className="text-center text-[16.5px] font-bold text-[#14213A]">{c.frente}</span>
                </span>
                <span className="absolute inset-0 flex flex-col items-center justify-center border border-brand bg-brand p-3 text-white [backface-visibility:hidden] [transform:rotateY(180deg)]">
                  <span className="text-center text-[16px] font-semibold leading-snug">{c.verso}</span>
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </Caixa>
  );
}

function Abas({ b }: { b: Extract<Bloco, { tipo: "abas" }> }) {
  const [atual, setAtual] = useState(0);
  return (
    <Caixa titulo={b.titulo} intro={b.intro}>
      <div role="tablist" className="flex flex-wrap gap-1">
        {b.abas.map((a, i) => (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={i === atual}
            onClick={() => setAtual(i)}
            className={`border px-3 py-2 text-[15px] font-semibold ${i === atual ? "border-brand bg-brand text-white" : "border-[#D7DEE6] bg-white text-[#14213A] hover:border-brand"}`}
          >
            {a.titulo}
          </button>
        ))}
      </div>
      <ul role="tabpanel" className="mt-2 border border-[#D7DEE6] bg-white">
        {b.abas[atual].itens.map((f, i) => (
          <li key={`${atual}-${i}`} className="flex items-center gap-3 border-t border-[#EEF2F6] px-4 py-2.5 first:border-t-0">
            <BotaoOuvir texto={f.en} />
            <div className="min-w-0 flex-1">
              <p className="text-[16.5px] font-semibold text-[#14213A]">{f.en}</p>
              <p className="text-[15px] text-[#516278]">{f.pt}</p>
            </div>
          </li>
        ))}
      </ul>
    </Caixa>
  );
}

function Dialogos({ b, id }: { b: Extract<Bloco, { tipo: "dialogos" }>; id: string }) {
  const concluir = useConcluir(id);
  const [atual, setAtual] = useState(0);
  const idioma = useContext(Voz);
  const [traducao, setTraducao] = useState(false);
  const [texto, setTexto] = useState(!b.escuta);
  const [lidos, setLidos] = useState<Set<number>>(new Set([0]));
  const abrir = (i: number) => {
    setAtual(i);
    if (b.escuta) setTexto(false);
    const n = new Set(lidos).add(i);
    setLidos(n);
    if (n.size === b.dialogos.length) concluir();
  };
  // com um diálogo só, conta quando o aluno ouve ou abre o texto/tradução
  const interagiu = () => {
    if (b.dialogos.length === 1) concluir();
  };
  const d = b.dialogos[atual];
  return (
    <Caixa titulo={b.titulo ?? "Diálogos"} intro={b.intro}>
      {b.dialogos.length > 1 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {b.dialogos.map((x, i) => (
            <button
              key={i}
              type="button"
              onClick={() => abrir(i)}
              className={`border px-3 py-2 text-[15px] font-semibold ${i === atual ? "border-brand bg-brand text-white" : "border-[#D7DEE6] bg-white text-[#14213A] hover:border-brand"}`}
            >
              {lidos.has(i) && i !== atual ? "✓ " : ""}
              {x.titulo}
            </button>
          ))}
        </div>
      )}
      <div className="border border-[#D7DEE6] bg-white p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="font-display text-[17.5px] font-extrabold text-[#14213A]">{d.titulo}</p>
          <div className="flex flex-wrap items-center gap-3">
            {idioma && (
              <button
                type="button"
                onClick={() => {
                  falar(
                    d.falas.map((f) => f.en),
                    idioma,
                  );
                  interagiu();
                }}
                className="bg-brand px-3 py-1.5 text-[14px] font-bold text-white"
              >
                ▶ Ouvir o diálogo
              </button>
            )}
            {b.escuta && (
              <button
                type="button"
                onClick={() => {
                  setTexto(!texto);
                  interagiu();
                }}
                className="text-[14px] font-semibold text-brand underline underline-offset-4"
              >
                {texto ? "Esconder o texto" : "Mostrar o texto"}
              </button>
            )}
            {texto && (
              <button
                type="button"
                onClick={() => {
                  setTraducao(!traducao);
                  interagiu();
                }}
                className="text-[14px] font-semibold text-brand underline underline-offset-4"
              >
                {traducao ? "Esconder tradução" : "Mostrar tradução"}
              </button>
            )}
          </div>
        </div>
        {!texto && (
          <p className="mb-3 bg-[#F6F9FC] px-3 py-2 text-[15px] text-[#516278]">
            🎧 Ouça primeiro sem ler. Tente entender as palavras-chave e só depois mostre o texto.
          </p>
        )}
        <ul className="flex flex-col gap-2.5">
          {d.falas.map((f, i) => (
            <li key={i} className="flex items-start gap-3">
              <BotaoOuvir texto={f.en} />
              <div className="min-w-0 flex-1">
                <p className="text-[16.5px] text-[#14213A]">
                  <strong className="font-bold">{f.quem}:</strong> {texto ? f.en : "• • •"}
                </p>
                {texto && traducao && <p className="text-[15px] text-[#516278]">{f.pt}</p>}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Caixa>
  );
}

// e-mail que "se escreve" sozinho, linha por linha, com a tradução embaixo
function Email({ b }: { b: Extract<Bloco, { tipo: "email" }> }) {
  const [n, setN] = useState(0);
  const [visivel, setVisivel] = useState(false);
  const caixa = useRef<HTMLDivElement>(null);
  // só começa a "escrever" quando o aluno chega no e-mail
  useEffect(() => {
    const el = caixa.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisivel(true);
          obs.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  useEffect(() => {
    if (!visivel || n >= b.linhas.length) return;
    const t = setTimeout(() => setN(n + 1), n === 0 ? 500 : 1100);
    return () => clearTimeout(t);
  }, [n, b.linhas.length, visivel]);
  return (
    <Caixa titulo={b.titulo} intro={b.intro}>
      <div ref={caixa} className="border border-[#D7DEE6] bg-white">
        <div className="flex items-center gap-2 border-b border-[#D7DEE6] bg-[#F6F9FC] px-4 py-2.5">
          <span aria-hidden>✉️</span>
          <p className="text-[15.5px] font-semibold text-[#14213A]">Subject: {b.assunto}</p>
        </div>
        <ul className="flex min-h-[120px] flex-col gap-2 px-4 py-4">
          {b.linhas.slice(0, n).map((f, i) => (
            <li key={i} className="animate-[rise-in_.5s_ease-out] motion-reduce:animate-none">
              <p className="text-[16.5px] text-[#14213A]">{f.en}</p>
              <p className="text-[13.5px] text-accent-2">{f.pt}</p>
            </li>
          ))}
          {n < b.linhas.length && <li className="h-4 w-2 animate-pulse bg-brand" aria-hidden />}
        </ul>
        {n >= b.linhas.length && (
          <button
            type="button"
            onClick={() => setN(0)}
            className="mb-3 ml-4 text-[14px] font-semibold text-brand underline underline-offset-4"
          >
            ↺ Ver de novo
          </button>
        )}
      </div>
    </Caixa>
  );
}

function Escolha({ b, id }: { b: Extract<Bloco, { tipo: "escolha" }>; id: string }) {
  const concluir = useConcluir(id);
  const [resp, setResp] = useState<number | null>(null);
  const certo = resp === b.correta;
  return (
    <Caixa titulo={b.titulo ?? "Agora é com você"}>
      <div className="border-2 border-accent bg-white p-5">
        {b.contexto && <p className="mb-2 text-[16px] leading-relaxed text-[#516278]">{b.contexto}</p>}
        <p className="text-[17px] font-semibold text-[#14213A]">{b.pergunta}</p>
        <div className="mt-3 flex flex-col gap-2">
          {b.opcoes.map((o, i) => {
            const marcada = resp === i;
            const cor =
              resp === null
                ? "border-[#D7DEE6] hover:border-brand"
                : i === b.correta
                  ? "border-accent-2 bg-[#E6F4F1]"
                  : marcada
                    ? "border-[#C0392B] bg-[#FBEAEA]"
                    : "border-[#D7DEE6] opacity-70";
            return (
              <button
                key={i}
                type="button"
                onClick={() => {
                  if (resp !== null && certo) return;
                  setResp(i);
                  if (i === b.correta) concluir();
                }}
                className={`border px-4 py-2.5 text-left text-[16.5px] text-[#14213A] ${cor}`}
              >
                {o}
              </button>
            );
          })}
        </div>
        {resp !== null && (
          <p className={`mt-3 text-[16px] ${certo ? "text-accent-2" : "text-[#C0392B]"}`}>
            <strong>{certo ? "Isso mesmo! " : "Ainda não. Tente outra opção. "}</strong>
            {certo && b.explicacao}
          </p>
        )}
      </div>
    </Caixa>
  );
}

function VerdadeiroFalso({ b, id }: { b: Extract<Bloco, { tipo: "vf" }>; id: string }) {
  const concluir = useConcluir(id);
  const [resp, setResp] = useState<Record<number, boolean>>({});
  const responder = (i: number, v: boolean) => {
    if (i in resp) return;
    const n = { ...resp, [i]: v };
    setResp(n);
    if (Object.keys(n).length === b.itens.length) concluir();
  };
  const acertos = b.itens.filter((it, i) => resp[i] === it.verdadeiro).length;
  const terminou = Object.keys(resp).length === b.itens.length;
  return (
    <Caixa titulo={b.titulo ?? "Verdadeiro ou falso?"} intro={b.intro}>
      <ul className="flex flex-col gap-2">
        {b.itens.map((it, i) => {
          const r = resp[i];
          const respondida = i in resp;
          return (
            <li key={i} className="border border-[#D7DEE6] bg-white p-4">
              <p className="text-[16.5px] text-[#14213A]">{it.texto}</p>
              <div className="mt-2 flex gap-2">
                {[true, false].map((v) => (
                  <button
                    key={String(v)}
                    type="button"
                    disabled={respondida}
                    onClick={() => responder(i, v)}
                    className={`border px-4 py-1.5 text-[15px] font-bold ${
                      !respondida
                        ? "border-[#D7DEE6] text-[#14213A] hover:border-brand"
                        : v === it.verdadeiro
                          ? "border-accent-2 bg-accent-2 text-white"
                          : r === v
                            ? "border-[#C0392B] bg-[#FBEAEA] text-[#C0392B]"
                            : "border-[#EEF2F6] text-[#93A0AF]"
                    }`}
                  >
                    {v ? "Verdadeiro" : "Falso"}
                  </button>
                ))}
              </div>
              {respondida && (
                <p className={`mt-2 text-[15px] ${r === it.verdadeiro ? "text-accent-2" : "text-[#C0392B]"}`}>
                  {r === it.verdadeiro ? "✓ Acertou. " : "✗ Não foi dessa vez. "}
                  {it.explicacao}
                </p>
              )}
            </li>
          );
        })}
      </ul>
      {terminou && (
        <p className="mt-3 font-display text-[17.5px] font-extrabold text-[#14213A]">
          Você acertou {acertos} de {b.itens.length}.{" "}
          {acertos === b.itens.length ? "Excelente! 🎉" : "Revise as explicações e siga em frente."}
        </p>
      )}
    </Caixa>
  );
}

function embaralhar<T>(lista: T[], semente: number) {
  const a = [...lista];
  let s = semente || 1;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// monte a frase em inglês tocando nas palavras na ordem certa
function Ordenar({ b, id }: { b: Extract<Bloco, { tipo: "ordenar" }>; id: string }) {
  const concluir = useConcluir(id);
  const [i, setI] = useState(0);
  const [montada, setMontada] = useState<number[]>([]);
  const [feitas, setFeitas] = useState(0);
  const item = b.itens[i];
  const palavras = useMemo(() => item?.en.split(" ") ?? [], [item]);
  const ordem = useMemo(() => {
    let o = embaralhar(
      palavras.map((_, k) => k),
      palavras.length * 7 + i + 3,
    );
    if (o.every((v, k) => v === k) && o.length > 1) o = [...o.slice(1), o[0]];
    return o;
  }, [palavras, i]);
  if (!item) return null;
  const tentativa = montada.map((k) => palavras[k]).join(" ");
  const completa = montada.length === palavras.length;
  const certa = completa && tentativa === item.en;
  const proxima = () => {
    const n = feitas + 1;
    setFeitas(n);
    if (n === b.itens.length) concluir();
    if (i + 1 < b.itens.length) {
      setI(i + 1);
      setMontada([]);
    } else setI(b.itens.length);
  };
  return (
    <Caixa titulo={b.titulo ?? "Monte a frase"} intro={b.intro ?? "Toque nas palavras na ordem certa para formar a frase em inglês."}>
      <div className="border-2 border-accent bg-white p-5">
        <p className="font-data text-xs font-semibold uppercase tracking-wide text-[#93A0AF]">
          Frase {i + 1} de {b.itens.length}
        </p>
        <p className="mt-1 text-[16.5px] text-[#516278]">“{item.pt}”</p>
        <div className="mt-3 flex min-h-[46px] flex-wrap gap-1.5 border-b-2 border-[#D7DEE6] pb-2">
          {montada.map((k, n) => (
            <button
              key={n}
              type="button"
              onClick={() => !certa && setMontada(montada.filter((_, x) => x !== n))}
              className="border border-brand bg-brand px-2.5 py-1.5 text-[16.5px] font-semibold text-white"
            >
              {palavras[k]}
            </button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {ordem.map((k) =>
            montada.includes(k) ? null : (
              <button
                key={k}
                type="button"
                onClick={() => setMontada([...montada, k])}
                className="border border-[#C4CEDA] bg-white px-2.5 py-1.5 text-[16.5px] font-semibold text-[#14213A] hover:border-brand"
              >
                {palavras[k]}
              </button>
            ),
          )}
        </div>
        {completa && (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <p className={`text-[16px] font-semibold ${certa ? "text-accent-2" : "text-[#C0392B]"}`}>
              {certa ? "✓ Perfeito!" : "Quase! Toque nas palavras de cima para desfazer e tente de novo."}
            </p>
            {certa && (
              <>
                <BotaoOuvir texto={item.en} />
                <button type="button" onClick={proxima} className="bg-accent px-4 py-2 text-[15.5px] font-bold text-accent-ink">
                  {i + 1 < b.itens.length ? "Próxima frase →" : "Concluir"}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </Caixa>
  );
}

function Concluido({ b }: { b: Extract<Bloco, { tipo: "ordenar" }> }) {
  return (
    <Caixa titulo={b.titulo ?? "Monte a frase"}>
      <p className="border border-accent-2 bg-[#E6F4F1] p-4 text-[16.5px] font-semibold text-accent-2">
        ✓ Você montou as {b.itens.length} frases. Muito bem!
      </p>
    </Caixa>
  );
}

function OrdenarOuConcluido({ b, id }: { b: Extract<Bloco, { tipo: "ordenar" }>; id: string }) {
  const [fim, setFim] = useState(false);
  const marcar = useContext(Placar);
  const concluir = useCallback(
    (x: string) => {
      marcar(x);
      setFim(true);
    },
    [marcar],
  );
  if (fim) return <Concluido b={b} />;
  return (
    <Placar.Provider value={concluir}>
      <Ordenar b={b} id={id} />
    </Placar.Provider>
  );
}

function Sinais({ b, id }: { b: Extract<Bloco, { tipo: "sinais" }>; id: string }) {
  const concluir = useConcluir(id);
  const [vistos, setVistos] = useState<Set<string>>(new Set());
  const total = b.grupos.reduce((s, g) => s + g.itens.length, 0);
  const rotulo = (x: string | { t: string }) => (typeof x === "string" ? x : x.t);
  const link = (x: string | { url: string }) =>
    typeof x === "string" ? `https://www.spreadthesign.com/pt.br/search/?q=${encodeURIComponent(x.toLowerCase())}` : x.url;
  const meta = Math.min(total, 6);
  const tocar = (palavra: string) => setVistos((v) => new Set(v).add(palavra));
  // conta no placar quando atinge a meta (mesmo com toques rápidos seguidos)
  useEffect(() => {
    if (vistos.size >= meta) concluir();
  }, [vistos, meta, concluir]);
  return (
    <Caixa
      titulo={b.titulo ?? "Veja os sinais"}
      intro={
        b.intro ??
        "Toque em cada palavra para ver o sinal em vídeo (abre o dicionário SpreadTheSign em outra aba; se aparecer uma lista, escolha a palavra exata). Observe a mão, o local, o movimento e o rosto, e repita."
      }
    >
      <div className="flex flex-col gap-3">
        {b.grupos.map((g) => (
          <div key={g.titulo} className="border border-[#D7DEE6] bg-white p-4">
            <p className="font-data text-xs font-semibold uppercase tracking-wide text-[#516278]">{g.titulo}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {g.itens.map((x) => {
                const p = rotulo(x);
                return (
                  <a
                    key={p}
                    href={link(x)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => tocar(p)}
                    className={`border px-3 py-1.5 text-[16.5px] font-semibold ${vistos.has(p) ? "border-accent-2 bg-[#E6F4F1] text-accent-2" : "border-[#C4CEDA] bg-white text-[#14213A] hover:border-brand"}`}
                  >
                    {vistos.has(p) ? "✓ " : ""}
                    {p}
                  </a>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[14px] text-[#516278]">
        {Math.min(vistos.size, meta)} de {meta} sinais vistos para concluir · Também vale consultar o{" "}
        <a
          href="https://www.ines.gov.br/dicionario-de-libras/"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-brand underline underline-offset-4"
        >
          Dicionário de Libras do INES
        </a>
      </p>
    </Caixa>
  );
}

function Checklist({ b, id }: { b: Extract<Bloco, { tipo: "checklist" }>; id: string }) {
  const concluir = useConcluir(id);
  const [feitos, setFeitos] = useState<Set<number>>(new Set());
  const marcar = (i: number) =>
    setFeitos((f) => {
      const n = new Set(f);
      if (n.has(i)) n.delete(i);
      else n.add(i);
      return n;
    });
  useEffect(() => {
    if (feitos.size === b.itens.length) concluir();
  }, [feitos, b.itens.length, concluir]);
  return (
    <Caixa titulo={b.titulo ?? "Checklist"} intro={b.intro ?? "Marque cada item, como se estivesse no seu turno."}>
      <ul className="border border-[#D7DEE6] bg-white">
        {b.itens.map((t, i) => (
          <li key={i} className="border-t border-[#EEF2F6] first:border-t-0">
            <button type="button" onClick={() => marcar(i)} aria-pressed={feitos.has(i)} className="flex w-full items-start gap-3 px-4 py-3 text-left">
              <span
                aria-hidden
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border text-[12px] font-bold ${feitos.has(i) ? "border-accent-2 bg-accent-2 text-white" : "border-[#C4CEDA] bg-white text-transparent"}`}
              >
                ✓
              </span>
              <span className={`text-[16.5px] ${feitos.has(i) ? "text-[#93A0AF] line-through" : "text-[#14213A]"}`}>{t}</span>
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-2 font-data text-[13.5px] text-[#516278]">
        {feitos.size} de {b.itens.length} itens
      </p>
    </Caixa>
  );
}

function Fluxo({ b, id }: { b: Extract<Bloco, { tipo: "fluxo" }>; id: string }) {
  const concluir = useConcluir(id);
  const [visiveis, setVisiveis] = useState(1);
  useEffect(() => {
    if (visiveis >= b.etapas.length) concluir();
  }, [visiveis, b.etapas.length, concluir]);
  return (
    <Caixa titulo={b.titulo ?? "Passo a passo"} intro={b.intro}>
      <ol className="flex flex-col">
        {b.etapas.slice(0, visiveis).map((e, i) => (
          <li key={i} className="flex flex-col items-stretch">
            {i > 0 && (
              <span aria-hidden className="mx-auto py-1 text-[18px] leading-none text-accent">
                ↓
              </span>
            )}
            <div className="flex gap-3 border border-[#D7DEE6] border-l-4 border-l-brand bg-white px-4 py-3 motion-safe:animate-[rise-in_.4s_ease-out]">
              <span className="font-data text-[14px] font-bold text-brand">{i + 1}</span>
              <div>
                <p className="text-[16.5px] font-bold text-[#14213A]">
                  {e.icone ? `${e.icone} ` : ""}
                  {e.titulo}
                </p>
                <p className="mt-0.5 text-[16px] leading-relaxed text-[#516278]">{e.texto}</p>
              </div>
            </div>
          </li>
        ))}
      </ol>
      {visiveis < b.etapas.length ? (
        <button type="button" onClick={() => setVisiveis((v) => v + 1)} className="mt-3 bg-brand px-4 py-2 text-[15.5px] font-bold text-white">
          Próxima etapa ({visiveis + 1} de {b.etapas.length}) ↓
        </button>
      ) : (
        <p className="mt-3 text-[15px] font-semibold text-accent-2">✓ Você viu o processo completo.</p>
      )}
    </Caixa>
  );
}

// Lê número no jeito brasileiro: "R$ 2.650,00", "2650", "8.910,10", "5%". Devolve null se não for número.
function lerNumero(s: string): number | null {
  let x = s.replace(/r\$|%|\s/gi, "");
  if (x.includes(",")) x = x.replace(/\./g, "").replace(",", ".");
  else if (/^-?\d{1,3}(\.\d{3})+$/.test(x)) x = x.replace(/\./g, "");
  if (!/^-?\d+(\.\d+)?$/.test(x)) return null;
  return Number(x);
}

// Respostas numéricas valem em qualquer formato ("2.650", "2650,00", "R$ 2.650"); as demais, sem diferenciar maiúsculas.
function respostaConfere(valor: string, correto: string): boolean {
  const a = lerNumero(valor);
  const b = lerNumero(correto);
  if (a !== null && b !== null) return Math.abs(a - b) < 0.005;
  return valor.trim().toLowerCase() === correto.trim().toLowerCase();
}

function Simulador({ b, id }: { b: Extract<Bloco, { tipo: "simulador" }>; id: string }) {
  const concluir = useConcluir(id);
  const [valores, setValores] = useState<string[]>(() => b.campos.map(() => ""));
  const [erro, setErro] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const confirmar = () => {
    for (const [i, c] of b.campos.entries()) {
      const v = valores[i].trim();
      if (!v) return setErro(`Preencha o campo "${c.rotulo}".`);
      if (c.tipo === "opcao" && c.correto && v !== c.correto) return setErro(`Confira "${c.rotulo}": releia o cenário com atenção.`);
      if (c.tipo === "texto" && c.correto && !respostaConfere(v, c.correto)) return setErro(`Confira "${c.rotulo}": o dado não bate com o cenário.`);
    }
    setErro(null);
    setOk(true);
    concluir();
  };
  return (
    <Caixa titulo={b.titulo ?? "Simulador"} intro={b.intro}>
      <p className="mb-2 border-l-4 border-accent bg-[#FBF5E4] px-4 py-3 text-[16px] leading-relaxed text-[#14213A]">
        <strong>Cenário:</strong> {b.cenario}
      </p>
      <div className="border border-[#14213A] bg-[#F6F9FC]">
        <div className="flex items-center justify-between bg-[#14213A] px-3 py-2 font-data text-[12px] text-white">
          <span>🖥️ {b.sistema}</span>
          <span className="text-[#93A0AF]">simulação · dados fictícios</span>
        </div>
        <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
          {b.campos.map((c, i) => (
            <label key={i} className="flex flex-col gap-1 text-[13.5px] font-semibold uppercase tracking-wide text-[#516278]">
              {c.rotulo}
              {c.tipo === "opcao" ? (
                <select
                  disabled={ok}
                  value={valores[i]}
                  onChange={(e) => setValores((v) => v.map((x, k) => (k === i ? e.target.value : x)))}
                  className="border border-[#C4CEDA] bg-white px-2 py-2 text-[16px] font-normal normal-case tracking-normal text-[#14213A]"
                >
                  <option value="">Selecione…</option>
                  {c.opcoes?.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              ) : (
                <input
                  disabled={ok}
                  value={valores[i]}
                  placeholder={c.placeholder}
                  onChange={(e) => setValores((v) => v.map((x, k) => (k === i ? e.target.value : x)))}
                  className="border border-[#C4CEDA] bg-white px-2 py-2 text-[16px] font-normal normal-case tracking-normal text-[#14213A]"
                />
              )}
            </label>
          ))}
        </div>
        <div className="border-t border-[#D7DEE6] px-4 py-3">
          {ok ? (
            <p className="text-[16px] font-semibold text-accent-2">✓ {b.sucesso}</p>
          ) : (
            <>
              <button type="button" onClick={confirmar} className="bg-accent-2 px-4 py-2 text-[15.5px] font-bold text-white">
                {b.acao}
              </button>
              {erro && <p className="mt-2 text-[15px] text-[#C0392B]">{erro}</p>}
            </>
          )}
        </div>
      </div>
    </Caixa>
  );
}

function Triagem({ b, id }: { b: Extract<Bloco, { tipo: "triagem" }>; id: string }) {
  const concluir = useConcluir(id);
  const [i, setI] = useState(0);
  const [resposta, setResposta] = useState<0 | 1 | null>(null);
  const [acertos, setAcertos] = useState(0);
  const fim = i >= b.casos.length;
  useEffect(() => {
    if (fim) concluir();
  }, [fim, concluir]);
  const caso = b.casos[i];
  const responder = (r: 0 | 1) => {
    if (resposta !== null) return;
    setResposta(r);
    if (r === caso.certa) setAcertos((a) => a + 1);
  };
  const estrelas = Math.round((acertos / b.casos.length) * 3);
  return (
    <Caixa titulo={b.titulo ?? "Desafio rápido"} intro={b.intro}>
      <div className="border-2 border-brand bg-white">
        <div className="flex items-center justify-between bg-brand px-4 py-2 font-data text-[13.5px] text-white">
          <span>{fim ? "Resultado" : `Situação ${i + 1} de ${b.casos.length}`}</span>
          <span>⭐ {acertos} {acertos === 1 ? "acerto" : "acertos"}</span>
        </div>
        {fim ? (
          <div className="px-5 py-6 text-center">
            <p className="text-[34px] leading-none" aria-label={`${estrelas} de 3 estrelas`}>
              {"★".repeat(estrelas)}
              <span className="text-[#D7DEE6]">{"★".repeat(3 - estrelas)}</span>
            </p>
            <p className="mt-2 font-display text-[19px] font-extrabold text-[#14213A]">
              {acertos} de {b.casos.length}{" "}
              {acertos === b.casos.length
                ? "— perfeito, nenhum golpe passou!"
                : acertos >= b.casos.length * 0.7
                  ? "— muito bem!"
                  : "— revise as explicações e tente de novo"}
            </p>
            <button
              type="button"
              onClick={() => {
                setI(0);
                setAcertos(0);
                setResposta(null);
              }}
              className="mt-3 text-[15px] font-semibold text-brand underline underline-offset-4"
            >
              ↺ Jogar de novo
            </button>
          </div>
        ) : (
          <div className="p-5">
            <p className="text-[17px] leading-relaxed text-[#14213A]">{caso.situacao}</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {b.opcoes.map((o, k) => {
                const marcada = resposta === k;
                const cor =
                  resposta === null
                    ? k === 0
                      ? "border-accent-2 text-accent-2 hover:bg-[#E6F4F1]"
                      : "border-[#C0392B] text-[#C0392B] hover:bg-[#FBEAEA]"
                    : k === caso.certa
                      ? "border-accent-2 bg-accent-2 text-white"
                      : marcada
                        ? "border-[#C0392B] bg-[#FBEAEA] text-[#C0392B]"
                        : "border-[#EEF2F6] text-[#93A0AF]";
                return (
                  <button key={k} type="button" onClick={() => responder(k as 0 | 1)} className={`border-2 px-3 py-3 text-[16.5px] font-bold ${cor}`}>
                    {o}
                  </button>
                );
              })}
            </div>
            {resposta !== null && (
              <div className="mt-3">
                <p className={`text-[16px] leading-relaxed ${resposta === caso.certa ? "text-accent-2" : "text-[#C0392B]"}`}>
                  <strong>{resposta === caso.certa ? "✓ Isso! " : "✗ Cuidado! "}</strong>
                  {caso.explicacao}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setI((x) => x + 1);
                    setResposta(null);
                  }}
                  className="mt-3 bg-accent px-4 py-2 text-[15.5px] font-bold text-accent-ink"
                >
                  {i + 1 < b.casos.length ? "Próxima situação →" : "Ver resultado"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </Caixa>
  );
}

function Associar({ b, id }: { b: Extract<Bloco, { tipo: "associar" }>; id: string }) {
  const concluir = useConcluir(id);
  const direita = useMemo(() => embaralhar(b.pares.map((_, k) => k), b.pares.length * 5 + 1), [b.pares]);
  const [escolhida, setEscolhida] = useState<number | null>(null);
  const [ligados, setLigados] = useState<Set<number>>(new Set());
  const [errado, setErrado] = useState<number | null>(null);
  useEffect(() => {
    if (ligados.size === b.pares.length) concluir();
  }, [ligados, b.pares.length, concluir]);
  const tocarDireita = (k: number) => {
    if (escolhida === null || ligados.has(k)) return;
    if (k === escolhida) {
      setLigados((l) => new Set(l).add(k));
      setEscolhida(null);
      setErrado(null);
    } else setErrado(k);
  };
  const base = "w-full border-2 px-3 py-2.5 text-left text-[15.5px] transition-colors";
  return (
    <Caixa titulo={b.titulo ?? "Ligue os pares"} intro={b.intro ?? "Toque num item da esquerda e depois no par certo da direita."}>
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-2">
          {b.pares.map((p, k) => (
            <button
              key={k}
              type="button"
              disabled={ligados.has(k)}
              onClick={() => {
                setEscolhida(k);
                setErrado(null);
              }}
              className={`${base} font-semibold ${ligados.has(k) ? "border-accent-2 bg-[#E6F4F1] text-accent-2" : escolhida === k ? "border-brand bg-brand text-white" : "border-[#D7DEE6] bg-white text-[#14213A] hover:border-brand"}`}
            >
              {ligados.has(k) ? "✓ " : ""}
              {p.a}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-2">
          {direita.map((k) => (
            <button
              key={k}
              type="button"
              disabled={ligados.has(k)}
              onClick={() => tocarDireita(k)}
              className={`${base} ${ligados.has(k) ? "border-accent-2 bg-[#E6F4F1] text-accent-2" : errado === k ? "border-[#C0392B] bg-[#FBEAEA] text-[#C0392B]" : "border-[#D7DEE6] bg-white text-[#14213A] hover:border-brand"}`}
            >
              {b.pares[k].b}
            </button>
          ))}
        </div>
      </div>
      <p className="mt-2 font-data text-[13.5px] text-[#516278]">
        {ligados.size === b.pares.length ? "✓ Todos os pares ligados!" : `${ligados.size} de ${b.pares.length} pares`}
      </p>
    </Caixa>
  );
}

function Tabela({ b }: { b: Extract<Bloco, { tipo: "tabela" }> }) {
  const celula = (v: string) => {
    if (v === "sim") return <span className="font-bold text-accent-2" aria-label="sim">✓</span>;
    if (v === "não") return <span className="font-bold text-[#C0392B]" aria-label="não">✕</span>;
    return v;
  };
  return (
    <Caixa titulo={b.titulo} intro={b.intro}>
      <div className="overflow-x-auto border border-[#D7DEE6] bg-white">
        <table className="w-full min-w-[520px] border-collapse text-left text-[15.5px]">
          <thead>
            <tr className="bg-brand text-white">
              {b.colunas.map((c) => (
                <th key={c} className="px-3 py-2.5 font-semibold">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {b.linhas.map((l, i) => (
              <tr key={i} className={i % 2 ? "bg-[#F6F9FC]" : "bg-white"}>
                {l.map((v, k) => (
                  <td key={k} className={`border-t border-[#EEF2F6] px-3 py-2.5 align-top ${k === 0 ? "font-semibold text-[#14213A]" : "text-[#33465E]"} ${v === "sim" || v === "não" ? "text-center text-[18px]" : ""}`}>
                    {celula(v)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {b.legenda && <p className="mt-2 text-[14px] leading-relaxed text-[#516278]">{b.legenda}</p>}
    </Caixa>
  );
}

function Comparar({ b }: { b: Extract<Bloco, { tipo: "comparar" }> }) {
  const lado = (l: { titulo: string; itens?: string[]; texto?: string }, certo: boolean) => (
    <div className={`border-2 bg-white ${certo ? "border-accent-2" : "border-[#C0392B]"}`}>
      <p className={`px-4 py-2 text-[15.5px] font-bold text-white ${certo ? "bg-accent-2" : "bg-[#C0392B]"}`}>
        {certo ? "✓ " : "✕ "}
        {l.titulo}
      </p>
      {l.texto && <p className="whitespace-pre-line px-4 py-3 font-data text-[14.5px] leading-relaxed text-[#14213A]">{l.texto}</p>}
      {l.itens && (
        <ul className="flex flex-col gap-1.5 px-4 py-3">
          {l.itens.map((t, i) => (
            <li key={i} className="flex gap-2 text-[16px] leading-relaxed text-[#14213A]">
              <span aria-hidden className={certo ? "text-accent-2" : "text-[#C0392B]"}>
                {certo ? "✓" : "✕"}
              </span>
              {t}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
  return (
    <Caixa titulo={b.titulo ?? "Certo × errado"} intro={b.intro}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {lado(b.errado, false)}
        {lado(b.certo, true)}
      </div>
    </Caixa>
  );
}

function Caca({ b, id }: { b: Extract<Bloco, { tipo: "caca" }>; id: string }) {
  const concluir = useConcluir(id);
  const totalErros = b.trechos.filter((t) => t.erro).length;
  const [achados, setAchados] = useState<Set<number>>(new Set());
  const [ultimo, setUltimo] = useState<{ i: number; certo: boolean } | null>(null);
  useEffect(() => {
    if (achados.size === totalErros) concluir();
  }, [achados, totalErros, concluir]);
  const tocar = (i: number) => {
    const t = b.trechos[i];
    if (t.erro) setAchados((a) => new Set(a).add(i));
    setUltimo({ i, certo: !!t.erro });
  };
  const fim = achados.size === totalErros;
  return (
    <Caixa titulo={b.titulo ?? "Caça ao erro"} intro={b.intro ?? "Toque nos trechos que estão errados."}>
      <div className="border border-[#D7DEE6] bg-[#FFFDF6] px-4 py-4 font-data text-[15px] leading-[2] text-[#14213A]">
        {b.trechos.map((t, i) => (
          <button
            key={i}
            type="button"
            onClick={() => tocar(i)}
            className={`mr-1 inline px-0.5 text-left ${achados.has(i) ? "bg-[#FBEAEA] text-[#C0392B] line-through decoration-2" : "hover:bg-[#EEF3F8]"}`}
          >
            {t.t}
          </button>
        ))}
      </div>
      <p className="mt-2 font-data text-[13.5px] text-[#516278]">
        {fim ? `✓ Você achou os ${totalErros} erros!` : `${achados.size} de ${totalErros} erros encontrados`}
      </p>
      {ultimo && (
        <p className={`mt-1 text-[16px] leading-relaxed ${ultimo.certo ? "text-accent-2" : "text-[#516278]"}`}>
          {ultimo.certo ? `✓ Achou: ${b.trechos[ultimo.i].erro}` : "Esse trecho está adequado. Procure opiniões, suposições, gírias ou falta de informação."}
        </p>
      )}
    </Caixa>
  );
}

function Leis({ b, id }: { b: Extract<Bloco, { tipo: "leis" }>; id: string }) {
  const concluir = useConcluir(id);
  const [abertos, setAbertos] = useState<Set<number>>(new Set());
  const [atual, setAtual] = useState<number | null>(null);
  useEffect(() => {
    if (abertos.size === b.itens.length) concluir();
  }, [abertos, b.itens.length, concluir]);
  const abrir = (i: number) => {
    setAtual((a) => (a === i ? null : i));
    setAbertos((a) => new Set(a).add(i));
  };
  return (
    <Caixa titulo={b.titulo ?? "O que diz a lei"} intro={b.intro ?? "Toque em cada card para abrir o artigo."}>
      <div className="flex flex-col gap-2">
        {b.itens.map((l, i) => (
          <div key={i} className={`border-2 bg-white ${atual === i ? "border-brand" : "border-[#D7DEE6]"}`}>
            <button type="button" onClick={() => abrir(i)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-[#F6F9FC]">
              <span className="shrink-0 bg-brand px-2 py-1 font-data text-[13px] font-bold text-white">{l.artigo}</span>
              <span className="flex-1">
                <span className="block text-[16.5px] font-bold text-[#14213A]">{l.nome}</span>
                <span className="block font-data text-[12.5px] uppercase tracking-wide text-[#516278]">{l.lei}</span>
              </span>
              <span aria-hidden className="text-[18px] text-[#516278]">
                {abertos.has(i) && atual !== i ? "✓" : atual === i ? "−" : "+"}
              </span>
            </button>
            {atual === i && (
              <div className="border-t border-[#EEF2F6] px-4 py-3">
                <p className="border-l-4 border-brand bg-[#F6F9FC] px-3 py-2 text-[15.5px] italic leading-relaxed text-[#14213A]">{l.texto}</p>
                {l.pena && (
                  <p className="mt-2 text-[15px] text-[#33465E]">
                    <strong>Pena:</strong> {l.pena}
                  </p>
                )}
                <p className="mt-2 text-[16px] leading-relaxed text-[#14213A]">
                  <strong>Na portaria:</strong> {l.portaria}
                </p>
                <a href={l.url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-[15px] font-semibold text-brand underline underline-offset-4">
                  Ler a lei completa no site do Planalto ↗
                </a>
              </div>
            )}
          </div>
        ))}
      </div>
      <p className="mt-2 font-data text-[13.5px] text-[#516278]">
        {abertos.size === b.itens.length ? "✓ Todos os artigos lidos" : `${abertos.size} de ${b.itens.length} artigos abertos`}
      </p>
    </Caixa>
  );
}

function Calendario({ b, id }: { b: Extract<Bloco, { tipo: "calendario" }>; id: string }) {
  const concluir = useConcluir(id);
  const [marcados, setMarcados] = useState<Set<number>>(new Set());
  const [conferido, setConferido] = useState(false);
  const certos = useMemo(() => new Set(b.plantoes), [b.plantoes]);
  const acertou = conferido && marcados.size === certos.size && [...marcados].every((d) => certos.has(d));
  useEffect(() => {
    if (acertou) concluir();
  }, [acertou, concluir]);
  const feriado = (d: number) => b.feriados?.find((f) => f.dia === d);
  const tocar = (d: number) => {
    setConferido(false);
    setMarcados((m) => {
      const n = new Set(m);
      if (n.has(d)) n.delete(d);
      else n.add(d);
      return n;
    });
  };
  const celulas: (number | null)[] = [...Array(b.inicio).fill(null), ...Array.from({ length: b.dias }, (_, i) => i + 1)];
  const erros = conferido ? [...marcados].filter((d) => !certos.has(d)).length + b.plantoes.filter((d) => !marcados.has(d)).length : 0;
  return (
    <Caixa titulo={b.titulo ?? "Monte a escala"} intro={b.intro}>
      <div className="border-2 border-brand bg-white">
        <p className="bg-brand px-4 py-2 text-center font-display text-[16px] font-extrabold text-white">{b.mes}</p>
        <div className="grid grid-cols-7 gap-px bg-[#EEF2F6] p-px">
          {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => (
            <span key={i} className="bg-[#F6F9FC] py-1 text-center font-data text-[12.5px] font-semibold text-[#516278]">
              {d}
            </span>
          ))}
          {celulas.map((d, i) => {
            if (d === null) return <span key={i} className="bg-white" />;
            const m = marcados.has(d);
            const cor = conferido
              ? m && certos.has(d)
                ? "bg-accent-2 text-white"
                : m
                  ? "bg-[#C0392B] text-white"
                  : certos.has(d)
                    ? "bg-[#FBEAEA] text-[#C0392B] outline outline-2 -outline-offset-2 outline-[#C0392B]"
                    : "bg-white text-[#14213A]"
              : m
                ? "bg-brand text-white"
                : "bg-white text-[#14213A] hover:bg-[#EEF3F8]";
            const f = feriado(d);
            return (
              <button key={i} type="button" onClick={() => tocar(d)} title={f?.nome} className={`relative h-11 text-[16px] font-semibold ${cor}`}>
                {d}
                {f && <span aria-label={f.nome} className="absolute right-1 top-0.5 text-[10px]">★</span>}
              </button>
            );
          })}
        </div>
      </div>
      {b.feriados && b.feriados.length > 0 && (
        <p className="mt-1.5 font-data text-[13px] text-[#516278]">★ {b.feriados.map((f) => `${f.dia}: ${f.nome}`).join(" · ")}</p>
      )}
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => setConferido(true)} className="bg-accent px-4 py-2 text-[15.5px] font-bold text-accent-ink">
          Conferir escala
        </button>
        <span className="font-data text-[13.5px] text-[#516278]">{marcados.size} dias marcados</span>
      </div>
      {conferido && (
        <p className={`mt-2 text-[16px] leading-relaxed ${acertou ? "text-accent-2" : "text-[#C0392B]"}`}>
          {acertou
            ? `✓ Escala certa: ${b.plantoes.length} plantões no mês. ${b.explicacao ?? ""}`
            : `✗ ${erros} ${erros === 1 ? "dia errado" : "dias errados"}. Em vermelho: marcado sem ser plantão; com contorno: plantão que faltou marcar.`}
        </p>
      )}
    </Caixa>
  );
}

// compara frases ignorando maiúsculas, pontuação e apóstrofos diferentes; devolve as palavras da resposta certa
// marcadas como acertadas ou não
function palavras(t: string) {
  return t
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/[^a-z0-9' ]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}
function comparar(certa: string, dita: string) {
  const alvo = palavras(certa);
  const resto = [...palavras(dita)];
  const marcadas = alvo.map((w) => {
    const i = resto.indexOf(w);
    if (i >= 0) resto.splice(i, 1);
    return { w, ok: i >= 0 };
  });
  const acertos = marcadas.filter((m) => m.ok).length;
  return { marcadas, pct: alvo.length ? Math.round((acertos / alvo.length) * 100) : 0 };
}

function BotoesOuvir({ texto }: { texto: string }) {
  const idioma = useContext(Voz);
  return (
    <span className="flex gap-1.5">
      <button type="button" onClick={() => falar(texto, idioma)} className="border-2 border-brand bg-white px-3 py-1.5 text-[14.5px] font-bold text-brand hover:bg-[#EEF3F8]">
        🔊 Ouvir
      </button>
      <button type="button" onClick={() => falar(texto, idioma, 0.55)} className="border-2 border-[#D7DEE6] bg-white px-3 py-1.5 text-[14.5px] font-semibold text-[#516278] hover:border-brand">
        🐢 Devagar
      </button>
    </span>
  );
}

function Ditado({ b, id }: { b: Extract<Bloco, { tipo: "ditado" }>; id: string }) {
  const concluir = useConcluir(id);
  const [textos, setTextos] = useState<string[]>(() => b.itens.map(() => ""));
  const [conferidos, setConferidos] = useState<(ReturnType<typeof comparar> | null)[]>(() => b.itens.map(() => null));
  useEffect(() => {
    if (conferidos.every(Boolean)) concluir();
  }, [conferidos, concluir]);
  return (
    <Caixa titulo={b.titulo ?? "Ditado: ouça e escreva"} intro={b.intro ?? "Toque em Ouvir (ou Devagar), escreva o que entendeu em inglês e confira."}>
      <ol className="flex flex-col gap-3">
        {b.itens.map((f, i) => {
          const r = conferidos[i];
          return (
            <li key={i} className="border border-[#D7DEE6] bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-data text-[13px] font-semibold text-[#516278]">Frase {i + 1}</span>
                <BotoesOuvir texto={f.en} />
              </div>
              <div className="mt-3 flex gap-2">
                <input
                  value={textos[i]}
                  onChange={(e) => setTextos((t) => t.map((x, k) => (k === i ? e.target.value : x)))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && textos[i].trim()) setConferidos((c) => c.map((x, k) => (k === i ? comparar(f.en, textos[i]) : x)));
                  }}
                  placeholder="Escreva o que ouviu"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck={false}
                  className="min-w-0 flex-1 border-2 border-[#D7DEE6] px-3 py-2 text-[16px] text-[#14213A] outline-none focus:border-brand"
                />
                <button
                  type="button"
                  disabled={!textos[i].trim()}
                  onClick={() => setConferidos((c) => c.map((x, k) => (k === i ? comparar(f.en, textos[i]) : x)))}
                  className="bg-accent px-4 py-2 text-[15px] font-bold text-accent-ink disabled:opacity-50"
                >
                  Conferir
                </button>
              </div>
              {r && (
                <div className="mt-3">
                  <p className="flex flex-wrap gap-x-1.5 text-[16.5px] font-semibold">
                    {r.marcadas.map((m, k) => (
                      <span key={k} className={m.ok ? "text-accent-2" : "text-[#C0392B] underline decoration-2"}>
                        {m.w}
                      </span>
                    ))}
                  </p>
                  <p className={`mt-1 text-[15px] ${r.pct === 100 ? "text-accent-2" : "text-[#516278]"}`}>
                    {r.pct === 100 ? "✓ Perfeito!" : `${r.pct}% das palavras. As sublinhadas faltaram ou estão diferentes.`} <span className="text-[#516278]">({f.pt})</span>
                  </p>
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </Caixa>
  );
}

type Reconhecedor = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: (e: { results: { 0: { transcript: string } }[] }) => void;
  onerror: (e: { error: string }) => void;
  onend: () => void;
  start: () => void;
};

function Fala({ b, id }: { b: Extract<Bloco, { tipo: "fala" }>; id: string }) {
  const concluir = useConcluir(id);
  const idioma = useContext(Voz) ?? "en-US";
  const suporta = useSyncExternalStore(
    () => () => {},
    // sem a API ou com o microfone bloqueado pela política do site, vira "ouça e repita em voz alta"
    () =>
      ("SpeechRecognition" in window || "webkitSpeechRecognition" in window) &&
      ((document as unknown as { featurePolicy?: { allowsFeature(f: string): boolean } }).featurePolicy?.allowsFeature("microphone") ?? true),
    () => true,
  );
  const [ouvindo, setOuvindo] = useState<number | null>(null);
  const [resultados, setResultados] = useState<({ dito: string; pct: number; marcadas: { w: string; ok: boolean }[] } | null)[]>(() => b.itens.map(() => null));
  const [feitos, setFeitos] = useState<Set<number>>(new Set());
  const [erro, setErro] = useState<string | null>(null);
  useEffect(() => {
    if (feitos.size === b.itens.length) concluir();
  }, [feitos, b.itens.length, concluir]);

  const gravar = (i: number) => {
    const w = window as unknown as { SpeechRecognition?: new () => Reconhecedor; webkitSpeechRecognition?: new () => Reconhecedor };
    const Classe = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Classe) return;
    const rec = new Classe();
    rec.lang = idioma;
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    setErro(null);
    setOuvindo(i);
    rec.onresult = (e) => {
      const dito = e.results[0][0].transcript;
      const r = comparar(b.itens[i].en, dito);
      setResultados((rs) => rs.map((x, k) => (k === i ? { dito, ...r } : x)));
      setFeitos((f) => new Set(f).add(i));
    };
    rec.onerror = (e) =>
      setErro(e.error === "not-allowed" ? "Libere o microfone para o site nas permissões do navegador." : "Não deu para ouvir. Fale perto do microfone e tente de novo.");
    rec.onend = () => setOuvindo(null);
    rec.start();
  };

  return (
    <Caixa
      titulo={b.titulo ?? "Fale em inglês"}
      intro={b.intro ?? "Ouça, toque no microfone e repita a frase. O navegador confere o que entendeu da sua pronúncia (o áudio é processado pelo serviço de voz do próprio navegador e não fica guardado no SIBRAP)."}
    >
      {!suporta && (
        <p className="mb-3 border-l-4 border-accent bg-[#FBF5E4] px-3 py-2 text-[14.5px] text-[#33465E]">
          Ouça cada frase, repita em voz alta (de preferência mais de uma vez) e marque como feito.
        </p>
      )}
      <ol className="flex flex-col gap-3">
        {b.itens.map((f, i) => {
          const r = resultados[i];
          return (
            <li key={i} className="border border-[#D7DEE6] bg-white p-4">
              <p className="text-[18px] font-bold text-[#14213A]">{f.en}</p>
              <p className="text-[14.5px] text-[#516278]">{f.pt}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <BotoesOuvir texto={f.en} />
                {suporta ? (
                  <button
                    type="button"
                    onClick={() => gravar(i)}
                    disabled={ouvindo !== null}
                    className={`px-4 py-1.5 text-[15px] font-bold ${ouvindo === i ? "animate-pulse bg-[#C0392B] text-white" : "bg-accent text-accent-ink"} disabled:opacity-70`}
                  >
                    {ouvindo === i ? "🎙️ Ouvindo… fale agora" : "🎤 Falar"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setFeitos((s) => new Set(s).add(i))}
                    className={`px-4 py-1.5 text-[15px] font-bold ${feitos.has(i) ? "bg-accent-2 text-white" : "bg-accent text-accent-ink"}`}
                  >
                    {feitos.has(i) ? "✓ Feito" : "Repeti em voz alta"}
                  </button>
                )}
              </div>
              {r && (
                <div className="mt-3">
                  <p className="text-[14.5px] text-[#516278]">
                    Entendi: <em className="text-[#14213A]">“{r.dito}”</em>
                  </p>
                  <p className="mt-1 flex flex-wrap gap-x-1.5 text-[16px] font-semibold">
                    {r.marcadas.map((m, k) => (
                      <span key={k} className={m.ok ? "text-accent-2" : "text-[#C0392B] underline decoration-2"}>
                        {m.w}
                      </span>
                    ))}
                  </p>
                  <p className={`mt-1 text-[15px] font-semibold ${r.pct >= 80 ? "text-accent-2" : r.pct >= 50 ? "text-[#B7791F]" : "text-[#C0392B]"}`}>
                    {r.pct >= 80 ? `✓ Muito bem! ${r.pct}%` : r.pct >= 50 ? `Quase: ${r.pct}%. Ouça devagar e tente de novo.` : `${r.pct}%. Ouça a frase devagar e repita.`}
                  </p>
                </div>
              )}
            </li>
          );
        })}
      </ol>
      {erro && <p className="mt-2 text-[14.5px] text-[#C0392B]">{erro}</p>}
    </Caixa>
  );
}

function Render({ b, id }: { b: Bloco; id: string }) {
  switch (b.tipo) {
    case "texto":
      return <Texto b={b} />;
    case "dica":
      return (
        <p className="mt-6 border-l-4 border-accent bg-[#FBF5E4] px-4 py-3 text-[16.5px] leading-relaxed text-[#14213A]">💡 {b.texto}</p>
      );
    case "imagem":
      return (
        <figure className="mt-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={b.src} alt={b.alt} loading="lazy" className="mx-auto max-h-[300px] w-auto border border-[#D7DEE6] bg-white" />
          {b.legenda && <figcaption className="mt-1 text-center text-[14px] text-[#516278]">{b.legenda}</figcaption>}
        </figure>
      );
    case "frases":
      return <Frases b={b} id={id} />;
    case "audio":
      return <Audio b={b} />;
    case "cards":
      return <Cards b={b} id={id} />;
    case "abas":
      return <Abas b={b} />;
    case "dialogos":
      return <Dialogos b={b} id={id} />;
    case "email":
      return <Email b={b} />;
    case "escolha":
      return <Escolha b={b} id={id} />;
    case "vf":
      return <VerdadeiroFalso b={b} id={id} />;
    case "ordenar":
      return <OrdenarOuConcluido b={b} id={id} />;
    case "sinais":
      return <Sinais b={b} id={id} />;
    case "checklist":
      return <Checklist b={b} id={id} />;
    case "fluxo":
      return <Fluxo b={b} id={id} />;
    case "simulador":
      return <Simulador b={b} id={id} />;
    case "triagem":
      return <Triagem b={b} id={id} />;
    case "associar":
      return <Associar b={b} id={id} />;
    case "tabela":
      return <Tabela b={b} />;
    case "comparar":
      return <Comparar b={b} />;
    case "caca":
      return <Caca b={b} id={id} />;
    case "leis":
      return <Leis b={b} id={id} />;
    case "ditado":
      return <Ditado b={b} id={id} />;
    case "fala":
      return <Fala b={b} id={id} />;
    case "calendario":
      return <Calendario b={b} id={id} />;
    default:
      return null;
  }
}

export function AulaInterativa({ blocos, idioma = "en-US" }: { blocos: Bloco[]; idioma?: string | null }) {
  const ativos = blocos.map((b, i) => (ATIVOS.has(b.tipo) ? `b${i}` : null)).filter(Boolean) as string[];
  const [feitos, setFeitos] = useState<Set<string>>(new Set());
  const marcar = useCallback((id: string) => setFeitos((f) => (f.has(id) ? f : new Set(f).add(id))), []);
  const total = ativos.length;
  const pct = total ? Math.round((feitos.size / total) * 100) : 0;
  return (
    <Voz.Provider value={idioma}>
      <Placar.Provider value={marcar}>
        {total > 0 && (
          <div className="sticky top-0 z-10 -mx-1 mb-2 border border-[#D7DEE6] bg-white/95 px-4 py-2.5 backdrop-blur">
            <div className="flex items-center justify-between gap-3 text-[14px]">
              <span className="font-semibold text-[#14213A]">
                {feitos.size === total ? "🎉 Todas as atividades feitas!" : `Atividades da aula: ${feitos.size} de ${total}`}
              </span>
              <span className="font-data text-[#516278]">{pct}%</span>
            </div>
            <div className="mt-1.5 h-1.5 bg-[#EEF2F6]">
              <div className="h-full bg-accent-2 transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>
        )}
        {blocos.map((b, i) => (
          (b as ComVoz).voz !== undefined ? (
            <Voz.Provider key={i} value={(b as ComVoz).voz ?? null}>
              <Render b={b} id={`b${i}`} />
            </Voz.Provider>
          ) : (
            <Render key={i} b={b} id={`b${i}`} />
          )
        ))}
      </Placar.Provider>
    </Voz.Provider>
  );
}
