import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { criarClienteSupabasePublico } from "@/lib/supabase-publico";
import { CabecalhoSite, RodapeSite } from "@/components/site-chrome";
import { Reveal } from "@/components/reveal";

// Vitrine dos cursos profissionalizantes: curso gratuito; certificado + apostila prática em PDF pagos ao final (17/11/2026).
// Igual para todos os visitantes: fica em cache e é refeita no máximo a cada 1 h (sem cookies).
export const revalidate = 3600;

const TITULO = "Cursos profissionalizantes online grátis, com certificado";
const DESCRICAO =
  "Cursos gratuitos de Elétrica, Automação e Bombeiro Hidráulico. Estude de graça e, ao terminar, emita se quiser o certificado opcional com QR Code e a apostila prática em PDF.";

export const metadata: Metadata = {
  title: TITULO,
  description: DESCRICAO,
  alternates: { canonical: "/cursos/profissionalizantes" },
  openGraph: { title: `${TITULO} | SIBRAP`, description: DESCRICAO, url: "/cursos/profissionalizantes", siteName: "SIBRAP", locale: "pt_BR", type: "website" },
};

// Cursos independentes: cada pessoa escolhe a área, e cada curso tem o seu certificado (carga horária completa).
// Aparecem como "em breve" até serem publicados (curso ativo no banco).
// Salários: Novo CAGED 2026 (carteira assinada), consultado no Portal Salário em 14/11/2026. Atualizar uma vez por ano.
const CURSOS = [
  {
    slug: "eletricista-residencial-basico",
    foto: "/cursos/profissionalizantes/eletrica.webp",
    area: "Elétrica",
    nome: "Eletricista Residencial Básico – Baixa Tensão",
    horas: 40,
    resumo: "Segurança, tomadas, interruptores, three-way, iluminação, quadro, DR e aterramento. Para quem nunca mexeu com elétrica.",
    onde: ["Construtoras e obras", "Empresas de instalação e manutenção predial", "Condomínios, hotéis, hospitais e shoppings", "Por conta própria, atendendo casas e comércios"],
    salario: "R$ 2.100 a R$ 2.700",
    fonteSalario: "Do piso de eletricista auxiliar à média de eletricista de instalações (Novo CAGED 2026).",
  },
  {
    slug: "automacao-residencial-inteligente",
    foto: "/cursos/profissionalizantes/automacao.webp",
    area: "Automação",
    nome: "Automação Residencial Inteligente",
    horas: 60,
    resumo: "Casa inteligente na prática: Wi-Fi, Zigbee, dispositivos, aplicativos, Alexa, cenas e rotinas.",
    onde: ["Empresas de automação e segurança eletrônica", "Lojas de casa inteligente e de material elétrico", "Construtoras e instaladoras de alto padrão", "Por conta própria, com projetos e instalações"],
    salario: "R$ 1.500 a R$ 2.600",
    fonteSalario: "Estimativa de sites de vagas para técnico instalador; ainda não há dado oficial só desta função.",
  },
  {
    slug: "bombeiro-hidraulico",
    foto: "/cursos/profissionalizantes/hidraulica.webp",
    area: "Bombeiro Hidráulico",
    nome: "Bombeiro Hidráulico (Encanador)",
    horas: 80,
    resumo: "Água fria e quente, tubos e conexões, louças e metais, vazamentos e manutenção.",
    onde: ["Construtoras e obras", "Empresas de manutenção predial", "Condomínios, hotéis, hospitais e indústrias", "Por conta própria, com reparos e emergências"],
    salario: "R$ 2.400 a R$ 2.800",
    fonteSalario: "Do piso à média de encanador / bombeiro hidráulico (Novo CAGED 2026).",
  },
] as const;

const PERGUNTAS = [
  {
    p: "Preciso fazer os três cursos?",
    r: "Não. Cada curso é independente: você escolhe a área que quer seguir, estuda só esse curso e recebe o certificado dele, com a carga horária completa.",
  },
  {
    p: "Preciso ter experiência ou estudo na área?",
    r: "Não. Os cursos começam do zero, com linguagem simples, e você estuda no celular ou no computador, no seu ritmo.",
  },
  {
    p: "O certificado vale no currículo?",
    r: "Sim. É certificado de curso livre de qualificação profissional, válido em todo o território nacional (Lei nº 9.394/1996, art. 42), com carga horária e QR Code para a empresa conferir. Não é diploma de curso técnico.",
  },
  {
    p: "O que é a apostila prática?",
    r: "Um manual em PDF com o passo a passo das atividades do curso, os diagramas e os checklists de segurança. Você baixa e consulta quando quiser, mesmo fora do site.",
  },
  {
    p: "Depois do curso já posso trabalhar?",
    r: "Sim. Você conclui sabendo fazer os serviços básicos da área com segurança, e pode buscar vaga ou atender clientes. Serviços maiores e mais complexos vêm com a prática e novas qualificações; em empresas, o trabalho com eletricidade exige também o treinamento da NR-10.",
  },
  {
    p: "Como é o pagamento?",
    r: "O curso é gratuito. O certificado é opcional: ao terminar, se quiser, você vê o valor na hora de emitir. Ele já vem com a apostila prática em PDF, em pagamento único, sem mensalidade.",
  },
];


