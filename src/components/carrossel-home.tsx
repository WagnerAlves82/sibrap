"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { diasAte, formatarDataIso } from "@/lib/apostilas";
import type { SlideHome } from "@/lib/home-slides";

export type SlideComCta = SlideHome & {
  href: string;
  cta: string;
  emProducao: boolean;
};

const INTERVALO_MS = 6500;

// Leituras do navegador sem quebrar a hidratação: no servidor (e na
// primeira renderização) valem os valores do segundo argumento.
const MQ_MOVIMENTO = "(prefers-reduced-motion: reduce)";
function assinarMovimento(aviso: () => void) {
  const mq = window.matchMedia(MQ_MOVIMENTO);
  mq.addEventListener("change", aviso);
  return () => mq.removeEventListener("change", aviso);
}
const semAssinatura = () => () => {};
function dataDeHoje(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Carrossel de concursos em destaque. Desktop: foto do órgão + texto à
// esquerda. Celular: slide desenhado em código (gradiente da marca,
// contagem regressiva, dados do concurso) — não carrega imagem pesada.
// Todos os slides ocupam a mesma célula da grade: a altura é a do maior.
export function CarrosselHome({ slides }: { slides: SlideComCta[] }) {
  const [atual, setAtual] = useState(0);
  const [pausado, setPausado] = useState(false);
  const reduzido = useSyncExternalStore(
    assinarMovimento,
    () => window.matchMedia(MQ_MOVIMENTO).matches,
    () => true
  );
  const hojeIso = useSyncExternalStore(semAssinatura, dataDeHoje, () => "");
  const toqueX = useRef<number | null>(null);
  const total = slides.length;

  const ir = useCallback((i: number) => setAtual(((i % total) + total) % total), [total]);

  useEffect(() => {
    if (pausado || reduzido || total < 2) return;
    const t = setTimeout(() => ir(atual + 1), INTERVALO_MS);
    return () => clearTimeout(t);
  }, [atual, pausado, reduzido, total, ir]);

  if (total === 0) return null;

  return (
    <section
      aria-roledescription="carrossel"
      aria-label="Concursos em destaque"
      className="relative overflow-hidden bg-[#2e3192] text-white"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onFocus={() => setPausado(true)}
      onBlur={() => setPausado(false)}
      onTouchStart={(e) => {
        toqueX.current = e.touches[0].clientX;
        setPausado(true);
      }}
      onTouchEnd={(e) => {
        const inicio = toqueX.current;
        toqueX.current = null;
        setPausado(false);
        if (inicio === null) return;
        const dx = e.changedTouches[0].clientX - inicio;
        if (Math.abs(dx) > 45) ir(atual + (dx < 0 ? 1 : -1));
      }}
    >
      <div className="grid">
        {slides.map((s, i) => (
          <Slide key={s.id} slide={s} ativo={i === atual} indice={i} total={total} hoje={hojeIso} />
        ))}
      </div>

      {total > 1 && (
        <>
          <div className="pointer-events-none absolute inset-x-0 bottom-3 z-20 flex justify-center gap-2 md:bottom-4">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => ir(i)}
                aria-label={`Ir para o slide ${i + 1}: ${s.cidade}`}
                aria-current={i === atual}
                className="pointer-events-auto flex h-6 w-6 items-center justify-center"
              >
                <span
                  className={`block h-2 rounded-full transition-all ${
                    i === atual ? "w-7 bg-accent" : "w-2 bg-white/50 hover:bg-white/80"
                  }`}
                />
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => ir(atual - 1)}
            aria-label="Slide anterior"
            className="absolute left-3 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-xl backdrop-blur transition-colors hover:bg-white/30 lg:flex"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => ir(atual + 1)}
            aria-label="Próximo slide"
            className="absolute right-3 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-xl backdrop-blur transition-colors hover:bg-white/30 lg:flex"
          >
            ›
          </button>
        </>
      )}
    </section>
  );
}

