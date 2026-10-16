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
  // slide institucional do método (sem concurso específico)
  metodo?: boolean;
  hrefSecundario?: string;
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
      aria-label="Destaques"
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
  if (slide.metodo) return <SlideMetodo slide={slide} ativo={ativo} indice={indice} total={total} />;
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

// Slide do método: promessa, benefícios e a apostila real com halo de luz.
// Os dados vêm só de texto e da imagem do produto (nada de tela inventada).
function SlideMetodo({
  slide,
  ativo,
  indice,
  total,
}: {
  slide: SlideComCta;
  ativo: boolean;
  indice: number;
  total: number;
}) {
  const beneficios = [
    { t: "Estude aos poucos", d: "3 páginas de leitura por dia e até 7 exercícios diários", c: "3 páginas por dia" },
    { t: "Estude pelo celular", d: "Pratique de onde estiver", c: "de onde estiver" },
    { t: "Simulados on-line", d: "Personalizáveis, começando com 30 questões do seu edital", c: "personalizáveis" },
  ];
  return (
    <div
      role="group"
      aria-roledescription="slide"
      aria-label={`${indice + 1} de ${total}`}
      aria-hidden={!ativo}
      inert={!ativo}
      className={`relative col-start-1 row-start-1 flex flex-col overflow-hidden transition-opacity duration-700 md:flex-row md:items-center ${
        ativo ? "z-10 opacity-100" : "z-0 opacity-0"
      }`}
      style={{ background: "linear-gradient(135deg, #2e3192 0%, #1f5fb0 55%, #0b7cc4 100%)" }}
    >
      {/* Halo luminoso atrás da apostila (só no fundo, longe do texto) */}
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-24 right-[-6rem] h-[26rem] w-[26rem] rounded-full opacity-70 blur-3xl md:bottom-auto md:right-[6%] md:top-1/2 md:h-[34rem] md:w-[34rem] md:-translate-y-1/2"
        style={{ background: "radial-gradient(circle, rgba(255,214,102,0.55) 0%, rgba(120,190,255,0.35) 45%, transparent 70%)" }}
      />

      <div className="relative mx-auto grid w-full max-w-[1180px] items-center gap-6 px-6 pb-6 pt-8 md:grid-cols-[1.15fr_0.85fr] md:gap-10 md:py-12">
        <div className="max-w-[620px]">
          <p className="mb-3 inline-flex rounded bg-white/15 px-2 py-1 font-data text-[11.5px] font-semibold uppercase tracking-wide text-[#D7E6F7]">
            Método SIBRAP
          </p>
          <h2 className="font-display text-[1.6rem] leading-[1.1] font-extrabold tracking-tight text-balance sm:text-[2.1rem] md:text-[2.5rem]">
            Seu sonho de conquistar uma vaga no concurso pode estar mais perto do que você imagina!
          </h2>
          <p className="mt-3 text-[15px] text-[#D7E6F7] md:text-base">
            Com o método de aprovação SIBRAP, você se prepara de forma crescente e organizada.
          </p>

          <ul className="mt-4 flex flex-wrap gap-2 sm:grid">
            {beneficios.map((b) => (
              <li
                key={b.t}
                className="flex items-start gap-3 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-[13.5px] leading-snug backdrop-blur-sm"
              >
                <span aria-hidden className="mt-0.5 text-accent">✓</span>
                <span>
                  <strong className="font-bold">{b.t}.</strong>{" "}
                  <span className="text-[#D7E6F7] sm:hidden">{b.c}</span>
                  <span className="hidden text-[#D7E6F7] sm:inline">{b.d}</span>
                </span>
              </li>
            ))}
          </ul>

          <p className="mt-3 hidden text-[13.5px] text-[#D7E6F7] md:block">
            Assim, você avança um pouco a cada dia e fortalece sua preparação para conquistar sua vaga.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link
              href={slide.href}
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-3 text-[15px] font-bold text-accent-ink shadow-[0_0_22px_rgba(255,214,102,0.45)] transition-colors hover:brightness-95"
            >
              {slide.cta} <span aria-hidden>→</span>
            </Link>
            {slide.hrefSecundario && (
              <Link
                href={slide.hrefSecundario}
                className="inline-flex items-center rounded-lg border border-white/40 px-4 py-3 text-[14.5px] font-semibold text-white transition-colors hover:bg-white/10"
              >
                Conheça o método
              </Link>
            )}
          </div>
        </div>

        <div aria-hidden className="relative hidden justify-self-center md:block">
          <Image
            src="/mockup-curitiba1.png"
            alt=""
            width={1340}
            height={2400}
            priority={indice === 0}
            sizes="(min-width: 768px) 280px, 1px"
            className="h-auto w-[250px] rotate-[3deg] drop-shadow-[0_18px_40px_rgba(0,0,0,0.45)] lg:w-[290px]"
          />
        </div>
      </div>
    </div>
  );
}
