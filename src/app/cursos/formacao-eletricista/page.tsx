import type { Metadata } from "next";
import Image from "next/image";
import { CabecalhoSite, RodapeSite } from "@/components/site-chrome";
import { Reveal } from "@/components/reveal";
import { ContagemRegressiva } from "@/components/contagem-regressiva";
import {
  CURSOS_FORMACAO,
  FORMACAO_ELETRICISTA,
  PERGUNTAS_FORMACAO,
  reaisFormacao,
} from "@/lib/formacao-eletricista";

// Formação Inicial para Eletricista: Eletricista Residencial Básico +
// NR-10 Básico + preparatório NR-35. 3 certificados de
// curso livre assinados eletronicamente pelo instrutor Alexsandro (CRT-01).
// NR-35 fica como preparatório (Portaria MTE nº 1.259/2026: treinamento de NR-35 só presencial).
export const revalidate = 3600;

const F = FORMACAO_ELETRICISTA;
const SITE = "https://sibrap.tec.br";
const FIM_PROMOCAO = F.fimPromocao;
const PRECO_PIX_PROMO = reaisFormacao(F.precoPixPromoCentavos);
const PRECO_NORMAL = reaisFormacao(F.precoNormalCentavos);
const PARCELA = F.parcela;
const CURSOS = CURSOS_FORMACAO;
const PERGUNTAS = PERGUNTAS_FORMACAO;

export const metadata: Metadata = {
  title: { absolute: `${F.titulo} | SIBRAP` },
  description: F.descricao,
  keywords: [...F.palavrasChave],
  alternates: { canonical: F.caminho },
  robots: F.vendaAberta
    ? { index: true, follow: true }
    : { index: false, follow: false },
  openGraph: {
    title: F.titulo,
    description: F.descricao,
    url: F.caminho,
    siteName: "SIBRAP",
    locale: "pt_BR",
    type: "website",
    images: [
      {
        url: "/cursos/profissionalizantes/eletrica.webp",
        width: 1200,
        height: 900,
        alt: "Eletricista instalando tomada",
      },
    ],
  },
};

function Oferta({ escuro = false }: { escuro?: boolean }) {
  return (
    <div className={escuro ? "text-white" : "text-[#14213A]"}>
      <p
        className={`font-data text-[13px] font-semibold uppercase tracking-wider ${escuro ? "text-accent" : "text-accent-2"}`}
      >
        Promoção de fim de ano · PIX
      </p>
      <p className="mt-1 flex flex-wrap items-baseline gap-x-3">
        <span
          className={`text-lg line-through ${escuro ? "text-[#9FB3C8]" : "text-[#8A97A8]"}`}
        >
          {PRECO_NORMAL}
        </span>
        <strong className="font-display text-5xl font-extrabold leading-none">
          {PRECO_PIX_PROMO}
        </strong>
      </p>
      <p
        className={`mt-2 text-[14.5px] ${escuro ? "text-[#C9D6E5]" : "text-[#516278]"}`}
      >
        ou {PRECO_NORMAL} no cartão em até {PARCELA}
      </p>
    </div>
  );
}

