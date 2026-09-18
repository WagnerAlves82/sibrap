"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/alert";
import { concluirAulaAction } from "./actions";

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
  cursoHref,
}: {
  aulaId: string;
  youtubeId: string;
  titulo: string;
  concluidaInicial: boolean;
  proximaHref: string | null;
  cursoHref: string;
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

  const concluir = useCallback(async () => {
    if (concluidaRef.current || emAndamentoRef.current) return;
    // se o servidor recusar (ainda cedo), tenta de novo só depois de 15s
    if (Date.now() - ultimaTentativaRef.current < 15000) return;
    ultimaTentativaRef.current = Date.now();
    emAndamentoRef.current = true;
    const r = await concluirAulaAction(aulaId);
    emAndamentoRef.current = false;
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
    if (!iniciado || !alvoRef.current) return;
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
            if (e.data === 0) concluir();
          },
        },
      });
      intervalo = setInterval(() => {
        const p = playerRef.current;
        if (!p || concluidaRef.current) return;
        const duracao = p.getDuration();
        if (duracao > 0 && p.getCurrentTime() / duracao >= 0.9) concluir();
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

      <div className="mt-5 flex flex-col gap-3">
        {concluida ? (
          <Alert variant="sucesso" claro className="text-sm">
            Aula concluída! Seu progresso foi salvo.
          </Alert>
        ) : (
          <>
            {aviso && (
              <Alert variant="info" claro className="text-sm">
                {aviso}. A aula é marcada como concluída sozinha quando o vídeo termina.
              </Alert>
            )}
            <button
              type="button"
              onClick={() => {
                ultimaTentativaRef.current = 0;
                concluir();
              }}
              className="self-start text-[13px] text-[#516278] underline underline-offset-4 hover:text-brand"
            >
              Já assisti — marcar como concluída
            </button>
          </>
        )}

        <div className="flex flex-wrap items-center gap-3">
          {proximaHref && concluida && (
            <Link
              href={proximaHref}
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 text-[15px] font-bold text-accent-ink transition-colors hover:brightness-105"
            >
              Próxima aula <span aria-hidden>→</span>
            </Link>
          )}
          <Link href={cursoHref} className="text-[14px] font-semibold text-brand underline underline-offset-4">
            Voltar ao curso
          </Link>
        </div>
      </div>
    </div>
  );
}