export default async function CursosProfissionalizantesPage() {
  const supabase = criarClienteSupabasePublico();
  const slugs = CURSOS.map((t) => t.slug);
  // sem preço na vitrine (Wagner, 17/11/2026): o valor do certificado aparece só na hora de emitir
  const { data: ativos } = await supabase.from("cursos").select("slug").eq("ativo", true).in("slug", slugs);
  const noAr = new Set((ativos ?? []).map((c) => c.slug));

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: PERGUNTAS.map((q) => ({ "@type": "Question", name: q.p, acceptedAnswer: { "@type": "Answer", text: q.r } })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Cursos", item: "https://sibrap.tec.br/cursos" },
        { "@type": "ListItem", position: 2, name: "Cursos profissionalizantes", item: "https://sibrap.tec.br/cursos/profissionalizantes" },
      ],
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-surface-2 font-body">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <CabecalhoSite />

      <main className="flex-1">
        {/* Topo */}
        <section className="bg-[#0B2A4A] text-white">
          <div className="mx-auto w-full max-w-[1180px] px-6 py-16 sm:py-20">
            <p className="font-data text-xs uppercase tracking-[0.2em] text-accent">Cursos profissionalizantes</p>
            <h1 className="mt-3 max-w-[20ch] font-display text-4xl font-extrabold leading-tight sm:text-5xl">
              Aprenda uma profissão do zero. Saia com certificado.
            </h1>
            <p className="mt-4 max-w-[56ch] text-[17px] leading-relaxed text-[#C9D6E5]">
              Escolha a sua área e estude de graça. Ao terminar, certificado opcional com QR Code e apostila prática em PDF.
            </p>
            <ul className="mt-7 flex flex-wrap gap-2.5 font-data text-[13px] font-semibold">
              {["Curso grátis", "Certificado com QR Code", "Apostila prática em PDF"].map((t, i) => (
                <li key={t} className="flex items-center gap-2 border border-white/25 px-3.5 py-2">
                  <span className="text-accent">{i + 1}</span> {t}
                </li>
              ))}
            </ul>
            <a href="#cursos" className="btn-pulso brilho mt-8 inline-flex items-center gap-2 bg-accent px-7 py-4 text-[16px] font-extrabold text-accent-ink">
              Ver os cursos →
            </a>
          </div>
        </section>

        {/* O que você leva */}
        <section className="mx-auto w-full max-w-[1180px] px-6 py-14">
          <Reveal>
            <h2 className="font-display text-3xl font-extrabold text-[#14213A]">Em cada curso, você recebe</h2>
            <div className="mt-7 grid grid-cols-1 gap-5 md:grid-cols-3">
              {[
                {
                  n: "1",
                  t: "O curso",
                  d: "Aulas no celular ou no computador, com simuladores e jogos: você pratica as ligações na tela antes de pegar na ferramenta.",
                },
                {
                  n: "2",
                  t: "A apostila prática",
                  d: "Manual em PDF com o passo a passo, os diagramas e os checklists de segurança. Para consultar no serviço, sem internet.",
                },
                {
                  n: "3",
                  t: "O certificado",
                  d: "Com a carga horária completa do curso e QR Code de validação. Válido em todo o território nacional.",
                },
              ].map((b) => (
                <div key={b.n} className="border border-[#D7DEE6] border-t-4 border-t-accent bg-white p-6">
                  <p className="font-display text-4xl font-extrabold text-accent">{b.n}</p>
                  <h3 className="mt-2 font-display text-xl font-extrabold text-[#14213A]">{b.t}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-[#516278]">{b.d}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </section>

        {/* Cursos */}
        <section id="cursos" className="mx-auto w-full max-w-[1180px] scroll-mt-24 px-6 pb-14">
          <Reveal>
            <h2 className="font-display text-3xl font-extrabold text-[#14213A]">Escolha a sua área de interesse</h2>
            <p className="mt-2 max-w-[64ch] text-[16px] text-[#516278]">
              Elétrica, Automação ou Bombeiro Hidráulico: o passo inicial para conquistar sua vaga profissional no mercado de trabalho.
            </p>
            <div className="mt-7 grid grid-cols-1 gap-5 lg:grid-cols-3">
              {CURSOS.map((c) => {
                const ativo = noAr.has(c.slug);
                return (
                  <article key={c.slug} className="flex h-full flex-col overflow-hidden border border-[#D7DEE6] bg-white">
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-2">
                      <Image src={c.foto} alt={c.nome} fill sizes="(min-width: 1024px) 370px, 100vw" className="object-cover" />
                    </div>
                    <div className="flex items-end justify-between bg-[#0B2A4A] px-6 py-5 text-white">
                      <span className="font-display text-xl font-extrabold text-accent">{c.area}</span>
                      <span className="font-display text-3xl font-extrabold leading-none">
                        {c.horas}
                        <span className="ml-1 text-base">h</span>
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col p-6">
                      <h3 className="font-display text-[1.3rem] font-extrabold leading-snug text-[#14213A]">{c.nome}</h3>
                      <p className="mb-5 mt-2 text-[15px] leading-relaxed text-[#516278]">{c.resumo}</p>

                      <div className="mt-auto flex items-center justify-between gap-3 border-t border-[#EEF2F6] pt-5">
                        <span className="text-[#14213A]">
                          <strong className="font-display text-2xl">Grátis</strong>
                          <span className="block text-[12.5px] text-[#516278]">certificado opcional de {c.horas} h</span>
                        </span>
                        {ativo ? (
                          <Link href={`/cursos/${c.slug}`} className="btn-pulso-suave brilho shrink-0 bg-accent px-5 py-2.5 text-[14.5px] font-extrabold text-accent-ink">
                            Quero começar →
                          </Link>
                        ) : (
                          <span className="shrink-0 border border-[#D7DEE6] bg-surface-2 px-4 py-2 font-data text-[12.5px] font-semibold uppercase tracking-wide text-[#516278]">
                            Em breve
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </Reveal>
        </section>

        {/* Para quem é */}
        <section className="bg-white">
          <div className="mx-auto grid w-full max-w-[1180px] grid-cols-1 gap-10 px-6 py-14 md:grid-cols-2">
            <Reveal>
              <h2 className="font-display text-3xl font-extrabold text-[#14213A]">Para quem quer a primeira oportunidade</h2>
              <ul className="mt-5 flex flex-col gap-3 text-[16px] text-[#2B3A52]">
                {[
                  "Nunca trabalhou na área e quer começar",
                  "Já faz bicos e quer um certificado para mostrar",
                  "Quer trabalhar por conta própria no bairro",
                  "Trabalha em obra e quer subir de função",
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
                <h3 className="font-display text-xl font-extrabold text-[#14213A]">Pronto para o primeiro serviço</h3>
                <p className="mt-2 text-[15.5px] leading-relaxed text-[#516278]">
                  Ao concluir, você executa os serviços básicos da área com segurança, sabe explicar o que está fazendo e tem o certificado
                  para apresentar. Já dá para buscar a primeira vaga ou atender os primeiros clientes, e crescer a cada serviço.
                </p>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Perguntas */}
        <section className="mx-auto w-full max-w-[820px] px-6 py-14">
          <h2 className="font-display text-3xl font-extrabold text-[#14213A]">Perguntas frequentes</h2>
          <div className="mt-6 flex flex-col gap-3">
            {PERGUNTAS.map((q) => (
              <details key={q.p} className="border border-[#D7DEE6] bg-white p-5">
                <summary className="cursor-pointer font-display text-[17px] font-bold text-[#14213A]">{q.p}</summary>
                <p className="mt-3 text-[15.5px] leading-relaxed text-[#516278]">{q.r}</p>
              </details>
            ))}
          </div>
          <div className="mt-10 border-2 border-accent bg-white p-7 text-center">
            <p className="font-display text-2xl font-extrabold text-[#14213A]">Curso grátis, certificado no final</p>
            <p className="mt-1 text-[15.5px] text-[#516278]">Estude de graça no celular. Certificado opcional no final, só se quiser.</p>
            <a href="#cursos" className="btn-pulso brilho mt-5 inline-flex items-center gap-2 bg-accent px-7 py-4 text-[16px] font-extrabold text-accent-ink">
              Escolher minha área →
            </a>
          </div>
        </section>
      </main>

      <RodapeSite />
    </div>
  );
}
