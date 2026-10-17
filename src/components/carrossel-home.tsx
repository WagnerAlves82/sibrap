"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

type SlideHero = { id: "metodo" | "apostila" | "simulado"; rotulo: string };

const SLIDES: SlideHero[] = [
  { id: "metodo", rotulo: "Método SIBRAP" },
  { id: "apostila", rotulo: "Apostilas" },
  { id: "simulado", rotulo: "Simulados on-line" },
];

const INTERVALO_MS = 7000;
const FUNDO = "linear-gradient(135deg, #2e3192 0%, #1f5fb0 55%, #0b7cc4 100%)";

// Leitura do navegador sem quebrar a hidratação: no servidor (e na
// primeira renderização) vale o valor do terceiro argumento.
const MQ_MOVIMENTO = "(prefers-reduced-motion: reduce)";
function assinarMovimento(aviso: () => void) {
  const mq = window.matchMedia(MQ_MOVIMENTO);
  mq.addEventListener("change", aviso);
  return () => mq.removeEventListener("change", aviso);
}

// Carrossel publicitário da home: promove o método, as apostilas e o
// simulado on-line, só com imagens reais do produto (mockups das apostilas e
// a tela do simulado). Todos os slides ocupam a mesma célula da grade: a
// altura é a do maior.
export function CarrosselHome({ precoTexto }: { precoTexto: string }) {
  const [atual, setAtual] = useState(0);
  const [pausado, setPausado] = useState(false);
  const reduzido = useSyncExternalStore(
    assinarMovimento,
    () => window.matchMedia(MQ_MOVIMENTO).matches,
    () => true
  );
  const toqueX = useRef<number | null>(null);
  const total = SLIDES.length;

  const ir = useCallback((i: number) => setAtual(((i % total) + total) % total), [total]);

  useEffect(() => {
    if (pausado || reduzido) return;
    const t = setTimeout(() => ir(atual + 1), INTERVALO_MS);
    return () => clearTimeout(t);
  }, [atual, pausado, reduzido, ir]);

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
        {SLIDES.map((s, i) => (
          <Slide key={s.id} slide={s} ativo={i === atual} indice={i} total={total} precoTexto={precoTexto} />
        ))}
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-3 z-20 flex justify-center gap-2 md:bottom-4">
        {SLIDES.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => ir(i)}
            aria-label={`Ir para o slide ${i + 1}: ${s.rotulo}`}
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
    </section>
  );
}

function Slide({
  slide,
  ativo,
  indice,
  total,
  precoTexto,
}: {
  slide: SlideHero;
  ativo: boolean;
  indice: number;
  total: number;
  precoTexto: string;
}) {
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
      style={{ background: FUNDO }}
    >
      {/* Halo luminoso atrás da imagem do produto (longe do texto) */}
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-24 right-[-6rem] h-[26rem] w-[26rem] rounded-full opacity-70 blur-3xl md:bottom-auto md:right-[6%] md:top-1/2 md:h-[34rem] md:w-[34rem] md:-translate-y-1/2"
        style={{
          background:
            "radial-gradient(circle, rgba(255,214,102,0.5) 0%, rgba(120,190,255,0.35) 45%, transparent 70%)",
        }}
      />
      <div className="relative mx-auto grid w-full max-w-[1180px] items-center gap-6 px-6 pb-14 pt-8 md:grid-cols-[1.15fr_0.85fr] md:gap-10 md:py-12">
        {slide.id === "metodo" && <Metodo prioridade={indice === 0} />}
        {slide.id === "apostila" && <Apostila precoTexto={precoTexto} />}
        {slide.id === "simulado" && <Simulado />}
      </div>
    </div>
  );
}

