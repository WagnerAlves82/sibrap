import type { Metadata } from "next";
import Link from "next/link";
import { CabecalhoSite, RodapeSite } from "@/components/site-chrome";
import dados from "@/lib/classificador-marcas.json";
import { Classificador } from "./Classificador";

// Classificador de classes de marca (Nice): página pública e gratuita, isca do curso Registre Sua Marca no INPI.
// Estática (sem cookies), busca no navegador.
const DESCRICAO =
  "Descubra em qual classe do INPI registrar a sua marca: digite o seu negócio e veja a classe principal, as classes extras e o que buscar no e-Marcas.";
const CURSO = "/cursos/registro-de-marca-inpi";

export const metadata: Metadata = {
  title: "Classificador de marcas: qual a classe do meu negócio no INPI?",
  description: DESCRICAO,
  alternates: { canonical: "/classificador-de-marcas" },
  openGraph: {
    title: "Classificador de marcas | SIBRAP",
    description: DESCRICAO,
    url: "/classificador-de-marcas",
    type: "website",
    locale: "pt_BR",
    images: ["/opengraph-image"],
  },
};

const PERGUNTAS = [
  ["O que é a classe da marca?", "O INPI divide produtos e serviços em 45 classes (Classificação de Nice). A marca é registrada numa classe e fica protegida naquela área. As classes 1 a 34 são de produtos e as 35 a 45 são de serviços."],
  ["Posso registrar em mais de uma classe?", "Sim, mas cada classe é um pedido com a sua própria taxa (GRU). Se só puder pagar um pedido, comece pela classe marcada como \"Registre primeiro\"."],
  ["Loja que revende produtos registra na classe do produto?", "Não. Quem só revende produtos de outras marcas registra na classe 35 (comércio). A classe do produto só entra se a sua marca for estampada no produto."],
  ["O resultado do classificador é definitivo?", "É uma orientação para a maioria dos casos. Os itens exatos são escolhidos na lista pré-aprovada do e-Marcas, e quem decide o pedido é o INPI."],
];

export default function ClassificadorPage() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.sibrap.tec.br";
  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        name: "Classificador de marcas",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        offers: { "@type": "Offer", price: "0", priceCurrency: "BRL" },
        description: DESCRICAO,
        url: `${siteUrl}/classificador-de-marcas`,
      },
      {
        "@type": "FAQPage",
        mainEntity: PERGUNTAS.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
      },
    ],
  };

  return (
    <div className="flex min-h-screen flex-col bg-white font-body">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <CabecalhoSite />
      <main className="flex-1">
        <section className="bg-brand-deep text-white">
          <div className="mx-auto max-w-[820px] px-4 py-10 sm:px-6 sm:py-14">
            <p className="font-data text-xs font-semibold uppercase tracking-[0.2em] text-accent">Ferramenta grátis</p>
            <h1 className="mt-3 font-display text-[2rem] font-extrabold leading-tight sm:text-[2.6rem]">Qual a classe da minha marca no INPI?</h1>
            <p className="mt-3 max-w-[56ch] text-[16px] leading-relaxed text-[#C9D6E6]">
              Digite o seu negócio e veja em qual classe registrar primeiro e o que buscar no e-Marcas.
            </p>
          </div>
        </section>

        <section className="py-10 sm:py-12">
          <div className="mx-auto max-w-[820px] px-4 sm:px-6">
            <Classificador />
            <p className="mt-6 text-[13px] text-[#516278]">
              {dados.negocios.length} tipos de negócio cadastrados. Orientação geral: a decisão do pedido é do INPI.
            </p>
          </div>
        </section>

        <section className="border-y border-[#D7DEE6] bg-[#F6F8FB] py-10">
          <div className="mx-auto flex max-w-[820px] flex-col gap-4 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <h2 className="font-display text-[1.35rem] font-extrabold text-[#14213A]">Registre a marca sozinho, tela por tela</h2>
              <p className="mt-1 text-[15px] text-[#516278]">Busca, classe, GRU com desconto de MEI e protocolo no e-Marcas. Curso de 20 h com certificado.</p>
            </div>
            <Link href={CURSO} className="shrink-0 bg-accent px-6 py-3.5 text-center font-extrabold text-accent-ink transition-all hover:brightness-110">
              Conhecer o curso →
            </Link>
          </div>
        </section>

        <section className="py-10 sm:py-12">
          <div className="mx-auto max-w-[820px] px-4 sm:px-6">
            <h2 className="font-display text-[1.5rem] font-extrabold text-[#14213A]">Perguntas frequentes</h2>
            <div className="mt-4 divide-y divide-[#D7DEE6] border-y border-[#D7DEE6]">
              {PERGUNTAS.map(([q, a]) => (
                <details key={q} className="group py-3">
                  <summary className="cursor-pointer list-none font-semibold text-[#14213A]">
                    <span className="mr-2 text-accent-2 group-open:hidden">+</span>
                    <span className="mr-2 hidden text-accent-2 group-open:inline">−</span>
                    {q}
                  </summary>
                  <p className="mt-2 text-[15px] leading-relaxed text-[#516278]">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>
      <RodapeSite />
    </div>
  );
}
