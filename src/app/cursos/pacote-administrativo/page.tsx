import type { Metadata } from "next";
import Image from "next/image";
import { CabecalhoSite, RodapeSite } from "@/components/site-chrome";
import { Reveal } from "@/components/reveal";
import { BarraCompraFixa } from "@/components/barra-compra-fixa";
import {
  CURSOS_PACOTE_ADM,
  HORAS_PACOTE_ADM,
  PACOTE_ADM,
  SEPARADOS_PACOTE_ADM,
  reaisPacote,
} from "@/lib/pacote-administrativo";

// Pacote Administrativo: 4 cursos gratuitos + os 4 certificados de 20 h num pagamento só (Wagner, 18/11/2026).
// Página pública em ISR, sem cookies; o pagamento fica na área do aluno.
export const revalidate = 3600;

const P = PACOTE_ADM;
const PRECO = reaisPacote(P.precoCentavos);
const CHECKOUT = `/cadastro?next=${encodeURIComponent(P.area)}`;

export const metadata: Metadata = {
  title: { absolute: `${P.titulo} | SIBRAP` },
  description: P.descricao,
  alternates: { canonical: P.caminho },
  robots: P.vendaAberta ? { index: true, follow: true } : { index: false, follow: false },
  openGraph: {
    title: P.titulo,
    description: P.descricao,
    url: P.caminho,
    siteName: "SIBRAP",
    locale: "pt_BR",
    type: "website",
    images: [{ url: "/cursos/redacao-oficial/hero.webp", alt: "Servidora revisando documentos oficiais num escritório" }],
  },
};

function Oferta({ escuro = false }: { escuro?: boolean }) {
  return (
    <div className={escuro ? "text-white" : "text-[#14213A]"}>
      <strong className="font-display text-5xl font-extrabold leading-none">{PRECO}</strong>
      <p className={`mt-2 text-[14.5px] ${escuro ? "text-[#C9D6E5]" : "text-[#516278]"}`}>no PIX, pagamento único</p>
      <p className={`mt-1.5 text-[13.5px] ${escuro ? "text-[#9FB3C8]" : "text-[#8A97A8]"}`}>
        Os 4 certificados separados: <span className="line-through">{reaisPacote(SEPARADOS_PACOTE_ADM)}</span>
      </p>
    </div>
  );
}

export default function PacoteAdministrativoPage() {
  return (
    <div className="flex min-h-screen flex-col bg-surface-2 font-body">
      <CabecalhoSite />
      <main className="flex-1">
        <section className="overflow-hidden bg-[#0B2A4A] text-white">
          <div className="mx-auto grid w-full max-w-[1180px] items-center gap-10 px-6 py-14 sm:py-16 md:grid-cols-2">
            <Reveal variante="esquerda">
              <p className="inline-block border-l-4 border-accent pl-3 font-display text-[20px] font-extrabold uppercase leading-tight tracking-wide text-accent sm:text-[24px]">
                {P.nome}
              </p>
              <h1 className="mt-3 max-w-[18ch] font-display text-4xl font-extrabold leading-tight sm:text-5xl">
                4 cursos de escritório, 4 certificados.
              </h1>
              <p className="mt-4 max-w-[52ch] text-[17px] leading-relaxed text-[#C9D6E5]">
                Redação Oficial, Arquivo, Auxiliar de RH e IA. Certificados de 20 h cada.
              </p>
              <div className="mt-6">
                <Oferta escuro />
              </div>
              <a
                href={CHECKOUT}
                className="btn-pulso brilho mt-7 inline-flex items-center gap-2 bg-accent px-7 py-4 text-[16px] font-extrabold text-accent-ink"
              >
                Quero o pacote →
              </a>
            </Reveal>
            <Reveal variante="direita" delay={150}>
              <Image
                src="/cursos/redacao-oficial/hero.webp"
                alt="Servidora revisando documentos oficiais com uma colega num escritório"
                width={1376}
                height={768}
                priority
                sizes="(min-width: 768px) 540px, 90vw"
                className="mx-auto h-auto w-full max-w-[540px] border-2 border-accent"
              />
            </Reveal>
          </div>
        </section>

        <section className="mx-auto w-full max-w-[1180px] px-6 py-14">
          <Reveal>
            <h2 className="font-display text-3xl font-extrabold text-[#14213A]">O que vem no pacote</h2>
            <div className="mt-7 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {CURSOS_PACOTE_ADM.map((c, i) => (
                <article key={c.slug} className="flex flex-col overflow-hidden border border-[#D7DEE6] border-t-4 border-t-accent bg-white">
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-2">
                    <Image src={c.foto} alt={c.alt} fill sizes="(min-width: 1024px) 280px, (min-width: 640px) 50vw, 100vw" className="object-cover" />
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-display text-4xl font-extrabold text-accent">{i + 1}</span>
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

        <section className="bg-white">
          <div className="mx-auto w-full max-w-[1180px] px-6 py-14">
            <Reveal>
              <h2 className="font-display text-3xl font-extrabold text-[#14213A]">Certificado que a empresa confere</h2>
              <ul className="mt-5 grid grid-cols-1 gap-3 text-[16px] text-[#2B3A52] sm:grid-cols-2">
                {[
                  "Um certificado por curso, com a carga horária completa",
                  "Conteúdo programático no verso",
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
          </div>
        </section>

        <section id="oferta" className="scroll-mt-24 bg-[#0B2A4A] text-white">
          <div className="mx-auto flex w-full max-w-[820px] flex-col items-center px-6 py-14 text-center">
            <h2 className="font-display text-3xl font-extrabold">Os 4 certificados num pagamento só</h2>
            <div className="mt-7">
              <Oferta escuro />
            </div>
            <p className="mt-4 text-[15px] text-[#C9D6E5]">
              4 cursos + 4 certificados · {HORAS_PACOTE_ADM} horas
            </p>
            <a
              href={CHECKOUT}
              className="btn-pulso brilho mt-6 inline-flex items-center gap-2 bg-accent px-8 py-4 text-[17px] font-extrabold text-accent-ink"
            >
              Quero o pacote →
            </a>
          </div>
        </section>
      </main>
      <BarraCompraFixa preco={PRECO} detalhe="no PIX · 4 certificados" href={CHECKOUT} rotulo="Quero o pacote →" />
      <RodapeSite />
    </div>
  );
}
