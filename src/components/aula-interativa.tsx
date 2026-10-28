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
  | { tipo: "frases"; titulo?: string; intro?: string; itens: Frase[]; repetir?: boolean }
  | { tipo: "audio"; titulo: string; intro?: string; src: string; transcricao?: Frase[] }
  | { tipo: "cards"; titulo?: string; intro?: string; itens: { frente: string; verso: string; icone?: string }[] }
  | { tipo: "abas"; titulo?: string; intro?: string; abas: { titulo: string; itens: Frase[] }[] }
  | {
      tipo: "dialogos";
      titulo?: string;
      intro?: string;
      // escuta: o texto fica escondido até o aluno pedir (treino de listening)
      escuta?: boolean;
      dialogos: { titulo: string; falas: { quem: string; en: string; pt: string }[] }[];
    }
  | { tipo: "email"; titulo?: string; intro?: string; assunto: string; linhas: Frase[] }
  | { tipo: "escolha"; titulo?: string; contexto?: string; pergunta: string; opcoes: string[]; correta: number; explicacao: string }
  | { tipo: "vf"; titulo?: string; intro?: string; itens: { texto: string; verdadeiro: boolean; explicacao: string }[] }
  | { tipo: "ordenar"; titulo?: string; intro?: string; itens: Frase[] };

const ATIVOS = new Set(["frases", "cards", "escolha", "vf", "ordenar", "dialogos"]);

const Placar = createContext<(id: string) => void>(() => {});

function useConcluir(id: string) {
  const marcar = useContext(Placar);
  return useCallback(() => marcar(id), [marcar, id]);
}

// voz do navegador em inglês (funciona no Chrome, Edge, Safari e na maioria dos celulares);
// com várias falas, alterna duas vozes quando o aparelho tiver, para parecer uma conversa
function falar(texto: string | string[]) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const vozes = window.speechSynthesis.getVoices().filter((v) => v.lang.startsWith("en"));
  window.speechSynthesis.cancel();
  (Array.isArray(texto) ? texto : [texto]).forEach((t, i) => {
    const u = new SpeechSynthesisUtterance(t);
    u.lang = "en-US";
    u.rate = 0.9;
    const voz = vozes[vozes.length > 1 ? i % 2 : 0];
    if (voz) u.voice = voz;
    window.speechSynthesis.speak(u);
  });
}

function BotaoOuvir({ texto }: { texto: string }) {
  // no servidor não há voz; no navegador, só mostra o botão se ele falar
  const tem = useSyncExternalStore(
    () => () => {},
    () => "speechSynthesis" in window,
    () => false
  );
  if (!tem) return null;
  return (
    <button
      type="button"
      onClick={() => falar(texto)}
      aria-label={`Ouvir: ${texto}`}
      className="flex h-8 w-8 shrink-0 items-center justify-center border border-[#D7DEE6] bg-white text-[15px] text-brand hover:border-brand"
    >
      🔊
    </button>
  );
}

