"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/alert";
import { concluirAulaAction, registrarTempoAulaAction } from "./actions";
import { BarraAula, QuizAula, type ItemLista } from "./BarraAula";

type YTPlayer = {
  getCurrentTime(): number;
  getDuration(): number;
  destroy(): void;
};

type YTApi = {
  Player: new (
    el: HTMLElement,
    opts: {
      videoId: string;
      host?: string;
      playerVars?: Record<string, number>;
      events?: { onStateChange?: (e: { data: number }) => void };
    }
  ) => YTPlayer;
};

declare global {
  interface Window {
    YT?: YTApi;
    onYouTubeIframeAPIReady?: () => void;
  }
}

function carregarApiYouTube(): Promise<YTApi> {
  return new Promise((resolve) => {
    if (window.YT?.Player) return resolve(window.YT);
    const anterior = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      anterior?.();
      resolve(window.YT!);
    };
    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(script);
    }
  });
}

export function PlayerAula({
  aulaId,
  youtubeId,
  titulo,
  concluidaInicial,
  proximaHref,
  anteriorHref,
  provaHref,
  certificadoHref,
  lista,
  feitasInicial,
  totalQuiz,
  tempoMinSeg = null,
  tempoSegInicial = 0,
  children,
}: {
  aulaId: string;
  youtubeId: string | null;
  titulo: string;
  concluidaInicial: boolean;
  proximaHref: string | null;
  anteriorHref: string | null;
  provaHref: string;
  certificadoHref: string;
  lista: ItemLista[];
  feitasInicial: number;
  totalQuiz: number;
  /** tempo mínimo com a aula aberta antes de concluir (cursos com controle de tempo, ex.: NR-10) */
  tempoMinSeg?: number | null;
  tempoSegInicial?: number;
  children?: React.ReactNode;
}) {
  const router = useRouter();
  const [iniciado, setIniciado] = useState(false);
  const [concluida, setConcluida] = useState(concluidaInicial);
  const [aviso, setAviso] = useState<string | null>(null);
  const alvoRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const emAndamentoRef = useRef(false);
  const ultimaTentativaRef = useRef(0);
  const concluidaRef = useRef(concluidaInicial);
  const [concluindo, setConcluindo] = useState(false);
  // "Concluir" só depois de responder todas as questões do "Fixe o que aprendeu" (aula já concluída não trava)
  const [respondidas, setRespondidas] = useState(0);
  const quizRespondido = concluidaInicial || totalQuiz === 0 || respondidas >= totalQuiz;
  const tempo = useCronometroAula(aulaId, tempoMinSeg, tempoSegInicial, concluida);
  const quizOk = quizRespondido && tempo.ok;
  const quizOkRef = useRef(quizOk);
  useEffect(() => {
    quizOkRef.current = quizOk;
  }, [quizOk]);

  const concluir = useCallback(async () => {
    if (concluidaRef.current || emAndamentoRef.current) return;
    // se o servidor recusar (ainda cedo), tenta de novo só depois de 15s
    if (Date.now() - ultimaTentativaRef.current < 15000) return;
    ultimaTentativaRef.current = Date.now();
    emAndamentoRef.current = true;
    setConcluindo(true);
    const r = await concluirAulaAction(aulaId);
    emAndamentoRef.current = false;
    setConcluindo(false);
    if ("ok" in r) {
      concluidaRef.current = true;
      setConcluida(true);
      setAviso(null);
      router.refresh();
    } else {
      setAviso(r.erro);
    }
  }, [aulaId, router]);

  useEffect(() => {
    if (!iniciado || !alvoRef.current || !youtubeId) return;
    let intervalo: ReturnType<typeof setInterval> | undefined;
    let cancelado = false;

    carregarApiYouTube().then((YT) => {
      if (cancelado || !alvoRef.current) return;
      playerRef.current = new YT.Player(alvoRef.current, {
        videoId: youtubeId,
        host: "https://www.youtube-nocookie.com",
        playerVars: { rel: 0, modestbranding: 1, playsinline: 1, autoplay: 1 },
        events: {
          onStateChange: (e) => {
            if (e.data === 0 && quizOkRef.current) concluir();
          },
        },
      });
      intervalo = setInterval(() => {
        const p = playerRef.current;
        if (!p || concluidaRef.current) return;
        const duracao = p.getDuration();
        if (duracao > 0 && p.getCurrentTime() / duracao >= 0.9 && quizOkRef.current) concluir();
      }, 3000);
    });

    return () => {
      cancelado = true;
      if (intervalo) clearInterval(intervalo);
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [iniciado, youtubeId, concluir]);

  return (
    <div>
      {youtubeId ? (
        <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-brand-deep">
          {iniciado ? (
            <div ref={alvoRef} className="h-full w-full [&>iframe]:h-full [&>iframe]:w-full" />
          ) : (
            <button
              type="button"
              onClick={() => setIniciado(true)}
              aria-label={`Assistir: ${titulo}`}
              className="group absolute inset-0 flex items-center justify-center"
            >
              {/* miniatura leve: o vídeo só carrega quando a pessoa toca (economiza dados) */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`}
                alt=""
                className="absolute inset-0 h-full w-full object-cover opacity-70"
              />
              <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-accent text-2xl text-accent-ink shadow-lg transition-transform group-hover:scale-110">
                ▶
              </span>
            </button>
          )}
        </div>
      ) : (
        // aula só em texto: nada de "vídeo" falso (os alunos achavam que precisavam assistir algo para avançar)
        <p className="border-l-4 border-accent bg-white px-4 py-3 text-[16px] leading-relaxed text-[#33465E]">
          <strong className="text-[#14213A]">Como avançar:</strong> estude a aula, responda o &quot;Fixe o que aprendeu&quot; no fim
          da página e toque em <strong>Concluir aula</strong>, na barra de baixo.
        </p>
      )}

      {tempoMinSeg ? <PainelTempo tempo={tempo} minSeg={tempoMinSeg} concluida={concluida} /> : null}

      <QuizAula.Provider value={setRespondidas}>{children}</QuizAula.Provider>

      <div className="mt-8 flex flex-col gap-3 border-t border-[#D7DEE6] pt-6">
        {concluida ? (
          <Alert variant="sucesso" claro className="text-sm">
            Aula concluída! Seu progresso foi salvo.{" "}
            {proximaHref ? (
              <Link prefetch={false} href={proximaHref} className="font-bold underline underline-offset-4">
                Ir para a próxima aula →
              </Link>
            ) : (
              <Link prefetch={false} href={provaHref} className="font-bold underline underline-offset-4">
                Fazer a prova final →
              </Link>
            )}
          </Alert>
        ) : aviso ? (
          <Alert variant="info" claro className="text-sm">
            {aviso}.
          </Alert>
        ) : null}
      </div>

      <BarraAula
        lista={lista}
        anteriorHref={anteriorHref}
        proximaHref={proximaHref}
        provaHref={provaHref}
        certificadoHref={certificadoHref}
        feitas={feitasInicial + (concluida && !concluidaInicial ? 1 : 0)}
        concluida={concluida}
        quizOk={quizOk}
        concluindo={concluindo}
        {...(!tempo.ok
          ? {
              dicaBloqueio: `Faltam ${mmss(tempo.falta)} de estudo nesta aula. O tempo conta com a aula aberta na tela.`,
              alvoDica: "tempo-de-estudo",
              rotuloBloqueado: tempo.falta > 0 ? `⏱ ${mmss(tempo.falta)}` : "⏱ Salvando...",
            }
          : {})}
        onConcluir={() => {
          ultimaTentativaRef.current = 0;
          concluir();
        }}
      />
    </div>
  );
}

// ---------- controle de tempo de estudo (sem vídeo) ----------
// A aula aberta e visível manda um sinal ao banco a cada 30 s (registrar_tempo_aula); o banco soma no
// máximo 30 s por sinal e é ele quem decide se a aula pode ser concluída. Aqui o relógio só mostra.
type Tempo = { seg: number; ok: boolean; falta: number };

function mmss(seg: number) {
  const s = Math.max(0, Math.ceil(seg));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function useCronometroAula(aulaId: string, minSeg: number | null, inicial: number, concluida: boolean): Tempo {
  const [servidor, setServidor] = useState(inicial);
  const [extra, setExtra] = useState(0);
  const ativo = !!minSeg && !concluida;

  useEffect(() => {
    if (!ativo) return;
    let ultimoSinal = Date.now();
    const sinal = async () => {
      if (document.visibilityState !== "visible") return;
      const data = await registrarTempoAulaAction(aulaId).catch(() => null);
      ultimoSinal = Date.now();
      if (typeof data === "number") {
        setServidor(data);
        setExtra(0);
      }
    };
    sinal();
    const a = setInterval(sinal, 30000);
    // relógio na tela (só enquanto a aba está visível; nunca adianta mais de 30 s do que o banco já somou)
    const b = setInterval(() => {
      if (document.visibilityState === "visible") setExtra(Math.min(30, Math.floor((Date.now() - ultimoSinal) / 1000)));
    }, 1000);
    const aoVoltar = () => {
      if (document.visibilityState === "visible") sinal();
    };
    document.addEventListener("visibilitychange", aoVoltar);
    return () => {
      clearInterval(a);
      clearInterval(b);
      document.removeEventListener("visibilitychange", aoVoltar);
    };
  }, [ativo, aulaId]);

  const seg = servidor + extra;
  if (!minSeg || concluida) return { seg, ok: true, falta: 0 };
  return { seg, ok: servidor >= minSeg, falta: Math.max(0, minSeg - seg) };
}

function PainelTempo({ tempo, minSeg, concluida }: { tempo: Tempo; minSeg: number; concluida: boolean }) {
  const pct = Math.min(100, Math.round((tempo.seg / minSeg) * 100));
  const pronto = concluida || tempo.ok;
  return (
    <div id="tempo-de-estudo" className="mt-4 scroll-mt-6 border border-[#D7DEE6] bg-white px-4 py-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-[15px] font-bold text-[#14213A]">
          ⏱ Tempo de estudo nesta aula: {mmss(Math.min(tempo.seg, minSeg))} de {mmss(minSeg)}
        </p>
        <p className={`text-[13.5px] font-semibold ${pronto ? "text-accent-2" : "text-[#516278]"}`}>
          {pronto ? "✓ Tempo mínimo cumprido" : `Faltam ${mmss(tempo.falta)}`}
        </p>
      </div>
      <div className="mt-2 h-1.5 bg-[#EEF2F6]" aria-hidden>
        <div className="h-1.5 bg-accent-2 transition-all" style={{ width: `${pronto ? 100 : pct}%` }} />
      </div>
      {!pronto && (
        <p className="mt-2 text-[13.5px] leading-snug text-[#516278]">
          Este curso tem controle de tempo de estudo: o relógio só conta com a aula aberta na tela. Leia com calma; o botão
          Concluir libera quando o tempo terminar.
        </p>
      )}
    </div>
  );
}
