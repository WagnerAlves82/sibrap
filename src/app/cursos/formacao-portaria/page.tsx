import type { Metadata } from "next";
import Image from "next/image";
import { CabecalhoSite, RodapeSite } from "@/components/site-chrome";
import { Reveal } from "@/components/reveal";
import { BarraCompraFixa } from "@/components/barra-compra-fixa";
import {
  AREA_FORMACAO_PORTARIA,
  CURSOS_FORMACAO_PORTARIA,
  FORMACAO_PORTARIA,
  PERGUNTAS_FORMACAO_PORTARIA,
  PRECO_SEPARADOS_PORTARIA_CENTAVOS,
  reaisPortaria,
} from "@/lib/formacao-portaria";

// Formação Profissional em Portaria e Condomínios: landing de venda (anúncios do Meta), fora da vitrine,
// indexável no Google quando a venda abrir. Sem nomes de cidades: a cidade fica só na segmentação do anúncio.
export const revalidate = 3600;

const F = FORMACAO_PORTARIA;
const SITE = "https://sibrap.tec.br";
const PRECO = reaisPortaria(F.precoCentavos);
const SEPARADOS = reaisPortaria(PRECO_SEPARADOS_PORTARIA_CENTAVOS);
const ECONOMIA = reaisPortaria(PRECO_SEPARADOS_PORTARIA_CENTAVOS - F.precoCentavos);
const CHECKOUT = `/cadastro?next=${encodeURIComponent(AREA_FORMACAO_PORTARIA)}`;
const HERO = { src: "/agp.webp", w: 1200, h: 670, alt: "Agentes de portaria trabalhando na guarita, com rádios HT, livro de ocorrências e monitores das câmeras" };

export const metadata: Metadata = {
  title: { absolute: `${F.titulo} | SIBRAP` },
  description: F.descricao,
  keywords: [...F.palavrasChave],
  alternates: { canonical: F.caminho },
  robots: F.vendaAberta ? { index: true, follow: true } : { index: false, follow: false },
  openGraph: {
    title: F.titulo,
    description: F.descricao,
    url: F.caminho,
    siteName: "SIBRAP",
    locale: "pt_BR",
    type: "website",
    images: [{ url: HERO.src, width: HERO.w, height: HERO.h, alt: HERO.alt }],
  },
};

function Oferta({ escuro = false }: { escuro?: boolean }) {
  return (
    <div className={escuro ? "text-white" : "text-[#14213A]"}>
      <p className={`flex flex-wrap items-baseline gap-x-3`}>
        <span className={`text-lg line-through ${escuro ? "text-[#9FB3C8]" : "text-[#8A97A8]"}`}>{SEPARADOS}</span>
        <strong className="font-display text-5xl font-extrabold leading-none">{PRECO}</strong>
      </p>
      <p className={`mt-2 text-[14.5px] ${escuro ? "text-[#C9D6E5]" : "text-[#516278]"}`}>
        no PIX ou em até {F.parcela} no cartão · economia de {ECONOMIA}
      </p>
    </div>
  );
}

