import { CompartilharWhatsApp } from "@/components/compartilhar-whatsapp";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { criarClienteSupabasePublico } from "@/lib/supabase-publico";
import { CabecalhoSite, RodapeSite } from "@/components/site-chrome";
import { Reveal } from "@/components/reveal";
import { AVISO_CURSO_LIVRE, EMISSOR } from "@/lib/emissor";
import { VISITAS_MINIMAS_PARA_EXIBIR, visitasDoCurso } from "@/lib/visitas";
import { textoParcela } from "@/lib/apostilas";
import { formatarReais, produtoDoCursoPago } from "@/lib/curso-pago";
import { PAGINA_CURSO } from "@/lib/cursos-pagina";

// Página igual para todos os visitantes: a Vercel guarda em cache e refaz no máximo a cada 10 min
// (gasta CPU só nessa hora, não a cada visita). Nada de cookies aqui — ver src/lib/supabase-publico.ts.
export const revalidate = 600;

// gera cada página na primeira visita e depois serve do cache
export async function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ slug: string }> };

const FOTO_HERO_PADRAO = {
  src: "/alunos.webp",
  alt: "Alunos aprendendo juntos com os aplicativos do Office e o Copilot",
};

// largura e altura só quando a imagem não é o retrato padrão de 1122x1402
const FOTOS_HERO_POR_CURSO: Record<string, { src: string; alt: string; largura?: number; altura?: number }> = {
  "atendimento-ao-cliente": {
    src: "/atendimento-ao-cliente-card.webp",
    alt: "Equipe de atendimento ao cliente sorrindo, com headset e tablet",
  },
  "auxiliar-administrativo": {
    src: "/auxiliar-administrativo-card.webp",
    alt: "Auxiliar administrativo sorrindo na mesa do escritório, com notebook, pastas e calculadora",
  },
  "estoque-logistica-controle-de-mercadorias": {
    src: "/estoque-logistica-card.webp",
    alt: "Auxiliar de estoque conferindo caixas com leitor de código de barras no almoxarifado",
  },
  "conserto-e-manutencao-de-celulares": {
    src: "/conserto-celulares-curso.webp",
    alt: "Curso online de Conserto e Manutenção de Celulares, 40 horas, com certificado incluso: técnico consertando um celular na bancada",
    largura: 1200,
    altura: 896,
  },
  "ingles-basico-atendimento-ao-publico": {
    src: "/card_curso_de_ingles.webp",
    alt: "Curso online de Inglês Básico para Atendimento ao Público, grátis e com certificado",
    largura: 1200,
    altura: 896,
  },
  "atendente-de-call-center": {
    src: "/cursos/call-center/card.webp",
    alt: "Atendente de call center sorrindo com headset em frente ao computador na central de atendimento",
    largura: 997,
    altura: 746,
  },
  camareira: {
    src: "/cursos/camareira/hero.webp",
    alt: "Camareira de hotel arrumando a cama de um quarto claro e aconchegante, com carrinho de governança na porta",
    largura: 1376,
    altura: 768,
  },
  "agente-de-portaria": {
    src: "/agp.webp",
    alt: "Agentes de portaria trabalhando na guarita, com rádios HT, livro de ocorrências e monitores das câmeras",
    largura: 1376,
    altura: 768,
  },
  "libras-iniciante": {
    src: "/libras-card.webp",
    alt: "Mulher e homem conversando em Libras, a Língua Brasileira de Sinais, numa sala de aula iluminada",
    largura: 1200,
    altura: 896,
  },
};

