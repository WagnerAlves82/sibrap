"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { contarLinhas, MAX_CARACTERES, MAX_SUGESTOES_POR_REDACAO, MIN_LINHAS_CORRECAO } from "@/lib/redacao-bancas";
import type { Sugestao } from "@/lib/redacao";
import { corrigirAction, salvarRascunhoAction, sugerirAction } from "../actions";

type Tipo = Sugestao["tipo"];
const CORES: Record<Tipo, { fundo: string; borda: string; nome: string }> = {
  gramatica: { fundo: "#FBD9D9", borda: "#C0392B", nome: "Norma-padrão" },
  pontuacao: { fundo: "#FBD9D9", borda: "#C0392B", nome: "Pontuação" },
  coesao: { fundo: "#D8E6FB", borda: "#2F6DB5", nome: "Coesão" },
  clareza: { fundo: "#FCEFC7", borda: "#B7860B", nome: "Clareza" },
  argumento: { fundo: "#D3F0E6", borda: "#0E7C6B", nome: "Argumento" },
  estrutura: { fundo: "#D3F0E6", borda: "#0E7C6B", nome: "Estrutura" },
};
const PALAVRAS_COMUNS = new Set(
  "para pela pelo pelos pelas como mais mas porque quando onde sobre entre esse essa isso este esta isto aquele aquela também ainda muito muitos muitas seus suas sua seu nosso nossa pois assim então sendo foram será podem pode deve devem cada todo toda todos todas outro outra outros outras mesmo mesma desde contra apenas além tanto"
    .split(" ")
);
const MINUTOS_SIMULADO = 60;

type Marca = { ini: number; fim: number; i: number; tipo: Tipo | "rep" };

function palavrasRepetidas(texto: string): Set<string> {
  const conta = new Map<string, number>();
  for (const m of texto.toLowerCase().matchAll(/[a-záàâãéêíóôõúç]{5,}/gi)) {
    const w = m[0];
    if (!PALAVRAS_COMUNS.has(w)) conta.set(w, (conta.get(w) ?? 0) + 1);
  }
  return new Set([...conta].filter(([, n]) => n >= 3).map(([w]) => w));
}

/** Pronto para dicas: introdução escrita e desenvolvimento começado (2º parágrafo com conteúdo). */
function prontoParaDicas(texto: string) {
  const ps = texto.split(/\n+/).map((p) => p.trim()).filter(Boolean);
  return ps.length >= 2 && ps[0].length >= 150 && ps[1].length >= 100;
}

