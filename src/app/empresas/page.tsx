import type { Metadata } from "next";
import Link from "next/link";
import { CabecalhoSite, RodapeSite } from "@/components/site-chrome";
import { EMAIL_CONTATO, EMISSOR } from "@/lib/emissor";

// Treinamentos para empresas (in company), pedido do Wagner em 16/11/2026: foco em administrativo, informática e NRs.
// Sem preço na página: a empresa pede proposta pelo formulário de solicitação ou por e-mail.
const DESCRICAO =
  "Treinamentos para empresas: informática, Excel, rotinas administrativas, atendimento, NR-10 e NR-35. Turmas online com controle de estudo e certificado com QR Code.";

export const metadata: Metadata = {
  title: "Treinamentos para empresas (in company)",
  description: DESCRICAO,
  alternates: { canonical: "/empresas" },
  openGraph: { title: "Treinamentos para empresas | SIBRAP", description: DESCRICAO, url: "/empresas", type: "website", locale: "pt_BR", images: ["/opengraph-image"] },
};

const TRILHAS = [
  {
    area: "Informática",
    titulo: "Informática e Excel para a equipe",
    itens: ["Informática Básica com Inteligência Artificial (60 h)", "Excel do Básico ao Intermediário (40 h)"],
    para: "Escritórios, comércio, recepção e setores que ainda perdem tempo com planilhas e e-mail.",
  },
  {
    area: "Administrativo",
    titulo: "Rotinas administrativas e atendimento",
    itens: ["Auxiliar Administrativo (40 h)", "Assistente Administrativo (80 h)", "Atendimento ao Cliente (40 h)", "Atendente de Call Center (40 h)"],
    para: "Novos contratados, jovens aprendizes e equipes de atendimento.",
  },
  {
    area: "Segurança do trabalho",
    titulo: "NR-10 e NR-35",
    itens: ["NR-10: Segurança em Instalações e Serviços em Eletricidade (40 h)", "NR-35: Segurança no Trabalho em Altura (8 h, parte teórica)", "Eletricista Residencial Básico – Baixa Tensão (40 h)"],
    para: "Construtoras, manutenção predial, condomínios, indústrias e prestadores de serviço.",
  },
  {
    area: "Operação",
    titulo: "Operação, estoque e portaria",
    itens: ["TBO – Treinamento Básico Operacional (40 h)", "Estoque, Logística e Controle de Mercadorias (30 h)", "Agente de Portaria (60 h)"],
    para: "Indústria, logística, condomínios e hotelaria.",
  },
];

const COMO = [
  ["Você escolhe os cursos", "Monte a trilha da equipe com um ou mais treinamentos."],
  ["Matrícula em lote", "Recebemos a lista de colaboradores e liberamos o acesso de todos."],
  ["Estudo com controle de tempo", "O colaborador estuda pelo celular ou computador, com registro do tempo e avaliação."],
  ["Certificados e relatório", "Cada concluinte recebe certificado com QR Code de validação; a empresa recebe a relação de concluintes."],
];

const PERGUNTAS = [
  ["O treinamento é presencial ou online?", "Os treinamentos são online, na plataforma do SIBRAP, e podem ser feitos no horário que a empresa definir. Outros formatos podem ser combinados na proposta."],
  ["O certificado tem validade?", "Sim. Os certificados são de cursos livres, válidos em todo o Brasil, com QR Code e código de validação que qualquer pessoa pode conferir no site."],
  ["O curso de NR-35 cobre a parte prática?", "Não. O curso online cobre a parte teórica. A prática da NR-35 é presencial e deve ser organizada pela empresa, como exige a norma."],
  ["Como é o pagamento?", "O valor depende dos cursos escolhidos e da quantidade de colaboradores. A forma de pagamento é combinada na proposta."],
];