export default function FormacaoEletricistaPage() {
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
        "3 certificados de curso livre: Eletricista Residencial Básico (40 h), NR-10 Básico (40 h) e Segurança no Trabalho em Altura (8 h)",
      timeRequired: `PT${F.horasTotais}H`,
      provider: { "@type": "Organization", name: "SIBRAP", sameAs: SITE },
      instructor: {
        "@type": "Person",
        name: "Alexsandro de Sousa Silva",
        jobTitle: "Técnico em Eletrotécnica",
      },
      hasCourseInstance: {
        "@type": "CourseInstance",
        courseMode: "online",
        courseWorkload: `PT${F.horasTotais}H`,
      },
      hasPart: CURSOS.map((c) => ({
        "@type": "Course",
        name: c.nome,
        description: c.texto,
        timeRequired: `PT${c.horas}H`,
      })),
      offers: {
        "@type": "Offer",
        category: "Paid",
        price: (F.precoPixPromoCentavos / 100).toFixed(2),
        priceCurrency: "BRL",
        priceValidUntil: F.fimPromocaoData,
        availability: "https://schema.org/InStock",
        url,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: PERGUNTAS.map((q) => ({
        "@type": "Question",
        name: q.p,
        acceptedAnswer: { "@type": "Answer", text: q.r },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Cursos",
          item: `${SITE}/cursos`,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Cursos profissionalizantes",
          item: `${SITE}/cursos/profissionalizantes`,
        },
        { "@type": "ListItem", position: 3, name: F.nome, item: url },
      ],
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-surface-2 font-body">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CabecalhoSite />

      {/* Faixa da promoção */}
      <div className="bg-accent px-4 py-2.5 text-center font-data text-[13.5px] font-bold text-accent-ink">
        Comece 2027 com profissão: {PRECO_PIX_PROMO} no PIX só até 31 de
        dezembro
      </div>

      <main className="flex-1">
        {/* Topo */}
        <section className="overflow-hidden bg-[#0B2A4A] text-white">
          <div className="mx-auto grid w-full max-w-[1180px] items-center gap-10 px-6 py-14 sm:py-16 md:grid-cols-2">
            <Reveal variante="esquerda">
              <p className="font-data text-xs uppercase tracking-[0.2em] text-accent">
                Formação Inicial para Eletricista
              </p>
              <h1 className="mt-3 max-w-[18ch] font-display text-4xl font-extrabold leading-tight sm:text-5xl">
                3 cursos, 3 certificados. Uma vaga na elétrica.
              </h1>
              <p className="mt-4 max-w-[52ch] text-[17px] leading-relaxed text-[#C9D6E5]">
                Eletricista Básico, NR-10 Básico e preparatório NR-35, com
                certificados assinados por técnico em eletrotécnica.
              </p>
              <div className="mt-6">
                <Oferta escuro />
              </div>
              <ContagemRegressiva ate={FIM_PROMOCAO} className="mt-5" />
              <a
                href="#oferta"
                className="btn-pulso brilho mt-7 inline-flex items-center gap-2 bg-accent px-7 py-4 text-[16px] font-extrabold text-accent-ink"
              >
                Garantir a promoção →
              </a>
            </Reveal>
            <Reveal variante="direita" delay={150}>
              <Image
                src="/cursos/profissionalizantes/eletrica.webp"
                alt="Eletricista instalando quadro de distribuição"
                width={1200}
                height={900}
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
            <h2 className="font-display text-3xl font-extrabold text-[#14213A]">
              Curso de eletricista online com certificado
            </h2>
            <p className="mt-3 max-w-[78ch] text-[16px] leading-relaxed text-[#516278]">
              {F.resumo}
            </p>
            <div className="mt-7 grid grid-cols-1 gap-5 md:grid-cols-3">
              {CURSOS.map((c) => (
                <article
                  key={c.n}
                  className="flex flex-col border border-[#D7DEE6] border-t-4 border-t-accent bg-white p-6"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-display text-4xl font-extrabold text-accent">
                      {c.n}
                    </span>
                    <span className="font-display text-2xl font-extrabold text-[#14213A]">
                      {c.horas}
                      <span className="ml-0.5 text-sm">h</span>
                    </span>
                  </div>
                  {c.selo && (
                    <span className="mt-3 self-start bg-[#0B2A4A] px-2.5 py-1 font-data text-[12px] font-bold text-white">
                      {c.selo}
                    </span>
                  )}
                  <h3 className="mt-2 font-display text-xl font-extrabold text-[#14213A]">
                    {c.nome}
                  </h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-[#516278]">
                    {c.texto}
                  </p>
                  <p className="mt-auto pt-4 font-data text-[13px] font-semibold text-accent-2">
                    ✓ Certificado de {c.horas} h
                  </p>
                </article>
              ))}
            </div>
          </Reveal>
        </section>

        {/* Certificado */}
        <section className="bg-white">
          <div className="mx-auto grid w-full max-w-[1180px] grid-cols-1 gap-10 px-6 py-14 md:grid-cols-2">
            <Reveal>
              <h2 className="font-display text-3xl font-extrabold text-[#14213A]">
                Certificado que a empresa confere
              </h2>
              <ul className="mt-5 flex flex-col gap-3 text-[16px] text-[#2B3A52]">
                {[
                  "Assinatura eletrônica do instrutor técnico em eletrotécnica (CRT-01)",
                  "Conteúdo programático completo no verso",
                  "QR Code e código de validação",
                  "Válido em todo o território nacional",
                ].map((t) => (
                  <li key={t} className="flex gap-3">
                    <span aria-hidden className="font-bold text-accent-2">
                      ✓
                    </span>
                    {t}
                  </li>
                ))}
              </ul>
            </Reveal>
            <Reveal delay={120}>
              <div className="border-l-4 border-accent bg-surface-2 p-6">
                <h3 className="font-display text-xl font-extrabold text-[#14213A]">
                  Instrutor
                </h3>
                <p className="mt-2 text-[15.5px] leading-relaxed text-[#516278]">
                  <strong className="text-[#14213A]">
                    Alexsandro de Sousa Silva
                  </strong>
                  , Técnico em Eletrotécnica com registro no CRT-01. Ele assina
                  eletronicamente os três certificados.
                </p>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Para quem é */}
        <section className="mx-auto w-full max-w-[1180px] px-6 py-14">
          <Reveal>
            <h2 className="font-display text-3xl font-extrabold text-[#14213A]">
              Para quem quer começar 2027 trabalhando
            </h2>
            <div className="mt-6 grid grid-cols-1 gap-3 text-[16px] text-[#2B3A52] sm:grid-cols-2">
              {[
                "Nunca trabalhou com elétrica e quer uma profissão",
                "Quer vaga de auxiliar ou eletricista em obra e manutenção",
                "Já faz bicos e quer certificado para mostrar",
                "Quer o certificado de NR-10 para a primeira vaga",
              ].map((t) => (
                <p
                  key={t}
                  className="flex gap-3 border border-[#D7DEE6] bg-white p-4"
                >
                  <span aria-hidden className="font-bold text-accent-2">
                    ✓
                  </span>
                  {t}
                </p>
              ))}
            </div>
          </Reveal>
        </section>

        {/* Oferta */}
        <section id="oferta" className="scroll-mt-24 bg-[#0B2A4A] text-white">
          <div className="mx-auto flex w-full max-w-[820px] flex-col items-center px-6 py-14 text-center">
            <h2 className="font-display text-3xl font-extrabold">
              A promoção acaba em
            </h2>
            <ContagemRegressiva
              ate={FIM_PROMOCAO}
              className="mt-5 justify-center"
            />
            <div className="mt-7">
              <Oferta escuro />
            </div>
            <p className="mt-4 text-[15px] text-[#C9D6E5]">
              3 cursos + 3 certificados · 88 horas · pagamento único
            </p>
            <a
              href="#oferta"
              className="btn-pulso brilho mt-6 inline-flex items-center gap-2 bg-accent px-8 py-4 text-[17px] font-extrabold text-accent-ink"
            >
              Quero minha formação →
            </a>
          </div>
        </section>

        {/* Perguntas */}
        <section className="mx-auto w-full max-w-[820px] px-6 py-14">
          <h2 className="font-display text-3xl font-extrabold text-[#14213A]">
            Perguntas frequentes
          </h2>
          <div className="mt-6 flex flex-col gap-3">
            {PERGUNTAS.map((q) => (
              <details
                key={q.p}
                className="border border-[#D7DEE6] bg-white p-5"
              >
                <summary className="cursor-pointer font-display text-[17px] font-bold text-[#14213A]">
                  {q.p}
                </summary>
                <p className="mt-3 text-[15.5px] leading-relaxed text-[#516278]">
                  {q.r}
                </p>
              </details>
            ))}
          </div>
        </section>
      </main>

      <RodapeSite />
    </div>
  );
}
