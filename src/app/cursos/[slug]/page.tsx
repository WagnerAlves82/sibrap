import { CompartilharWhatsApp } from "@/components/compartilhar-whatsapp";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { criarClienteSupabaseServer } from "@/lib/supabase-server";
import { CabecalhoSite, RodapeSite } from "@/components/site-chrome";
import { Reveal } from "@/components/reveal";
import { AVISO_CURSO_LIVRE, EMISSOR, formatarHoras } from "@/lib/emissor";
import { VISITAS_MINIMAS_PARA_EXIBIR, visitasDoCurso } from "@/lib/visitas";
import { formatarReais, produtoDoCursoPago } from "@/lib/curso-pago";

type Props = { params: Promise<{ slug: string }> };

const FOTO_HERO_PADRAO = {
  src: "/alunos.png",
  alt: "Alunos aprendendo juntos com os aplicativos do Office e o Copilot",
};

// largura e altura só quando a imagem não é o retrato padrão de 1122x1402
const FOTOS_HERO_POR_CURSO: Record<string, { src: string; alt: string; largura?: number; altura?: number }> = {
  "atendimento-ao-cliente": {
    src: "/atendimento-ao-cliente-card.png",
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
};

async function carregarCurso(slug: string) {
  const supabase = await criarClienteSupabaseServer();
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
  curso: { nome: string; carga_horaria_horas: number; nota_minima: number },
  preco: string | null,
  modulos: string[],
  precoCurso: string | null
) {
  return [
    precoCurso
      ? [`Quanto custa o curso de ${curso.nome}?`, `O curso custa ${precoCurso}, pagamento único no PIX, sem mensalidade. O valor dá acesso a todas as aulas, 100% online, e já inclui o certificado.`]
      : [`O curso de ${curso.nome} é gratuito?`, `Sim. Todas as aulas do curso de ${curso.nome} são gratuitas e 100% online. Só o certificado é opcional e pago${preco ? ` (${preco})` : ""}.`],
    [`O curso de ${curso.nome} tem certificado?`, `Sim. Depois de concluir as aulas e ser aprovado na prova final (nota mínima de ${curso.nota_minima}%), você pode emitir o certificado de ${curso.carga_horaria_horas} horas, com QR Code para qualquer pessoa conferir a autenticidade${precoCurso ? ". O certificado online já está incluso no valor do curso" : ""}.`],
    [`Qual é a carga horária do curso de ${curso.nome}?`, `O curso tem ${curso.carga_horaria_horas} horas, divididas em ${modulos.length} módulos. Você estuda no seu ritmo, pelo celular ou pelo computador, e o progresso fica salvo.`],
    [`O que se aprende no curso de ${curso.nome}?`, `Os módulos são: ${modulos.join("; ")}.`],
    ["Preciso de experiência ou de algum curso antes?", "Não. O curso é livre e não tem pré-requisito: basta saber ler e ter acesso à internet."],
  ] as const;
}

export default async function CursoPublicoPage({ params }: Props) {
  const { slug } = await params;
  const { supabase, curso } = await carregarCurso(slug);
  if (!curso) notFound();

  const [{ data: modulos }, { data: produto }, { data: userData }, visitas, pago] = await Promise.all([
    supabase
      .from("modulos")
      .select("id, titulo, ordem, aulas(id, titulo, ordem, carga_min, youtube_id)")
      .eq("curso_id", curso.id)
      .order("ordem")
      .order("ordem", { referencedTable: "aulas" }),
    // preço do certificado online (cada curso tem também o impresso e, se for pago, o produto do curso)
    supabase
      .from("produtos")
      .select("preco_centavos")
      .eq("slug", `certificado-${curso.slug}`)
      .eq("ativo", true)
      .maybeSingle(),
    supabase.auth.getUser(),
    visitasDoCurso(supabase, curso.slug),
    produtoDoCursoPago(supabase, curso.slug),
  ]);
  const precoCurso = pago ? formatarReais(pago.preco_centavos) : null;
  // o contador fica invisível até o curso passar de 1.000 visitas
  const mostrarVisitas = visitas >= VISITAS_MINIMAS_PARA_EXIBIR;

  const logado = !!userData.user;
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
  const faq = perguntasFrequentes(curso, preco, nomesModulos, precoCurso);
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
      <CabecalhoSite logado={logado} />

      <section className="overflow-hidden border-b border-[#D7DEE6] bg-surface-2">
        <div className="mx-auto grid max-w-[1180px] items-center gap-10 px-6 py-16 lg:grid-cols-[minmax(0,1fr)_400px]">
          <div>
          <div className="entrar entrar-cima">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#D7DEE6] bg-white px-3 py-1.5 font-data text-xs font-semibold text-brand">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-2" />
              Curso livre · 100% online · {precoCurso ?? "Gratuito"}
            </span>
            {mostrarVisitas && (
              <span className="ml-2 inline-flex items-center gap-1.5 rounded-full border border-[#D7DEE6] bg-white px-3 py-1.5 font-data text-xs font-semibold text-[#516278]">
                <span aria-hidden>👁</span>
                {visitas.toLocaleString("pt-BR")} visitas
              </span>
            )}
            <h1 className="mt-4 max-w-[20ch] font-display text-4xl font-extrabold leading-[1.05] text-[#14213A] sm:text-6xl">
              {curso.nome}
            </h1>
            <p className="mt-5 max-w-[60ch] text-[17px] leading-relaxed text-[#516278]">
              {curso.descricao}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href={ctaHref}
                className="inline-flex items-center gap-2 rounded-lg bg-accent px-7 py-4 text-base font-bold text-accent-ink shadow-[0_20px_45px_-20px_rgba(11,42,74,0.35)] transition-colors hover:brightness-105"
              >
                {logado ? "Ir para o curso" : precoCurso ? "Quero fazer o curso" : "Quero me inscrever grátis"} <span aria-hidden>→</span>
              </Link>
              <span className="text-[13px] text-[#516278]">
                {precoCurso ? `Pagamento único de ${precoCurso} no PIX. Certificado incluso.` : "Sem mensalidade. Estude no seu ritmo."}
              </span>
            </div>
            <CompartilharWhatsApp
              className="mt-4"
              url={`${process.env.NEXT_PUBLIC_SITE_URL ?? "https://sibrap.tec.br"}/cursos/${curso.slug}`}
              texto={precoCurso ? `🎓 Curso de ${curso.nome}, online e com certificado:` : `🎓 Curso gratuito de ${curso.nome}, com certificado:`}
            />
          </div>

          <div className="entrar entrar-cima mt-12" style={{ animationDelay: "150ms" }}>
            <dl className="grid max-w-3xl grid-cols-2 gap-px overflow-hidden rounded-[10px] border border-[#D7DEE6] bg-[#D7DEE6] sm:grid-cols-4">
              {[
                [`${curso.carga_horaria_horas}h`, "carga horária"],
                [String(modulos?.length ?? 0), "módulos"],
                [String(totalAulas), temVideo ? "aulas em vídeo" : aulasComVideo > 0 ? `aulas (${aulasComVideo} com vídeo)` : "aulas"],
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

          <div className="entrar entrar-direita" style={{ animationDelay: "250ms" }}>
            <Image
              src={(FOTOS_HERO_POR_CURSO[curso.slug] ?? FOTO_HERO_PADRAO).src}
              alt={(FOTOS_HERO_POR_CURSO[curso.slug] ?? FOTO_HERO_PADRAO).alt}
              width={FOTOS_HERO_POR_CURSO[curso.slug]?.largura ?? 1122}
              height={FOTOS_HERO_POR_CURSO[curso.slug]?.altura ?? 1402}
              sizes="(min-width: 1024px) 400px, 80vw"
              priority
              className={`flutuar mx-auto h-auto w-full lg:max-w-none ${FOTOS_HERO_POR_CURSO[curso.slug]?.largura ? "max-w-[480px] rounded-xl" : "max-w-[320px]"}`}
            />
          </div>
        </div>
      </section>

      <section className="py-16">
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
              ["Receba o certificado", `Certificado de ${curso.carga_horaria_horas}h com QR Code que qualquer pessoa pode conferir.`],
            ].map(([titulo, texto], i) => (
              <Reveal key={titulo} delay={i * 120}>
                <li className="h-full rounded-xl border border-[#D7DEE6] bg-white p-6">
                  <span className="font-data text-sm font-semibold text-accent">Etapa {i + 1}</span>
                  <p className="mt-2 font-display text-xl font-extrabold text-[#14213A]">{titulo}</p>
                  <p className="mt-2 text-[15px] leading-relaxed text-[#516278]">{texto}</p>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-surface-2 py-16">
        <div className="mx-auto max-w-[1180px] px-6">
          <Reveal>
            <h2 className="font-display text-3xl font-extrabold text-[#14213A]">
              O que você vai aprender
            </h2>
          </Reveal>
          <div className="mt-8 flex max-w-3xl flex-col gap-3">
            {modulos?.map((modulo, i) => {
              const minutos = modulo.aulas.reduce((s, a) => s + a.carga_min, 0);
              return (
                <Reveal key={modulo.id} delay={Math.min(i, 4) * 60}>
                  <details className="group rounded-xl border border-[#D7DEE6] bg-white">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4">
                      <span>
                        <span className="block font-display text-[17px] font-extrabold text-[#14213A]">
                          {modulo.titulo}
                        </span>
                        <span className="text-[13px] text-[#516278]">
                          {modulo.aulas.length} aulas · {formatarHoras(minutos)}
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
          <div className={`mt-8 grid max-w-3xl grid-cols-1 gap-6 ${curso.permite_isencao_cadunico ? "md:grid-cols-2" : ""}`}>
            {curso.permite_isencao_cadunico && (
              <Reveal>
                <div className="h-full rounded-xl border-2 border-accent bg-white p-6">
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
              <div className="h-full max-w-sm rounded-xl border border-[#D7DEE6] bg-white p-6">
                <p className="font-data text-xs font-semibold uppercase tracking-wide text-[#516278]">
                  {precoCurso ? "Curso + certificado online" : curso.permite_isencao_cadunico ? "Demais participantes" : "Certificado"}
                </p>
                <p className="mt-2 font-data text-3xl font-semibold text-[#14213A]">
                  {precoCurso ?? preco ?? "—"}
                </p>
                <p className="mt-3 text-[14.5px] leading-relaxed text-[#516278]">
                  {precoCurso
                    ? "Pagamento único por PIX, direto na página, sem mensalidade. Acesso a todas as aulas e certificado online incluso."
                    : "Pagamento único por PIX, direto na página. O valor é só do certificado — o curso continua gratuito."}
                </p>
              </div>
            </Reveal>
          </div>
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
              <details key={pergunta} className="group rounded-xl border border-[#D7DEE6] bg-white">
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
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-7 py-4 text-base font-bold text-accent-ink transition-colors hover:brightness-105"
          >
            {logado ? "Ir para o curso" : precoCurso ? "Quero fazer o curso" : "Quero me inscrever grátis"} <span aria-hidden>→</span>
          </Link>
        </div>
      </section>

      <RodapeSite />
    </div>
  );
}