export default function EmpresasPage() {
  // sem WhatsApp no site (Wagner, 18/11/2026): proposta pelo formulário de solicitação (chega por e-mail)
  const zap = "/solicitacao?tipo=empresa&origem=empresas";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.sibrap.tec.br";
  const dados = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        name: "Treinamentos para empresas (in company)",
        serviceType: "Treinamento corporativo online",
        description: DESCRICAO,
        areaServed: "BR",
        url: `${siteUrl}/empresas`,
        provider: { "@type": "Organization", name: EMISSOR.nome, url: siteUrl },
      },
      {
        "@type": "FAQPage",
        mainEntity: PERGUNTAS.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
      },
    ],
  };

  return (
    <div className="flex min-h-screen flex-col bg-white font-body">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(dados) }} />
      <CabecalhoSite />
      <main className="flex-1">
        <section className="bg-brand-deep text-white">
          <div className="mx-auto max-w-[1180px] px-4 py-12 sm:px-6 sm:py-16">
            <p className="font-data text-xs font-semibold uppercase tracking-[0.2em] text-accent">Para empresas</p>
            <h1 className="mt-3 max-w-[22ch] font-display text-[2rem] font-extrabold leading-tight sm:text-[2.8rem]">
              Treine sua equipe com certificado e controle de estudo.
            </h1>
            <p className="mt-4 max-w-[56ch] text-[16px] leading-relaxed text-[#C9D6E6]">
              Informática, rotinas administrativas, atendimento, NR-10 e NR-35, em turmas online para a sua equipe.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
              <a href={zap} className="bg-accent px-7 py-4 text-[16px] font-extrabold text-accent-ink transition-all hover:brightness-110">
                Pedir proposta →
              </a>
              <a href={`mailto:${EMAIL_CONTATO}?subject=Proposta%20de%20treinamento%20para%20empresa`} className="text-sm font-semibold text-white underline underline-offset-4">
                ou por e-mail
              </a>
            </div>
          </div>
        </section>

        <section className="py-12 sm:py-14">
          <div className="mx-auto max-w-[1180px] px-4 sm:px-6">
            <h2 className="font-display text-[1.6rem] font-extrabold text-[#14213A] sm:text-[2rem]">Trilhas de treinamento</h2>
            <ul className="mt-6 grid gap-5 sm:grid-cols-2">
              {TRILHAS.map((t) => (
                <li key={t.titulo} className="border border-[#D7DEE6] bg-white p-5">
                  <p className="font-data text-[11px] font-semibold uppercase tracking-wide text-accent-2">{t.area}</p>
                  <h3 className="mt-1 font-display text-[1.2rem] font-extrabold text-[#14213A]">{t.titulo}</h3>
                  <ul className="mt-3 flex flex-col gap-1.5 text-[14.5px] text-[#33465E]">
                    {t.itens.map((i) => (
                      <li key={i} className="flex gap-2">
                        <span aria-hidden className="text-accent-2">✓</span>
                        {i}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-[13.5px] leading-relaxed text-[#516278]">
                    <strong className="text-[#14213A]">Indicado para:</strong> {t.para}
                  </p>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-[14px] text-[#516278]">
              Veja o conteúdo de cada curso em{" "}
              <Link href="/cursos" className="font-semibold text-brand underline underline-offset-4">
                Cursos
              </Link>
              .
            </p>
          </div>
        </section>

        <section className="border-y border-[#D7DEE6] bg-[#F6F8FB] py-12 sm:py-14">
          <div className="mx-auto max-w-[1180px] px-4 sm:px-6">
            <h2 className="font-display text-[1.6rem] font-extrabold text-[#14213A] sm:text-[2rem]">Como funciona</h2>
            <ol className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {COMO.map(([t, d], i) => (
                <li key={t} className="border-l-4 border-accent bg-white p-4">
                  <span className="font-data text-[12px] font-bold text-accent-2">ETAPA {i + 1}</span>
                  <h3 className="mt-1 font-display text-[1.05rem] font-extrabold text-[#14213A]">{t}</h3>
                  <p className="mt-1 text-[14px] leading-relaxed text-[#516278]">{d}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="py-12 sm:py-14">
          <div className="mx-auto max-w-[820px] px-4 sm:px-6">
            <h2 className="font-display text-[1.6rem] font-extrabold text-[#14213A] sm:text-[2rem]">Perguntas frequentes</h2>
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
            <div className="mt-8 text-center">
              <a href={zap} className="inline-block bg-brand px-7 py-4 text-[15.5px] font-extrabold text-white transition-all hover:brightness-125">
                Pedir proposta para a minha empresa →
              </a>
            </div>
          </div>
        </section>
      </main>
      <RodapeSite />
    </div>
  );
}