function Rotulo({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 inline-flex rounded bg-white/15 px-2 py-1 font-data text-[11.5px] font-semibold uppercase tracking-wide text-[#D7E6F7]">
      {children}
    </p>
  );
}

function Titulo({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-display text-[1.6rem] leading-[1.1] font-extrabold tracking-tight text-balance sm:text-[2.1rem] md:text-[2.5rem]">
      {children}
    </h2>
  );
}

function BotaoPrincipal({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-3 text-[15px] font-bold text-accent-ink shadow-[0_0_22px_rgba(255,214,102,0.45)] transition-colors hover:brightness-95"
    >
      {children} <span aria-hidden>→</span>
    </Link>
  );
}

function BotaoSecundario({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center rounded-lg border border-white/40 px-4 py-3 text-[14.5px] font-semibold text-white transition-colors hover:bg-white/10"
    >
      {children}
    </Link>
  );
}

// No celular cada benefício vira um chip curto (c); no resto, a frase completa (d).
function Itens({ itens }: { itens: { t: string; d: string; c: string }[] }) {
  return (
    <ul className="mt-4 flex flex-wrap gap-2 sm:grid">
      {itens.map((b) => (
        <li
          key={b.t}
          className="flex items-start gap-3 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-[13.5px] leading-snug backdrop-blur-sm"
        >
          <span aria-hidden className="mt-0.5 text-accent">
            ✓
          </span>
          <span>
            <strong className="font-bold">{b.t}.</strong>{" "}
            <span className="text-[#D7E6F7] sm:hidden">{b.c}</span>
            <span className="hidden text-[#D7E6F7] sm:inline">{b.d}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

function Metodo({ prioridade }: { prioridade: boolean }) {
  return (
    <>
      <div className="max-w-[620px]">
        <Rotulo>Método SIBRAP</Rotulo>
        <Titulo>Seu sonho de conquistar uma vaga no concurso pode estar mais perto do que você imagina!</Titulo>
        <p className="mt-3 text-[15px] text-[#D7E6F7] md:text-base">
          Com o método de aprovação SIBRAP, você se prepara de forma crescente e organizada.
        </p>
        <Itens
          itens={[
            { t: "Estude aos poucos", d: "3 páginas de leitura por dia e até 7 exercícios diários", c: "3 páginas por dia" },
            { t: "Estude pelo celular", d: "Pratique de onde estiver", c: "de onde estiver" },
            { t: "Simulados on-line", d: "Personalizáveis, começando com 30 questões do seu edital", c: "personalizáveis" },
          ]}
        />
        <p className="mt-3 hidden text-[13.5px] text-[#D7E6F7] md:block">
          Assim, você avança um pouco a cada dia e fortalece sua preparação para conquistar sua vaga.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <BotaoPrincipal href="#apostilas">Quero começar minha preparação</BotaoPrincipal>
          <BotaoSecundario href="#metodo">Conheça o método</BotaoSecundario>
        </div>
      </div>
      <div aria-hidden className="relative justify-self-center">
        <Image
          src="/hero-mockup-curitiba.webp"
          alt=""
          width={402}
          height={720}
          priority={prioridade}
          sizes="290px"
          className="h-auto w-[104px] rotate-[3deg] drop-shadow-[0_18px_40px_rgba(0,0,0,0.45)] md:w-[230px] lg:w-[270px]"
        />
      </div>
    </>
  );
}

function Apostila({ precoTexto }: { precoTexto: string }) {
  return (
    <>
      <div className="max-w-[620px]">
        <Rotulo>Apostilas em PDF</Rotulo>
        <Titulo>A apostila certa para o seu cargo, na ordem do edital.</Titulo>
        <p className="mt-3 text-[15px] text-[#D7E6F7] md:text-base">
          Material montado a partir do edital oficial, só com o que cai na sua prova, e acesso ao ambiente de estudos
          para praticar.
        </p>
        <Itens
          itens={[
            { t: "Conteúdo completo", d: "Teoria na ordem do edital, com dicas, exemplos e resumos de cada capítulo", c: "na ordem do edital" },
            { t: "Questões comentadas", d: "Exercícios de fixação em cada tema, com gabarito explicado", c: "gabarito explicado" },
            { t: "Pagamento único por PIX", d: "Download liberado logo após a confirmação", c: "download imediato" },
          ]}
        />
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <BotaoPrincipal href="#apostilas">Escolher minha apostila</BotaoPrincipal>
          <span className="font-data text-[13px] font-semibold text-[#D7E6F7]">{precoTexto}</span>
        </div>
      </div>
      <div aria-hidden className="relative flex items-end justify-center justify-self-center">
        <Image
          src="/hero-mockup-itajai.webp"
          alt=""
          width={481}
          height={720}
          sizes="170px"
          className="relative z-10 -mr-4 h-auto w-[78px] -rotate-[4deg] drop-shadow-[0_14px_30px_rgba(0,0,0,0.45)] md:-mr-6 md:w-[150px] lg:w-[170px]"
        />
        <Image
          src="/hero-mockup-curitiba.webp"
          alt=""
          width={402}
          height={720}
          sizes="200px"
          className="relative z-20 h-auto w-[92px] drop-shadow-[0_18px_40px_rgba(0,0,0,0.5)] md:w-[170px] lg:w-[200px]"
        />
        <Image
          src="/hero-mockup-amapa.webp"
          alt=""
          width={478}
          height={720}
          sizes="170px"
          className="relative z-10 -ml-4 h-auto w-[78px] rotate-[4deg] drop-shadow-[0_14px_30px_rgba(0,0,0,0.45)] md:-ml-6 md:w-[150px] lg:w-[170px]"
        />
      </div>
    </>
  );
}

function Simulado() {
  return (
    <>
      <div className="max-w-[620px]">
        <Rotulo>Simulado on-line</Rotulo>
        <Titulo>Treine com simulados no estilo da sua banca.</Titulo>
        <p className="mt-3 text-[15px] text-[#D7E6F7] md:text-base">
          Monte o simulado do seu jeito, comece com 30 questões distribuídas entre as matérias do edital e avance no
          seu ritmo, pelo celular ou pelo computador.
        </p>
        <Itens
          itens={[
            { t: "Gabarito comentado", d: "Entenda cada resposta, com a explicação da questão", c: "entenda cada resposta" },
            { t: "Continue de onde parou", d: "Suas respostas ficam salvas e você retoma depois", c: "respostas salvas" },
            { t: "Dica SIBRAP", d: "Peça ajuda quando travar, com os créditos que você ganha ao estudar", c: "ajuda quando travar" },
          ]}
        />
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <BotaoPrincipal href="#simulado-online">Conhecer o simulado</BotaoPrincipal>
          <BotaoSecundario href="#apostilas">Ver as apostilas</BotaoSecundario>
        </div>
      </div>
      <div aria-hidden className="relative justify-self-center">
        <div className="w-[230px] md:w-[280px] overflow-hidden rounded-2xl border border-white/30 bg-white shadow-[0_18px_50px_rgba(0,0,0,0.45),0_0_40px_rgba(255,214,102,0.25)] lg:w-[320px]">
          <Image
            src="/hero-simulado.webp"
            alt=""
            width={560}
            height={733}
            sizes="320px"
            className="h-[130px] w-full object-cover object-top md:h-[300px] lg:h-[340px]"
          />
        </div>
      </div>
    </>
  );
}