async function carregarCurso(slug: string) {
  const supabase = criarClienteSupabasePublico();
  const { data: curso } = await supabase
    .from("cursos")
    .select("id, slug, nome, subtitulo, descricao, carga_horaria_horas, nota_minima, permite_isencao_cadunico")
    .eq("slug", slug)
    .maybeSingle();
  return { supabase, curso };
}

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sibrap.tec.br";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { supabase, curso } = await carregarCurso(slug);
  if (!curso) return {};
  const pago = await produtoDoCursoPago(supabase, slug);
  const titulo = pago
    ? `Curso de ${curso.nome} online com certificado (${curso.carga_horaria_horas}h)`
    : `Curso de ${curso.nome} grátis com certificado (${curso.carga_horaria_horas}h)`;
  const descricao = (pago
    ? `Curso online de ${curso.nome}, ${curso.carga_horaria_horas} horas, por ${formatarReais(pago.preco_centavos)} no PIX, com certificado incluso. ${curso.subtitulo ?? ""}`
    : `Curso online gratuito de ${curso.nome}, ${curso.carga_horaria_horas} horas, com certificado validável por QR Code. ${curso.subtitulo ?? ""}`
  ).trim();
  const foto = `${SITE}${(FOTOS_HERO_POR_CURSO[slug] ?? FOTO_HERO_PADRAO).src}`;
  const nome = curso.nome.toLowerCase();
  return {
    title: titulo,
    description: descricao.length > 300 ? `${descricao.slice(0, 297)}...` : descricao,
    keywords: pago
      ? [`curso de ${nome}`, `curso de ${nome} online`, `curso de ${nome} com certificado`, "curso online com certificado", "curso livre"]
      : [`curso de ${nome}`, `curso de ${nome} gratuito`, `curso de ${nome} com certificado`, "curso online gratuito com certificado", "curso livre"],
    alternates: { canonical: `/cursos/${slug}` },
    openGraph: { title: titulo, description: descricao, url: `${SITE}/cursos/${slug}`, type: "website", locale: "pt_BR", images: [{ url: foto, alt: curso.nome }] },
    twitter: { card: "summary_large_image", title: titulo, description: descricao, images: [foto] },
  };
}

// Perguntas frequentes da página do curso (visíveis na página e marcadas como FAQPage para buscadores e IAs)
function perguntasFrequentes(
  curso: { slug: string; nome: string; carga_horaria_horas: number; nota_minima: number },
  preco: string | null,
  modulos: string[],
  precoCurso: string | null,
  cargas: number[]
) {
  const horasCertificado = cargas.length > 1 ? `${cargas.slice(0, -1).join(", ")} ou ${cargas[cargas.length - 1]} horas (você escolhe)` : `${curso.carga_horaria_horas} horas`;
  return [
    precoCurso
      ? [`Quanto custa o curso de ${curso.nome}?`, `O curso custa ${precoCurso}, pagamento único no PIX ou em até 3x, sem mensalidade. O valor dá acesso a todas as aulas, 100% online, e já inclui o certificado.`]
      : [`O curso de ${curso.nome} é gratuito?`, `Sim. Todas as aulas do curso de ${curso.nome} são gratuitas e 100% online. Só o certificado é opcional e pago, e você escolhe se quer emiti-lo ao terminar o curso.`],
    [`O curso de ${curso.nome} tem certificado?`, `Sim. Depois de concluir as aulas e ser aprovado na prova final (nota mínima de ${curso.nota_minima}%), você pode emitir o certificado de ${horasCertificado}${precoCurso ? ", com QR Code para qualquer pessoa conferir a autenticidade. O certificado online já está incluso no valor do curso" : ". O sistema cobra uma pequena taxa pela emissão, e a autenticidade pode ser conferida no site pelo QR Code"}.`],
    [`Qual é a carga horária do curso de ${curso.nome}?`, `O curso tem ${curso.carga_horaria_horas} horas, divididas em ${modulos.length} módulos. Você estuda no seu ritmo, pelo celular ou pelo computador, e o progresso fica salvo.`],
    [`O que se aprende no curso de ${curso.nome}?`, `Os módulos são: ${modulos.join("; ")}.`],
    ["Preciso de experiência ou de algum curso antes?", "Não. O curso é livre e não tem pré-requisito: basta saber ler e ter acesso à internet."],
    ...(PAGINA_CURSO[curso.slug]?.faq ?? []),
  ] as [string, string][];
}