export function EditorRedacao(props: {
  id: string;
  tema: string;
  textoInicial: string;
  modo: "treino" | "simulado";
  criadoEm: string;
  banca: { nome: string; linhasMin: number; linhasMax: number };
  concurso: string;
  saldo: number;
  analisesUsadas: number;
}) {
  const { id, tema, modo, banca } = props;
  const router = useRouter();
  const chaveLocal = `sibrap-redacao-${id}`;
  const [texto, setTexto] = useState(props.textoInicial);
  const [sugestoes, setSugestoes] = useState<Sugestao[]>([]);
  const [comentario, setComentario] = useState("");
  const [ignoradas, setIgnoradas] = useState<string[]>([]);
  const [analisando, setAnalisando] = useState(false);
  const [aviso, setAviso] = useState("");
  const [restantes, setRestantes] = useState(MAX_SUGESTOES_POR_REDACAO - props.analisesUsadas);
  const [salvo, setSalvo] = useState<"salvo" | "salvando" | "pendente">("salvo");
  const [fonte, setFonte] = useState(17);
  const [verRepeticoes, setVerRepeticoes] = useState(false);
  const [foco, setFoco] = useState(false);
  const [destaque, setDestaque] = useState<number | null>(null);
  const [dica, setDica] = useState<{ i: number; x: number; y: number } | null>(null);
  const [confirmando, setConfirmando] = useState(false);
  const [corrigindo, setCorrigindo] = useState(false);
  const [erroCorrecao, setErroCorrecao] = useState("");
  const [agora, setAgora] = useState(() => Date.now());

  const area = useRef<HTMLTextAreaElement>(null);
  const ultimoAnalisado = useRef(props.textoInicial);
  const textoAtual = useRef(texto);
  const ultimoSalvo = useRef(props.textoInicial);
  useEffect(() => {
    textoAtual.current = texto;
  }, [texto]);

  // rascunho local (some se a internet cair no meio)
  useEffect(() => {
    try {
      const local = localStorage.getItem(chaveLocal);
      if (local && local.length > props.textoInicial.length) queueMicrotask(() => setTexto(local));
    } catch {}
    // só na abertura
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // altura automática: a folha cresce com o texto e o fundo marcado acompanha
  useEffect(() => {
    const el = area.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(420, el.scrollHeight)}px`;
  }, [texto, fonte, foco]);

  // salvamento automático
  useEffect(() => {
    if (texto === ultimoSalvo.current) return;
    try {
      localStorage.setItem(chaveLocal, texto);
    } catch {}
    const t = setTimeout(async () => {
      setSalvo("salvando");
      const r = await salvarRascunhoAction(id, texto);
      if (r.ok) ultimoSalvo.current = texto;
      setSalvo(r.ok ? "salvo" : "pendente");
    }, 3000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texto]);

  // relógio (simulado: contagem regressiva; treino: tempo de escrita da sessão)
  useEffect(() => {
    const t = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const [inicioSessao] = useState(() => Date.now());
  const segundos =
    modo === "simulado"
      ? Math.max(0, MINUTOS_SIMULADO * 60 - Math.floor((agora - new Date(props.criadoEm).getTime()) / 1000))
      : Math.floor((agora - inicioSessao) / 1000);
  const relogio = `${String(Math.floor(segundos / 60)).padStart(2, "0")}:${String(segundos % 60).padStart(2, "0")}`;

  const analisar = useCallback(
    async (manual = false) => {
      const atual = textoAtual.current;
      if (modo === "simulado" || analisando || restantes <= 0) return;
      if (!prontoParaDicas(atual)) {
        if (manual) setAviso("As dicas começam depois da introdução e do início do desenvolvimento.");
        return;
      }
      setAnalisando(true);
      setAviso("");
      const r = await sugerirAction(id, atual, ignoradas);
      setAnalisando(false);
      if ("erro" in r) {
        setAviso(r.erro);
        return;
      }
      ultimoAnalisado.current = atual;
      setRestantes(r.restantes);
      setComentario(r.comentario);
      setSugestoes(r.sugestoes);
    },
    [analisando, id, ignoradas, modo, restantes]
  );

  // dica automática: 6 s depois de parar de digitar, se o texto mudou bastante
  useEffect(() => {
    if (modo === "simulado") return;
    const mudou = Math.abs(texto.length - ultimoAnalisado.current.length) >= 120 || (sugestoes.length === 0 && texto !== ultimoAnalisado.current);
    if (!mudou || !prontoParaDicas(texto)) return;
    const t = setTimeout(() => void analisar(), 6000);
    return () => clearTimeout(t);
  }, [texto, analisar, modo, sugestoes.length]);

  // sugestões cujo trecho saiu do texto somem sozinhas
  const ativas = useMemo(
    () => sugestoes.filter((s) => texto.includes(s.trecho) && !ignoradas.includes(s.trecho)),
    [sugestoes, texto, ignoradas]
  );
  const repetidas = useMemo(() => (verRepeticoes ? palavrasRepetidas(texto) : new Set<string>()), [verRepeticoes, texto]);

  const marcas = useMemo(() => {
    const lista: Marca[] = [];
    ativas.forEach((s, i) => {
      const ini = texto.indexOf(s.trecho);
      if (ini >= 0) lista.push({ ini, fim: ini + s.trecho.length, i, tipo: s.tipo });
    });
    if (repetidas.size) {
      for (const m of texto.matchAll(/[a-záàâãéêíóôõúç]{5,}/gi)) {
        if (repetidas.has(m[0].toLowerCase())) lista.push({ ini: m.index!, fim: m.index! + m[0].length, i: -1, tipo: "rep" });
      }
    }
    lista.sort((a, b) => a.ini - b.ini);
    const semSobrepor: Marca[] = [];
    for (const m of lista) if (!semSobrepor.length || m.ini >= semSobrepor[semSobrepor.length - 1].fim) semSobrepor.push(m);
    return semSobrepor;
  }, [ativas, repetidas, texto]);

  const fundo = useMemo(() => {
    const partes: React.ReactNode[] = [];
    let pos = 0;
    marcas.forEach((m, k) => {
      partes.push(texto.slice(pos, m.ini));
      const cor = m.tipo === "rep" ? null : CORES[m.tipo];
      partes.push(
        <mark
          key={k}
          data-i={m.i}
          style={
            cor
              ? {
                  background: destaque === m.i ? cor.borda + "55" : cor.fundo,
                  borderBottom: `2px solid ${cor.borda}`,
                  color: "transparent",
                }
              : { background: "transparent", borderBottom: "2px dotted #8A5A00", color: "transparent" }
          }
        >
          {texto.slice(m.ini, m.fim)}
        </mark>
      );
      pos = m.fim;
    });
    partes.push(texto.slice(pos) + "\n");
    return partes;
  }, [marcas, texto, destaque]);

  function aoMoverMouse(e: React.MouseEvent) {
    const alvo = document.elementsFromPoint(e.clientX, e.clientY).find((el) => el.tagName === "MARK") as HTMLElement | undefined;
    const i = alvo ? Number(alvo.dataset.i) : -1;
    if (i >= 0) {
      const caixa = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setDica({ i, x: e.clientX - caixa.left, y: e.clientY - caixa.top });
      setDestaque(i);
    } else if (dica) {
      setDica(null);
      setDestaque(null);
    }
  }

  function substituir(ini: number, fim: number, novo: string) {
    const el = area.current;
    if (!el) return;
    el.focus();
    el.setSelectionRange(ini, fim);
    // insertText mantém o Ctrl+Z funcionando
    if (!document.execCommand("insertText", false, novo)) {
      el.setRangeText(novo, ini, fim, "end");
      setTexto(el.value);
      setSalvo("pendente");
    }
  }

  function aplicar(s: Sugestao) {
    const ini = texto.indexOf(s.trecho);
    if (ini < 0 || !s.troca) return;
    setDica(null);
    substituir(ini, ini + s.trecho.length, s.troca);
  }

  function alternarCaixa() {
    const el = area.current;
    if (!el || el.selectionStart === el.selectionEnd) return;
    const sel = texto.slice(el.selectionStart, el.selectionEnd);
    const novo =
      sel === sel.toUpperCase()
        ? sel.toLowerCase()
        : sel === sel.toLowerCase()
          ? sel.charAt(0).toUpperCase() + sel.slice(1)
          : sel.toUpperCase();
    const ini = el.selectionStart;
    substituir(ini, el.selectionEnd, novo);
    el.setSelectionRange(ini, ini + novo.length);
  }

  function comando(c: "undo" | "redo") {
    area.current?.focus();
    document.execCommand(c);
  }

  function baixar() {
    const blob = new Blob([`${tema}\n\n${texto}`], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "redacao-sibrap.txt";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function enviarCorrecao() {
    setCorrigindo(true);
    setErroCorrecao("");
    const r = await corrigirAction(id, texto);
    if ("erro" in r) {
      setErroCorrecao(r.erro);
      setCorrigindo(false);
      setConfirmando(false);
      return;
    }
    try {
      localStorage.removeItem(chaveLocal);
    } catch {}
    router.refresh();
  }

  const linhas = contarLinhas(texto);
  const palavras = texto.trim() ? texto.trim().split(/\s+/).length : 0;
  const paragrafos = texto.split(/\n+/).filter((p) => p.trim()).length;
  const corLinhas = linhas > banca.linhasMax ? "#B42318" : linhas >= banca.linhasMin ? "#0E7C6B" : "#8A5A00";
  const botaoBarra = "px-2.5 py-1.5 text-[13px] font-bold text-[#33465E] hover:bg-[#E7EEF4] disabled:opacity-40";
  const sugestaoDica = dica ? ativas[dica.i] : null;

  return (
    <div className="mt-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="min-w-0">
          <p className="font-data text-xs font-semibold uppercase tracking-[0.12em] text-accent-2">
            {modo === "simulado" ? "Simulado" : "Treino"} · {banca.nome}
            {props.concurso ? ` · ${props.concurso}` : ""}
          </p>
          <h1 className="mt-1 font-display text-xl font-extrabold text-[#14213A] sm:text-2xl">{tema}</h1>
        </div>
        <p className="font-data text-sm font-bold" style={{ color: modo === "simulado" && segundos < 600 ? "#B42318" : "#33465E" }}>
          {modo === "simulado" ? (segundos > 0 ? `Restam ${relogio}` : "Tempo esgotado") : `Escrevendo há ${relogio}`}
        </p>
      </div>

      <div className={`mt-4 grid gap-4 ${foco ? "" : "lg:grid-cols-[minmax(0,1.85fr)_minmax(0,1fr)]"}`}>
        {/* Painel da esquerda: a folha */}
        <section className="min-w-0 border border-[#D7DEE6] bg-white">
          <div className="flex flex-wrap items-center gap-0.5 border-b border-[#D7DEE6] bg-[#F6F8FA] px-2 py-1.5">
            <button className={botaoBarra} onClick={() => comando("undo")} title="Desfazer (Ctrl+Z)">↶</button>
            <button className={botaoBarra} onClick={() => comando("redo")} title="Refazer (Ctrl+Y)">↷</button>
            <span className="mx-1 h-5 w-px bg-[#D7DEE6]" />
            <button className={botaoBarra} onClick={() => setFonte((f) => Math.max(14, f - 1))} title="Diminuir letra">A−</button>
            <button className={botaoBarra} onClick={() => setFonte((f) => Math.min(22, f + 1))} title="Aumentar letra">A+</button>
            <button className={botaoBarra} onClick={alternarCaixa} title="Maiúsculas e minúsculas na seleção">Aa</button>
            <span className="mx-1 h-5 w-px bg-[#D7DEE6]" />
            <button
              className={`${botaoBarra} ${verRepeticoes ? "bg-[#FBF5E4] text-[#8A5A00]" : ""}`}
              onClick={() => setVerRepeticoes(!verRepeticoes)}
              title="Marca palavras usadas 3 vezes ou mais"
            >
              Repetições
            </button>
            <button className={`${botaoBarra} ${foco ? "bg-[#E7EEF4]" : ""}`} onClick={() => setFoco(!foco)} title="Esconde o painel de dicas">
              Foco
            </button>
            <button className={botaoBarra} onClick={baixar} title="Baixar o texto">Baixar</button>
            <span className="ml-auto pr-1 text-[12px] text-[#8B97A8]">
              {salvo === "salvo" ? "Salvo" : salvo === "salvando" ? "Salvando..." : "Alterações não salvas"}
            </span>
          </div>

          <div className="relative px-4 py-5 sm:px-8" onMouseMove={aoMoverMouse} onMouseLeave={() => (setDica(null), setDestaque(null))}>
            <div
              aria-hidden
              className="absolute inset-x-4 top-5 select-none whitespace-pre-wrap break-words font-serif text-transparent sm:inset-x-8"
              style={{ fontSize: fonte, lineHeight: 1.9 }}
            >
              {fundo}
            </div>
            <textarea
              ref={area}
              value={texto}
              onChange={(e) => {
                setTexto(e.target.value.slice(0, MAX_CARACTERES));
                setSalvo("pendente");
                setDica(null);
              }}
              spellCheck={false}
              placeholder="Comece pela introdução: apresente o tema e a sua tese. Depois, desenvolva os argumentos em parágrafos e feche com a conclusão."
              className="relative block w-full resize-none overflow-hidden border-0 p-0 whitespace-pre-wrap break-words bg-transparent font-serif text-[#14213A] caret-brand outline-none placeholder:text-[#9AA6B5]"
              style={{ fontSize: fonte, lineHeight: 1.9, minHeight: 420 }}
            />
            {sugestaoDica && dica && (
              <div
                className="pointer-events-none absolute z-10 w-[280px] border bg-white p-3 text-[13px] shadow-[0_12px_30px_-12px_rgba(11,42,74,0.45)]"
                style={{ left: Math.min(dica.x + 12, 9999), top: dica.y + 18, borderColor: CORES[sugestaoDica.tipo].borda }}
              >
                <p className="font-bold" style={{ color: CORES[sugestaoDica.tipo].borda }}>{sugestaoDica.titulo}</p>
                <p className="mt-1 text-[#33465E]">{sugestaoDica.explicacao}</p>
                {sugestaoDica.troca && <p className="mt-1 text-[#0B5A4D]">→ {sugestaoDica.troca}</p>}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-[#D7DEE6] px-4 py-2.5 text-[13px] text-[#516278] sm:px-8">
            <span className="font-bold" style={{ color: corLinhas }}>
              ≈ {linhas} de {banca.linhasMin}–{banca.linhasMax} linhas
            </span>
            <span>{palavras} palavras</span>
            <span>{paragrafos} parágrafos</span>
            <div className="h-1.5 min-w-[120px] flex-1 bg-[#E7EEF4]">
              <div className="h-1.5" style={{ width: `${Math.min(100, (linhas / banca.linhasMax) * 100)}%`, background: corLinhas }} />
            </div>
          </div>
        </section>

        {/* Painel da direita: dicas e envio */}
        {!foco && (
          <aside className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-4 lg:self-start">
            <section className="border border-[#D7DEE6] bg-white p-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-extrabold text-[#14213A]">Dicas</h2>
                {modo === "treino" && (
                  <button
                    onClick={() => void analisar(true)}
                    disabled={analisando || restantes <= 0}
                    className="text-[12.5px] font-bold text-brand disabled:opacity-50"
                  >
                    {analisando ? "Lendo..." : "Analisar agora"}
                  </button>
                )}
              </div>

              {modo === "simulado" ? (
                <p className="mt-2 text-[13.5px] text-[#516278]">
                  No simulado não há dicas: escreva como no dia da prova e envie para a nota.
                </p>
              ) : !prontoParaDicas(texto) && !ativas.length ? (
                <p className="mt-2 text-[13.5px] text-[#516278]">
                  As dicas aparecem depois da introdução e do início do desenvolvimento, sem interromper sua escrita.
                </p>
              ) : (
                <>
                  {comentario && <p className="mt-2 text-[13.5px] italic text-[#33465E]">{comentario}</p>}
                  {aviso && <p className="mt-2 text-[13px] text-[#8A5A00]">{aviso}</p>}
                  {!ativas.length && !analisando && !aviso && (
                    <p className="mt-2 text-[13.5px] text-[#516278]">Nenhum ajuste pendente. Continue escrevendo.</p>
                  )}
                  <ul className="mt-3 space-y-2.5">
                    {ativas.map((s, i) => (
                      <li
                        key={s.trecho + i}
                        onMouseEnter={() => setDestaque(i)}
                        onMouseLeave={() => setDestaque(null)}
                        className="border-l-[3px] bg-[#FAFBFC] px-3 py-2 text-[13px]"
                        style={{ borderColor: CORES[s.tipo].borda }}
                      >
                        <p className="flex items-center justify-between gap-2">
                          <span className="font-bold text-[#14213A]">{s.titulo}</span>
                          <span className="font-data text-[10.5px] uppercase tracking-wide" style={{ color: CORES[s.tipo].borda }}>
                            {CORES[s.tipo].nome}
                          </span>
                        </p>
                        <p className="mt-0.5 text-[#516278]">{s.explicacao}</p>
                        <div className="mt-1.5 flex gap-3">
                          {s.troca && (
                            <button onClick={() => aplicar(s)} className="font-bold text-accent-2">
                              Trocar por “{s.troca.length > 40 ? s.troca.slice(0, 40) + "…" : s.troca}”
                            </button>
                          )}
                          <button onClick={() => {
                              setDica(null);
                              setIgnoradas((x) => [...x, s.trecho]);
                            }} className="text-[#8B97A8]">
                            Ignorar
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-[11.5px] text-[#8B97A8]">{Math.max(0, restantes)} análises ao vivo restantes nesta redação</p>
                </>
              )}
            </section>

            <section className="border border-[#D7DEE6] bg-white p-4">
              <h2 className="font-display text-lg font-extrabold text-[#14213A]">Correção com nota</h2>
              <p className="mt-1 text-[13px] text-[#516278]">
                Nota pela grade da {banca.nome}, comentários por critério e sua introdução reescrita.
              </p>
              {erroCorrecao && <p className="mt-2 text-[13px] font-bold text-[#B42318]">{erroCorrecao}</p>}
              {props.saldo <= 0 ? (
                <Link prefetch={false} href="/minha-area/redacao" className="mt-3 block bg-accent px-4 py-2.5 text-center text-[14px] font-bold text-accent-ink">
                  Comprar +5 correções
                </Link>
              ) : !confirmando ? (
                <button
                  onClick={() => setConfirmando(true)}
                  disabled={linhas < MIN_LINHAS_CORRECAO}
                  className="mt-3 w-full bg-brand px-4 py-2.5 text-[14px] font-bold text-white hover:brightness-110 disabled:opacity-50"
                >
                  Enviar para correção
                </button>
              ) : (
                <div className="mt-3">
                  <p className="text-[13px] text-[#14213A]">
                    Usa 1 de {props.saldo} correções. Depois de enviada, a redação não pode ser editada.
                  </p>
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={enviarCorrecao}
                      disabled={corrigindo}
                      className="flex-1 bg-brand px-4 py-2.5 text-[14px] font-bold text-white disabled:opacity-60"
                    >
                      {corrigindo ? "Corrigindo... (até 40 s)" : "Confirmar envio"}
                    </button>
                    {!corrigindo && (
                      <button onClick={() => setConfirmando(false)} className="border border-[#C5CFDA] px-3 text-[13px] text-[#516278]">
                        Voltar
                      </button>
                    )}
                  </div>
                </div>
              )}
              {linhas < MIN_LINHAS_CORRECAO && props.saldo > 0 && (
                <p className="mt-2 text-[12px] text-[#8B97A8]">Disponível a partir de {MIN_LINHAS_CORRECAO} linhas.</p>
              )}
            </section>

            <section className="border border-[#D7DEE6] bg-white p-4 text-[12px] text-[#516278]">
              <p className="mb-1.5 font-bold text-[#33465E]">Legenda</p>
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                {(["gramatica", "coesao", "clareza", "argumento"] as Tipo[]).map((t) => (
                  <span key={t} className="flex items-center gap-1.5">
                    <span className="inline-block h-3 w-3" style={{ background: CORES[t].fundo, borderBottom: `2px solid ${CORES[t].borda}` }} />
                    {t === "argumento" ? "Argumento/estrutura" : CORES[t].nome}
                  </span>
                ))}
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-3 w-3 border-b-2 border-dotted border-[#8A5A00]" /> Repetição
                </span>
              </div>
            </section>
          </aside>
        )}
      </div>
    </div>
  );
}