function Caixa({ titulo, intro, children }: { titulo?: string; intro?: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      {titulo && <h2 className="font-display text-xl font-extrabold text-[#14213A]">{titulo}</h2>}
      {intro && <p className="mt-1 text-[15px] leading-relaxed text-[#516278]">{intro}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Texto({ b }: { b: Extract<Bloco, { tipo: "texto" }> }) {
  return (
    <Caixa titulo={b.titulo}>
      {b.paragrafos.map((p, i) => (
        <p key={i} className="mb-3 text-[15.5px] leading-relaxed text-[#14213A]">{p}</p>
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
        <p className="mb-3 text-[13.5px] text-[#516278]">
          Toque em 🔊, repita a frase em voz alta e marque ✓. Não precisa acertar de primeira!
        </p>
      )}
      <ul className="border border-[#D7DEE6] bg-white">
        {b.itens.map((f, i) => (
          <li key={i} className="flex items-center gap-3 border-t border-[#EEF2F6] px-4 py-3 first:border-t-0">
            <BotaoOuvir texto={f.en} />
            <div className="min-w-0 flex-1">
              <p className="text-[15.5px] font-semibold text-[#14213A]">{f.en}</p>
              <p className="text-[13.5px] text-[#516278]">{f.pt}</p>
            </div>
            {b.repetir ? (
              <button
                type="button"
                onClick={() => marcar(i)}
                aria-pressed={feitas.has(i)}
                aria-label="Marcar como repetida"
                className={`h-8 w-8 shrink-0 border text-[14px] font-bold ${feitas.has(i) ? "border-accent-2 bg-accent-2 text-white" : "border-[#C4CEDA] bg-white text-[#C4CEDA]"}`}
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
      className="mt-2 text-[13.5px] font-semibold text-brand underline underline-offset-4 disabled:text-accent-2 disabled:no-underline"
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
              className="mt-3 text-[13.5px] font-semibold text-brand underline underline-offset-4"
            >
              {ver ? "Esconder a transcrição" : "Ver a transcrição com tradução"}
            </button>
            {ver && (
              <ul className="mt-3 flex flex-col gap-2">
                {b.transcricao.map((f, i) => (
                  <li key={i} className="border-l-2 border-accent pl-3">
                    <p className="text-[15px] font-semibold text-[#14213A]">{f.en}</p>
                    <p className="text-[13.5px] text-[#516278]">{f.pt}</p>
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
    if (!virados.has(i)) falar(b.itens[i].frente);
  };
  return (
    <Caixa titulo={b.titulo} intro={b.intro ?? "Toque nos cards para ver a tradução e ouvir a pronúncia."}>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {b.itens.map((c, i) => {
          const v = virados.has(i);
          return (
            <button
              key={i}
              type="button"
              onClick={() => virar(i)}
              aria-pressed={v}
              className="group h-32 [perspective:800px]"
            >
              <span
                className={`relative block h-full w-full transition-transform duration-500 [transform-style:preserve-3d] motion-reduce:transition-none ${v ? "[transform:rotateY(180deg)]" : ""}`}
              >
                <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 border border-[#D7DEE6] bg-white p-3 [backface-visibility:hidden]">
                  {c.icone && <span className="text-3xl" aria-hidden>{c.icone}</span>}
                  <span className="text-center text-[15px] font-bold text-[#14213A]">{c.frente}</span>
                </span>
                <span className="absolute inset-0 flex flex-col items-center justify-center border border-brand bg-brand p-3 text-white [backface-visibility:hidden] [transform:rotateY(180deg)]">
                  <span className="text-center text-[14.5px] font-semibold leading-snug">{c.verso}</span>
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
            className={`border px-3 py-2 text-[13.5px] font-semibold ${i === atual ? "border-brand bg-brand text-white" : "border-[#D7DEE6] bg-white text-[#14213A] hover:border-brand"}`}
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
              <p className="text-[15px] font-semibold text-[#14213A]">{f.en}</p>
              <p className="text-[13.5px] text-[#516278]">{f.pt}</p>
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
              className={`border px-3 py-2 text-[13.5px] font-semibold ${i === atual ? "border-brand bg-brand text-white" : "border-[#D7DEE6] bg-white text-[#14213A] hover:border-brand"}`}
            >
              {lidos.has(i) && i !== atual ? "✓ " : ""}
              {x.titulo}
            </button>
          ))}
        </div>
      )}
      <div className="border border-[#D7DEE6] bg-white p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="font-display text-[16px] font-extrabold text-[#14213A]">{d.titulo}</p>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                falar(d.falas.map((f) => f.en));
                interagiu();
              }}
              className="bg-brand px-3 py-1.5 text-[13px] font-bold text-white"
            >
              ▶ Ouvir o diálogo
            </button>
            {b.escuta && (
              <button
                type="button"
                onClick={() => {
                  setTexto(!texto);
                  interagiu();
                }}
                className="text-[13px] font-semibold text-brand underline underline-offset-4"
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
                className="text-[13px] font-semibold text-brand underline underline-offset-4"
              >
                {traducao ? "Esconder tradução" : "Mostrar tradução"}
              </button>
            )}
          </div>
        </div>
        {!texto && (
          <p className="mb-3 bg-[#F6F9FC] px-3 py-2 text-[13.5px] text-[#516278]">
            🎧 Ouça primeiro sem ler. Tente entender as palavras-chave e só depois mostre o texto.
          </p>
        )}
        <ul className="flex flex-col gap-2.5">
          {d.falas.map((f, i) => (
            <li key={i} className="flex items-start gap-3">
              <BotaoOuvir texto={f.en} />
              <div className="min-w-0 flex-1">
                <p className="text-[15px] text-[#14213A]">
                  <strong className="font-bold">{f.quem}:</strong> {texto ? f.en : "• • •"}
                </p>
                {texto && traducao && <p className="text-[13.5px] text-[#516278]">{f.pt}</p>}
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
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setVisivel(true);
        obs.disconnect();
      }
    }, { threshold: 0.4 });
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
          <p className="text-[14px] font-semibold text-[#14213A]">Subject: {b.assunto}</p>
        </div>
        <ul className="flex min-h-[120px] flex-col gap-2 px-4 py-4">
          {b.linhas.slice(0, n).map((f, i) => (
            <li key={i} className="animate-[rise-in_.5s_ease-out] motion-reduce:animate-none">
              <p className="text-[15px] text-[#14213A]">{f.en}</p>
              <p className="text-[12.5px] text-accent-2">{f.pt}</p>
            </li>
          ))}
          {n < b.linhas.length && <li className="h-4 w-2 animate-pulse bg-brand" aria-hidden />}
        </ul>
        {n >= b.linhas.length && (
          <button type="button" onClick={() => setN(0)} className="mb-3 ml-4 text-[13px] font-semibold text-brand underline underline-offset-4">
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
        {b.contexto && <p className="mb-2 text-[14.5px] leading-relaxed text-[#516278]">{b.contexto}</p>}
        <p className="text-[15.5px] font-semibold text-[#14213A]">{b.pergunta}</p>
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
                className={`border px-4 py-2.5 text-left text-[15px] text-[#14213A] ${cor}`}
              >
                {o}
              </button>
            );
          })}
        </div>
        {resp !== null && (
          <p className={`mt-3 text-[14.5px] ${certo ? "text-accent-2" : "text-[#C0392B]"}`}>
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
              <p className="text-[15px] text-[#14213A]">{it.texto}</p>
              <div className="mt-2 flex gap-2">
                {[true, false].map((v) => (
                  <button
                    key={String(v)}
                    type="button"
                    disabled={respondida}
                    onClick={() => responder(i, v)}
                    className={`border px-4 py-1.5 text-[13.5px] font-bold ${
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
                <p className={`mt-2 text-[13.5px] ${r === it.verdadeiro ? "text-accent-2" : "text-[#C0392B]"}`}>
                  {r === it.verdadeiro ? "✓ Acertou. " : "✗ Não foi dessa vez. "}
                  {it.explicacao}
                </p>
              )}
            </li>
          );
        })}
      </ul>
      {terminou && (
        <p className="mt-3 font-display text-[16px] font-extrabold text-[#14213A]">
          Você acertou {acertos} de {b.itens.length}. {acertos === b.itens.length ? "Excelente! 🎉" : "Revise as explicações e siga em frente."}
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
    let o = embaralhar(palavras.map((_, k) => k), palavras.length * 7 + i + 3);
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
        <p className="mt-1 text-[15px] text-[#516278]">“{item.pt}”</p>
        <div className="mt-3 flex min-h-[46px] flex-wrap gap-1.5 border-b-2 border-[#D7DEE6] pb-2">
          {montada.map((k, n) => (
            <button
              key={n}
              type="button"
              onClick={() => !certa && setMontada(montada.filter((_, x) => x !== n))}
              className="border border-brand bg-brand px-2.5 py-1.5 text-[15px] font-semibold text-white"
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
                className="border border-[#C4CEDA] bg-white px-2.5 py-1.5 text-[15px] font-semibold text-[#14213A] hover:border-brand"
              >
                {palavras[k]}
              </button>
            )
          )}
        </div>
        {completa && (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <p className={`text-[14.5px] font-semibold ${certa ? "text-accent-2" : "text-[#C0392B]"}`}>
              {certa ? "✓ Perfeito!" : "Quase! Toque nas palavras de cima para desfazer e tente de novo."}
            </p>
            {certa && (
              <>
                <BotaoOuvir texto={item.en} />
                <button type="button" onClick={proxima} className="bg-accent px-4 py-2 text-[14px] font-bold text-accent-ink">
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
      <p className="border border-accent-2 bg-[#E6F4F1] p-4 text-[15px] font-semibold text-accent-2">
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
    [marcar]
  );
  if (fim) return <Concluido b={b} />;
  return (
    <Placar.Provider value={concluir}>
      <Ordenar b={b} id={id} />
    </Placar.Provider>
  );
}

function Render({ b, id }: { b: Bloco; id: string }) {
  switch (b.tipo) {
    case "texto":
      return <Texto b={b} />;
    case "dica":
      return (
        <p className="mt-6 border-l-4 border-accent bg-[#FBF5E4] px-4 py-3 text-[15px] leading-relaxed text-[#14213A]">
          💡 {b.texto}
        </p>
      );
    case "imagem":
      return (
        <figure className="mt-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={b.src} alt={b.alt} loading="lazy" className="mx-auto max-h-[300px] w-auto border border-[#D7DEE6] bg-white" />
          {b.legenda && <figcaption className="mt-1 text-center text-[13px] text-[#516278]">{b.legenda}</figcaption>}
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
    default:
      return null;
  }
}

export function AulaInterativa({ blocos }: { blocos: Bloco[] }) {
  const ativos = blocos.map((b, i) => (ATIVOS.has(b.tipo) ? `b${i}` : null)).filter(Boolean) as string[];
  const [feitos, setFeitos] = useState<Set<string>>(new Set());
  const marcar = useCallback((id: string) => setFeitos((f) => (f.has(id) ? f : new Set(f).add(id))), []);
  const total = ativos.length;
  const pct = total ? Math.round((feitos.size / total) * 100) : 0;
  return (
    <Placar.Provider value={marcar}>
      {total > 0 && (
        <div className="sticky top-0 z-10 -mx-1 mb-2 border border-[#D7DEE6] bg-white/95 px-4 py-2.5 backdrop-blur">
          <div className="flex items-center justify-between gap-3 text-[13px]">
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
        <Render key={i} b={b} id={`b${i}`} />
      ))}
    </Placar.Provider>
  );
}