function Slide({
  slide,
  ativo,
  indice,
  total,
  hoje,
}: {
  slide: SlideComCta;
  ativo: boolean;
  indice: number;
  total: number;
  hoje: string;
}) {
  const dias = hoje ? diasAte(slide.provaIso, new Date(`${hoje}T12:00:00`)) : null;
  const contagem =
    dias === null ? null : dias < 0 ? "Prova realizada" : dias === 0 ? "A prova é hoje" : dias === 1 ? "Falta 1 dia" : `Faltam ${dias} dias`;

  return (
    <div
      role="group"
      aria-roledescription="slide"
      aria-label={`${indice + 1} de ${total}`}
      aria-hidden={!ativo}
      inert={!ativo}
      className={`relative col-start-1 row-start-1 flex min-h-[430px] flex-col overflow-hidden transition-opacity duration-700 md:min-h-0 md:aspect-[1920/700] md:max-h-[560px] md:flex-row md:items-center ${
        ativo ? "z-10 opacity-100" : "z-0 opacity-0"
      }`}
      style={{ background: "linear-gradient(135deg, #2e3192 0%, #1f5fb0 55%, #0b7cc4 100%)" }}
    >
      {/* Desktop: foto do órgão na coluna da direita, colada na borda
          direita da tela, sem cantos arredondados; só o lado esquerdo
          esmaece para encontrar o fundo do slide. */}
      <div
        aria-hidden
        className="absolute inset-y-0 right-0 hidden w-[62%] md:block"
        style={{
          maskImage: "linear-gradient(to right, transparent 0%, #000 28%)",
          WebkitMaskImage: "linear-gradient(to right, transparent 0%, #000 28%)",
        }}
      >
        <Image
          src={slide.imagem}
          alt=""
          fill
          priority={indice === 0}
          sizes="(min-width: 768px) 62vw, 1px"
          className="rounded-none object-cover object-right"
        />
      </div>
      {/* Desenho do celular: círculos suaves no fundo */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/[0.07] md:hidden"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-white/[0.06] md:hidden"
      />

      <div className="relative mx-auto w-full max-w-[1180px] px-6 pb-6 pt-8 md:py-10">
        <div className="max-w-[560px]">
          <p className="mb-3 inline-flex flex-wrap items-center gap-2 font-data text-[11.5px] font-semibold uppercase tracking-wide text-[#D7E6F7]">
            <span className="rounded bg-white/15 px-2 py-1">{slide.uf} · {slide.cidade}</span>
            <span className="rounded bg-white/15 px-2 py-1">{slide.edital}</span>
          </p>

          <h2 className="font-display text-[1.75rem] leading-[1.08] font-extrabold tracking-tight text-balance sm:text-[2.3rem] md:text-[2.7rem]">
            {slide.titulo}
          </h2>
          <p className="mt-2.5 text-[15px] text-[#D7E6F7] md:text-base">{slide.subtitulo}</p>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span
              className="inline-flex min-w-[8.5rem] items-center gap-2 rounded-lg bg-accent px-3 py-2 font-data text-[13px] font-bold text-accent-ink"
              aria-live="off"
            >
              <span aria-hidden>⏳</span>
              {contagem ?? `Prova ${formatarDataIso(slide.provaIso)}`}
            </span>
            {slide.fatos.map((f) => (
              <span
                key={f.rotulo}
                className="rounded-lg border border-white/25 bg-white/10 px-3 py-2 text-[12.5px] leading-tight backdrop-blur-sm"
              >
                <span className="block text-[10.5px] uppercase tracking-wide text-[#B9D0EA]">{f.rotulo}</span>
                <span className="font-semibold">{f.valor}</span>
              </span>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href={slide.href}
              className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-3 text-[15px] font-bold text-brand shadow-lg transition-colors hover:bg-[#f3f7fb]"
            >
              {slide.cta} <span aria-hidden>→</span>
            </Link>
            {slide.emProducao && (
              <span className="rounded-full border border-white/30 px-3 py-1.5 text-[12px] font-semibold text-[#D7E6F7]">
                Apostila em produção
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Celular: a imagem vai para o rodapé do slide (position bottom),
          de ponta a ponta, sem bordas arredondadas. */}
      <div aria-hidden className="relative mt-auto h-44 w-full shrink-0 md:hidden">
        <Image
          src={slide.imagem}
          alt=""
          fill
          sizes="(max-width: 767px) 100vw, 1px"
          className="rounded-none object-cover object-right-bottom"
        />
        <span className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#1f5fb0] to-transparent" />
      </div>
    </div>
  );
}