export default function FormacaoPortariaPage() {
  const url = `${SITE}${F.caminho}`;
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Course",
      name: F.nome,
      description: F.resumo,
      url,
      inLanguage: "pt-BR",
      keywords: F.palavrasChave.join(", "),
      educationalCredentialAwarded:
        "3 certificados de curso livre: Agente de Portaria (60 h), Informática para Portaria e Condomínios (40 h) e LGPD na Prática (20 h)",
      timeRequired: `PT${F.horasTotais}H`,
      provider: { "@type": "Organization", name: "SIBRAP", sameAs: SITE },
      hasCourseInstance: { "@type": "CourseInstance", courseMode: "online", courseWorkload: `PT${F.horasTotais}H` },
      hasPart: CURSOS_FORMACAO_PORTARIA.map((c) => ({ "@type": "Course", name: c.nome, description: c.texto, timeRequired: `PT${c.horas}H` })),
      offers: {
        "@type": "Offer",
        category: "Paid",
        price: (F.precoCentavos / 100).toFixed(2),
        priceCurrency: "BRL",
        availability: "https://schema.org/InStock",
        url,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: PERGUNTAS_FORMACAO_PORTARIA.map((q) => ({ "@type": "Question", name: q.p, acceptedAnswer: { "@type": "Answer", text: q.r } })),
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-surface-2 font-body">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <CabecalhoSite />

      <main className="flex-1">
        {/* Topo */}
        <section className="overflow-hidden bg-[#0B2A4A] text-white">
          <div className="mx-auto grid w-full max-w-[1180px] items-center gap-10 px-6 py-14 sm:py-16 md:grid-cols-2">
            <Reveal variante="esquerda">
              <p className="inline-block border-l-4 border-accent pl-3 font-display text-[20px] font-extrabold uppercase leading-tight tracking-wide text-accent sm:text-[24px]">
                Formação Profissional em Portaria e Condomínios
              </p>
              <h1 className="mt-3 max-w-[20ch] font-display text-4xl font-extrabold leading-tight sm:text-5xl">
                3 cursos, 3 certificados. A portaria completa.
              </h1>
              <p className="mt-4 max-w-[52ch] text-[17px] leading-relaxed text-[#C9D6E5]">
                Agente de Portaria, Informática para Portaria e LGPD: o que o condomínio espera de um profissional
                hoje, em 120 horas online.
              </p>
              <div className="mt-6">
                <Oferta escuro />
              </div>
              <a
                href={CHECKOUT}
                className="btn-pulso brilho mt-7 inline-flex items-center gap-2 bg-accent px-7 py-4 text-[16px] font-extrabold text-accent-ink"
              >
                Quero minha formação →
              </a>
            </Reveal>
            <Reveal variante="direita" delay={150}>
              <Image
                src={HERO.src}
                alt={HERO.alt}
                width={HERO.w}
                height={HERO.h}
                priority
                sizes="(min-width: 768px) 540px, 90vw"
                className="mx-auto h-auto w-full max-w-[540px] border-2 border-accent"
              />
            </Reveal>
          </div>
        </section>

        {/* Os 3 cursos */}
        <section className="mx-auto w-full max-w-[1180px] px-6 py-14">
          <Reveal>
            <h2 className="font-display text-3xl font-extrabold text-[#14213A]">Curso de porteiro online com certificado</h2>
            <p className="mt-3 max-w-[78ch] text-[16px] leading-relaxed text-[#516278]">{F.resumo}</p>
            <div className="mt-7 grid grid-cols-1 gap-5 md:grid-cols-3">
              {CURSOS_FORMACAO_PORTARIA.map((c) => (
                <article key={c.n} className="flex flex-col overflow-hidden border border-[#D7DEE6] border-t-4 border-t-accent bg-white">
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-2">
                    <Image src={c.foto} alt={c.alt} fill sizes="(min-width: 768px) 370px, 100vw" className="object-cover" />
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <div className="flex items-start justify-between gap-3">
                      <span className="font-display text-4xl font-extrabold text-accent">{c.n}</span>
                      <span className="font-display text-2xl font-extrabold text-[#14213A]">
                        {c.horas}
                        <span className="ml-0.5 text-sm">h</span>
                      </span>
                    </div>
                    <h3 className="mt-2 font-display text-xl font-extrabold text-[#14213A]">{c.nome}</h3>
                    <p className="mt-2 text-[15px] leading-relaxed text-[#516278]">{c.texto}</p>
                    <p className="mt-auto pt-4 font-data text-[13px] font-semibold text-accent-2">✓ Certificado de {c.horas} h</p>
                  </div>
                </article>
              ))}
            </div>
          </Reveal>
        </section>

        {/* Diferencial */}
        <section className="bg-white">
          <div className="mx-auto grid w-full max-w-[1180px] grid-cols-1 gap-10 px-6 py-14 md:grid-cols-2">
            <Reveal>
              <h2 className="font-display text-3xl font-extrabold text-[#14213A]">A portaria mudou. O porteiro também.</h2>
              <p className="mt-4 text-[16px] leading-relaxed text-[#516278]">
                Câmeras, aplicativo do condomínio, controle de acesso no computador e dados de moradores para proteger.
                Quem domina a parte digital e conhece a LGPD sai na frente.
              </p>
              <ul className="mt-5 flex flex-col gap-3 text-[16px] text-[#2B3A52]">
                {[
                  "Controle de acesso, encomendas e prestadores",
                  "Câmeras: achar e preservar uma gravação",
                  "Golpes presenciais e digitais",
                  "LGPD: o que pode e o que não pode com os dados",
                ].map((t) => (
                  <li key={t} className="flex gap-3">
                    <span aria-hidden className="font-bold text-accent-2">✓</span>
                    {t}
                  </li>
                ))}
              </ul>
            </Reveal>
            <Reveal delay={120}>
              <div className="border-l-4 border-accent bg-surface-2 p-6">
                <h3 className="font-display text-xl font-extrabold text-[#14213A]">Certificado que a empresa confere</h3>
                <ul className="mt-3 flex flex-col gap-2 text-[15.5px] text-[#2B3A52]">
                  {["3 certificados com a carga horária completa", "QR Code e código de validação", "Conteúdo programático no verso", "Válido em todo o território nacional"].map((t) => (
                    <li key={t} className="flex gap-3">
                      <span aria-hidden className="font-bold text-accent-2">✓</span>
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Para quem é */}
        <section className="mx-auto w-full max-w-[1180px] px-6 py-14">
          <Reveal>
            <h2 className="font-display text-3xl font-extrabold text-[#14213A]">Para quem é</h2>
            <div className="mt-6 grid grid-cols-1 gap-3 text-[16px] text-[#2B3A52] sm:grid-cols-2">
              {[
                "Quer trabalhar em portaria de condomínio, empresa ou comércio",
                "Já é porteiro e quer certificado para crescer",
                "Trabalha como zelador, recepcionista ou controlador de acesso",
                "Quer uma profissão com estudo rápido e online",
              ].map((t) => (
                <p key={t} className="flex gap-3 border border-[#D7DEE6] bg-white p-4">
                  <span aria-hidden className="font-bold text-accent-2">✓</span>
                  {t}
                </p>
              ))}
            </div>
          </Reveal>
        </section>

        {/* Oferta */}
        <section id="oferta" className="scroll-mt-24 bg-[#0B2A4A] text-white">
          <div className="mx-auto flex w-full max-w-[820px] flex-col items-center px-6 py-14 text-center">
            <h2 className="font-display text-3xl font-extrabold">Comece hoje a sua formação</h2>
            <div className="mt-7">
              <Oferta escuro />
            </div>
            <p className="mt-4 text-[15px] text-[#C9D6E5]">3 cursos + 3 certificados · {F.horasTotais} horas · pagamento único</p>
            <a
              href={CHECKOUT}
              className="btn-pulso brilho mt-6 inline-flex items-center gap-2 bg-accent px-8 py-4 text-[17px] font-extrabold text-accent-ink"
            >
              Quero minha formação →
            </a>
          </div>
        </section>

        {/* Perguntas */}
        <section className="mx-auto w-full max-w-[820px] px-6 py-14">
          <h2 className="font-display text-3xl font-extrabold text-[#14213A]">Perguntas frequentes</h2>
          <div className="mt-6 flex flex-col gap-3">
            {PERGUNTAS_FORMACAO_PORTARIA.map((q) => (
              <details key={q.p} className="border border-[#D7DEE6] bg-white p-5">
                <summary className="cursor-pointer font-display text-[17px] font-bold text-[#14213A]">{q.p}</summary>
                <p className="mt-3 text-[15.5px] leading-relaxed text-[#516278]">{q.r}</p>
              </details>
            ))}
          </div>
        </section>
      </main>

      <BarraCompraFixa preco={PRECO} detalhe={`no PIX ou em ${F.parcela}`} href={CHECKOUT} rotulo="Quero minha formação →" />
      <RodapeSite />
    </div>
  );
}