export default async function CursoPublicoPage({ params }: Props) {
  const { slug } = await params;
  const { supabase, curso } = await carregarCurso(slug);
  if (!curso) notFound();

  const [{ data: modulos }, { data: certificados }, visitas, pago] = await Promise.all([
    supabase
      .from("modulos")
      .select("id, titulo, ordem, aulas(id, titulo, ordem, carga_min, youtube_id)")
      .eq("curso_id", curso.id)
      .order("ordem")
      .order("ordem", { referencedTable: "aulas" }),
    // certificados online à venda (um só, ou um por carga horária); o impresso e os upgrades ficam de fora
    supabase
      .from("produtos")
      .select("slug, preco_centavos, certificado_horas")
      .eq("curso_id", curso.id)
      .like("slug", `certificado-${curso.slug}%`)
      .is("certificado_requer_horas", null)
      .eq("ativo", true),
    visitasDoCurso(supabase, curso.slug),
    produtoDoCursoPago(supabase, curso.slug),
  ]);
  const precoCurso = pago ? formatarReais(pago.preco_centavos) : null;
  // com várias cargas horárias, mostra o menor preço ("a partir de") e as opções
  const faixas = (certificados ?? []).filter((c) => c.certificado_horas).sort((a, b) => a.certificado_horas! - b.certificado_horas!);
  const produto =
    faixas.length > 1
      ? [...faixas].sort((a, b) => a.preco_centavos - b.preco_centavos)[0]
      : (certificados ?? []).find((c) => c.slug === `certificado-${curso.slug}`) ?? null;
  // o contador fica invisível até o curso passar de 1.000 visitas
  const mostrarVisitas = visitas >= VISITAS_MINIMAS_PARA_EXIBIR;

  const logado = false; // página em cache, igual para todos: quem já está no curso entra pelo "Minha Área"
  const areaHref = `/minha-area/cursos/${curso.slug}`;
  const ctaHref = logado ? areaHref : `/cadastro?next=${encodeURIComponent(areaHref)}`;
  const preco = produto
    ? (produto.preco_centavos / 100).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      })
    : null;

  const totalAulas = modulos?.reduce((s, m) => s + m.aulas.length, 0) ?? 0;
  // "aulas em vídeo" só quando todas têm vídeo; com parte delas, diz quantas
  const aulasComVideo = modulos?.reduce((s, m) => s + m.aulas.filter((a) => a.youtube_id).length, 0) ?? 0;
  const temVideo = totalAulas > 0 && aulasComVideo === totalAulas;
  const nomesModulos = (modulos ?? []).map((m) => m.titulo);
  const cargas = faixas.length > 1 ? faixas.map((f) => f.certificado_horas!) : [curso.carga_horaria_horas];
  const faq = perguntasFrequentes(curso, preco, nomesModulos, precoCurso, cargas);
  const pagina = PAGINA_CURSO[curso.slug];
  const textoCarga = cargas.length > 1 ? `de ${cargas[0]} a ${cargas[cargas.length - 1]}h (você escolhe)` : `de ${curso.carga_horaria_horas}h`;
  const urlCurso = `${SITE}/cursos/${curso.slug}`;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Course",
      name: curso.nome,
      description: curso.descricao,
      inLanguage: "pt-BR",
      isAccessibleForFree: !pago,
      url: urlCurso,
      image: `${SITE}${(FOTOS_HERO_POR_CURSO[curso.slug] ?? FOTO_HERO_PADRAO).src}`,
      teaches: nomesModulos,
      coursePrerequisites: "Nenhum",
      educationalLevel: "Iniciante",
      educationalCredentialAwarded: "Certificado de conclusão com QR Code de validação",
      offers: pago
        ? { "@type": "Offer", price: (pago.preco_centavos / 100).toFixed(2), priceCurrency: "BRL", category: "Paid", availability: "https://schema.org/InStock", url: urlCurso }
        : { "@type": "Offer", price: "0", priceCurrency: "BRL", category: "Free", availability: "https://schema.org/InStock", url: urlCurso },
      provider: { "@type": "Organization", name: EMISSOR.nome, url: SITE },
      syllabusSections: (modulos ?? []).map((m) => ({
        "@type": "Syllabus",
        name: m.titulo,
        description: m.aulas.map((a) => a.titulo).join("; "),
        timeRequired: `PT${Math.round(m.aulas.reduce((s, a) => s + a.carga_min, 0) / 60)}H`,
      })),
      hasCourseInstance: {
        "@type": "CourseInstance",
        courseMode: "online",
        courseWorkload: `PT${curso.carga_horaria_horas}H`,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map(([pergunta, resposta]) => ({ "@type": "Question", name: pergunta, acceptedAnswer: { "@type": "Answer", text: resposta } })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Início", item: SITE },
        { "@type": "ListItem", position: 2, name: "Cursos", item: `${SITE}/cursos` },
        { "@type": "ListItem", position: 3, name: curso.nome, item: urlCurso },
      ],
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-white font-body">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CabecalhoSite />

      <section className="overflow-hidden border-b border-[#D7DEE6] bg-surface-2">
        <div className="mx-auto grid max-w-[1180px] items-center gap-10 px-6 py-16 lg:grid-cols-[minmax(0,1fr)_480px]">
          {/* no celular o wrapper some (contents) e a ordem vira: texto, foto, números */}
          <div className="contents lg:block">
          <div className="entrar entrar-cima order-1">
            <span className="inline-flex items-center gap-2 border border-[#D7DEE6] bg-white px-3 py-1.5 font-data text-xs font-semibold text-brand">
              <span className="h-1.5 w-1.5 bg-accent-2" />
              Curso livre · 100% online · {precoCurso ?? "Gratuito"}
            </span>
            {mostrarVisitas && (
              <span className="ml-2 inline-flex items-center gap-1.5 border border-[#D7DEE6] bg-white px-3 py-1.5 font-data text-xs font-semibold text-[#516278]">
                <span aria-hidden>👁</span>
                {visitas.toLocaleString("pt-BR")} visitas
              </span>
            )}
            <h1 className="mt-4 max-w-[20ch] font-display text-4xl font-extrabold leading-[1.05] text-[#14213A] sm:text-6xl">
              {curso.nome}
            </h1>
            <p className="mt-5 line-clamp-3 max-w-[60ch] text-[17px] leading-relaxed text-[#516278]">
              {curso.descricao}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href={ctaHref}
                className="inline-flex items-center gap-2 bg-accent px-7 py-4 text-base font-bold text-accent-ink shadow-[0_20px_45px_-20px_rgba(11,42,74,0.35)] transition-colors hover:brightness-105"
              >
                {logado ? "Ir para o curso" : precoCurso ? "Quero fazer o curso" : "Quero me inscrever grátis"} <span aria-hidden>→</span>
              </Link>
              <span className="text-[13px] text-[#516278]">
                {precoCurso && pago
                  ? `${precoCurso} ou ${textoParcela(pago.preco_centavos)}. Certificado incluso.`
                  : "Sem mensalidade. Estude no seu ritmo."}
              </span>
            </div>
            <CompartilharWhatsApp
              className="mt-4"
              url={`${process.env.NEXT_PUBLIC_SITE_URL ?? "https://sibrap.tec.br"}/cursos/${curso.slug}`}
              texto={precoCurso ? `🎓 Curso de ${curso.nome}, online e com certificado:` : `🎓 Curso gratuito de ${curso.nome}, com certificado:`}
            />
          </div>

          <div className="entrar entrar-cima order-3 lg:mt-12" style={{ animationDelay: "150ms" }}>
            <dl className="grid max-w-3xl grid-cols-2 gap-px overflow-hidden border border-[#D7DEE6] bg-[#D7DEE6] sm:grid-cols-4">
              {[
                [`${curso.carga_horaria_horas}h`, "carga horária"],
                [String(modulos?.length ?? 0), "módulos"],
                [String(totalAulas), temVideo ? "aulas em vídeo" : "aulas"],
                ["QR Code", "certificado validável"],
              ].map(([valor, rotulo]) => (
                <div key={rotulo} className="bg-white px-5 py-4">
                  <dt className="font-data text-xl font-semibold text-[#14213A]">{valor}</dt>
                  <dd className="text-[12.5px] text-[#516278]">{rotulo}</dd>
                </div>
              ))}
            </dl>
          </div>
          </div>

          <div className="entrar entrar-direita order-2" style={{ animationDelay: "250ms" }}>
            <Image
              src={(FOTOS_HERO_POR_CURSO[curso.slug] ?? FOTO_HERO_PADRAO).src}
              alt={(FOTOS_HERO_POR_CURSO[curso.slug] ?? FOTO_HERO_PADRAO).alt}
              width={FOTOS_HERO_POR_CURSO[curso.slug]?.largura ?? 1122}
              height={FOTOS_HERO_POR_CURSO[curso.slug]?.altura ?? 1402}
              sizes="(min-width: 1024px) 480px, 90vw"
              priority
              className={`flutuar mx-auto h-auto w-full lg:max-w-none ${FOTOS_HERO_POR_CURSO[curso.slug]?.largura ? "max-w-[560px] " : "max-w-[360px]"}`}
            />
          </div>
        </div>
      </section>

      {pagina?.video && (
        <section className="border-b border-[#D7DEE6] bg-white py-16">
          <div className="mx-auto max-w-[960px] px-6">
            <Reveal>
              <h2 className="font-display text-3xl font-extrabold text-[#14213A]">Conheça o curso em 90 segundos</h2>
              <p className="mt-3 text-[16px] text-[#516278]">Objetivos, como você aprende, o conteúdo e o certificado.</p>
              <div className="mt-6 aspect-video w-full border border-[#D7DEE6] bg-[#0b2a4a]">
                <iframe
                  className="h-full w-full"
                  src={`https://www.youtube-nocookie.com/embed/${pagina.video}?rel=0`}
                  title={`Apresentação do curso ${curso.nome}`}
                  loading="lazy"
                  allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                  allowFullScreen
                />
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {pagina && (
        <section className="py-16">
          <div className="mx-auto grid max-w-[1180px] gap-12 px-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
            <Reveal>
              <h2 className="font-display text-3xl font-extrabold text-[#14213A]">Para quem é</h2>
              <ul className="mt-6 flex flex-col gap-3">
                {pagina.paraQuem.map((p) => (
                  <li key={p} className="flex items-start gap-3 text-[16px] leading-relaxed text-[#14213A]">
                    <span aria-hidden className="mt-1 text-accent-2">✓</span>
                    {p}
                  </li>
                ))}
              </ul>
            </Reveal>
            <div>
              <Reveal>
                <h2 className="font-display text-3xl font-extrabold text-[#14213A]">O que você ganha</h2>
              </Reveal>
              <div className="mt-6 grid grid-cols-1 gap-px border border-[#D7DEE6] bg-[#D7DEE6] sm:grid-cols-2">
                {pagina.ganhos.map((g, i) => (
                  <Reveal key={g.titulo} delay={i * 80}>
                    <div className="h-full bg-white p-5">
                      <p className="font-display text-[17px] font-extrabold text-[#14213A]">{g.titulo}</p>
                      <p className="mt-1.5 text-[14.5px] leading-relaxed text-[#516278]">{g.texto}</p>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      <section className={pagina ? "bg-surface-2 py-16" : "py-16"}>
        <div className="mx-auto max-w-[1180px] px-6">
          <Reveal>
            <h2 className="font-display text-3xl font-extrabold text-[#14213A]">
              Como funciona
            </h2>
          </Reveal>
          <ol className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              temVideo
                ? ["Assista às aulas", "Vídeo-aulas curtas e práticas, no celular ou no computador. Seu progresso fica salvo."]
                : ["Estude as aulas", `Aulas curtas e práticas, com exemplos e atividades${aulasComVideo > 0 ? " e vídeos de apoio" : ""}, no celular ou no computador. Seu progresso fica salvo.`],
              ["Faça a prova final", `Prova com questões de múltipla escolha. Nota mínima: ${curso.nota_minima}%. Pode refazer.`],
              ["Receba o certificado", `Certificado ${textoCarga} com QR Code que qualquer pessoa pode conferir.`],
            ].map(([titulo, texto], i) => (
              <Reveal key={titulo} delay={i * 120}>
                <li className="h-full border border-[#D7DEE6] bg-white p-6">
                  <span className="font-data text-sm font-semibold text-accent">Etapa {i + 1}</span>
                  <p className="mt-2 font-display text-xl font-extrabold text-[#14213A]">{titulo}</p>
                  <p className="mt-2 text-[15px] leading-relaxed text-[#516278]">{texto}</p>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section className={pagina ? "py-16" : "bg-surface-2 py-16"}>
        <div className="mx-auto max-w-[1180px] px-6">
          <Reveal>
            <h2 className="font-display text-3xl font-extrabold text-[#14213A]">
              O que você vai aprender
            </h2>
          </Reveal>
          <div className="mt-8 flex max-w-3xl flex-col gap-3">
            {modulos?.map((modulo, i) => {
              return (
                <Reveal key={modulo.id} delay={Math.min(i, 4) * 60}>
                  <details className="group border border-[#D7DEE6] bg-white">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4">
                      <span>
                        <span className="block font-display text-[17px] font-extrabold text-[#14213A]">
                          {modulo.titulo}
                        </span>
                        <span className="text-[13px] text-[#516278]">
                          {modulo.aulas.length} aulas
                        </span>
                      </span>
                      <span aria-hidden className="text-accent transition-transform group-open:rotate-90">
                        →
                      </span>
                    </summary>
                    <ul className="border-t border-[#E7EDF3] px-5 py-3">
                      {modulo.aulas.map((aula) => (
                        <li key={aula.id} className="flex items-start gap-2 py-1.5 text-[14.5px] text-[#516278]">
                          <span aria-hidden className="mt-0.5 text-accent-2">✓</span>
                          {aula.titulo}
                        </li>
                      ))}
                    </ul>
                  </details>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {pagina && (pagina.destaques || pagina.ondeTrabalhar) && (
        <section className="bg-surface-2 py-16">
          <div className="mx-auto grid max-w-[1180px] gap-12 px-6 lg:grid-cols-2">
            {pagina.destaques && (
              <Reveal>
                <h2 className="font-display text-3xl font-extrabold text-[#14213A]">Aulas que não são só leitura</h2>
                <ul className="mt-6 flex flex-col gap-3">
                  {pagina.destaques.map((d) => (
                    <li key={d} className="flex items-start gap-3 border-l-4 border-accent bg-white px-4 py-3 text-[15.5px] leading-relaxed text-[#14213A]">
                      {d}
                    </li>
                  ))}
                </ul>
              </Reveal>
            )}
            {pagina.ondeTrabalhar && (
              <Reveal delay={120}>
                <h2 className="font-display text-3xl font-extrabold text-[#14213A]">Onde você pode trabalhar</h2>
                <ul className="mt-6 flex flex-wrap gap-2">
                  {pagina.ondeTrabalhar.map((o) => (
                    <li key={o} className="border border-[#D7DEE6] bg-white px-3 py-2 text-[14.5px] font-semibold text-[#14213A]">
                      {o}
                    </li>
                  ))}
                </ul>
              </Reveal>
            )}
          </div>
        </section>
      )}

      <section className="py-16">
        <div className="mx-auto max-w-[1180px] px-6">
          <Reveal>
            <h2 className="font-display text-3xl font-extrabold text-[#14213A]">
              Sobre o certificado
            </h2>
            <p className="mt-3 max-w-[62ch] text-[15.5px] leading-relaxed text-[#516278]">
              {precoCurso ? "O certificado online já está incluso no valor do curso." : "As aulas são gratuitas para todos."} O
              certificado (com nome, carga horária e QR Code de validação) é emitido depois da
              conclusão das aulas e da aprovação na prova final.
            </p>
          </Reveal>
          {precoCurso && (
          <div className={`mt-8 grid max-w-3xl grid-cols-1 gap-6 ${curso.permite_isencao_cadunico ? "md:grid-cols-2" : ""}`}>
            {curso.permite_isencao_cadunico && (
              <Reveal>
                <div className="h-full border-2 border-accent bg-white p-6">
                  <p className="font-data text-xs font-semibold uppercase tracking-wide text-accent">
                    Baixa renda
                  </p>
                  <p className="mt-2 font-data text-3xl font-semibold text-[#14213A]">Grátis</p>
                  <p className="mt-3 text-[14.5px] leading-relaxed text-[#516278]">
                    Envie seu comprovante de inscrição no CadÚnico. Nossa equipe
                    confere e libera o certificado sem custo.
                  </p>
                </div>
              </Reveal>
            )}
            <Reveal delay={120}>
              <div className="h-full max-w-sm border border-[#D7DEE6] bg-white p-6">
                <p className="font-data text-xs font-semibold uppercase tracking-wide text-[#516278]">
                  {precoCurso ? "Curso + certificado online" : curso.permite_isencao_cadunico ? "Demais participantes" : "Certificado"}
                </p>
                {!precoCurso && faixas.length > 1 && (
                  <p className="mt-2 text-[13.5px] font-semibold text-[#516278]">a partir de</p>
                )}
                <p className={`${!precoCurso && faixas.length > 1 ? "" : "mt-2 "}font-data text-3xl font-semibold text-[#14213A]`}>
                  {precoCurso ?? preco ?? "—"}
                </p>
                {(pago ?? produto) && (
                  <p className="text-[13.5px] text-[#516278]">ou {textoParcela((pago ?? produto)!.preco_centavos)}</p>
                )}
                <p className="mt-3 text-[14.5px] leading-relaxed text-[#516278]">
                  {precoCurso
                    ? "Pagamento único no PIX ou no cartão, direto na página, sem mensalidade. Acesso a todas as aulas e certificado online incluso."
                    : "Pagamento único no PIX ou no cartão, direto na página. O valor é só do certificado — o curso continua gratuito."}
                </p>
                {!precoCurso && faixas.length > 1 && (
                  <ul className="mt-3 flex flex-col gap-1 border-t border-[#EEF2F6] pt-3 font-data text-[14px] text-[#14213A]">
                    {faixas.map((f) => (
                      <li key={f.slug} className="flex justify-between">
                        <span>Certificado de {f.certificado_horas} horas</span>
                        <strong>{formatarReais(f.preco_centavos)}</strong>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Reveal>
          </div>
          )}
          <p className="mt-6 max-w-[70ch] text-[12.5px] leading-relaxed text-[#93A0AF]">
            {AVISO_CURSO_LIVRE}
          </p>
        </div>
      </section>

      <section className="bg-surface-2 py-16">
        <div className="mx-auto max-w-[1180px] px-6">
          <Reveal>
            <h2 className="font-display text-3xl font-extrabold text-[#14213A]">Perguntas frequentes</h2>
          </Reveal>
          <div className="mt-8 flex max-w-3xl flex-col gap-3">
            {faq.map(([pergunta, resposta]) => (
              <details key={pergunta} className="group border border-[#D7DEE6] bg-white">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-display text-[16px] font-extrabold text-[#14213A]">
                  {pergunta}
                  <span aria-hidden className="text-accent transition-transform group-open:rotate-90">→</span>
                </summary>
                <p className="border-t border-[#E7EDF3] px-5 py-4 text-[15px] leading-relaxed text-[#516278]">{resposta}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t-[3px] border-accent bg-brand py-14 text-white">
        <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-6 px-6">
          <p className="max-w-[24ch] font-display text-3xl font-extrabold leading-tight">
            {precoCurso ? `Comece hoje por ${precoCurso}.` : "Comece hoje. É de graça."}
          </p>
          <Link
            href={ctaHref}
            className="inline-flex items-center gap-2 bg-accent px-7 py-4 text-base font-bold text-accent-ink transition-colors hover:brightness-105"
          >
            {logado ? "Ir para o curso" : precoCurso ? "Quero fazer o curso" : "Quero me inscrever grátis"} <span aria-hidden>→</span>
          </Link>
        </div>
      </section>

      <RodapeSite />
    </div>
  );
}
