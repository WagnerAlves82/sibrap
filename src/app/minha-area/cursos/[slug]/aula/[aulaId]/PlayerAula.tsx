"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/alert";
import { concluirAulaAction } from "./actions";
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
  const quizOk = concluidaInicial || totalQuiz === 0 || respondidas >= totalQuiz;
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

      <QuizAula.Provider value={setRespondidas}>{children}</QuizAula.Provider>

      <div className="mt-8 flex flex-col gap-3 border-t border-[#D7DEE6] pt-6">
        {concluida ? (
          <Alert variant="sucesso" claro className="text-sm">
            Aula concluída! Seu progresso foi salvo.{" "}
            {proximaHref ? (
              <Link href={proximaHref} className="font-bold underline underline-offset-4">
                Ir para a próxima aula →
              </Link>
            ) : (
              <Link href={provaHref} className="font-bold underline underline-offset-4">
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
        onConcluir={() => {
          ultimaTentativaRef.current = 0;
          concluir();
        }}
      />
    </div>
  );
}
