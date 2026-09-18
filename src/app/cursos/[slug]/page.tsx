import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { criarClienteSupabaseServer } from "@/lib/supabase-server";
import { CabecalhoSite, RodapeSite } from "@/components/site-chrome";
import { Reveal } from "@/components/reveal";
import { AVISO_CURSO_LIVRE, EMISSOR, formatarHoras } from "@/lib/emissor";

type Props = { params: Promise<{ slug: string }> };

async function carregarCurso(slug: string) {
  const supabase = await criarClienteSupabaseServer();
  const { data: curso } = await supabase
    .from("cursos")
    .select("id, slug, nome, subtitulo, descricao, carga_horaria_horas, nota_minima")
    .eq("slug", slug)
    .maybeSingle();
  return { supabase, curso };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { curso } = await carregarCurso(slug);
  if (!curso) return {};
  return {
    title: curso.nome,
    description: `${curso.descricao ?? ""} Curso gratuito de ${curso.carga_horaria_horas}h com certificado.`.trim(),
  };
}

export default async function CursoPublicoPage({ params }: Props) {
  const { slug } = await params;
  const { supabase, curso } = await carregarCurso(slug);
  if (!curso) notFound();

  const [{ data: modulos }, { data: produto }, { data: userData }] = await Promise.all([
    supabase
      .from("modulos")
      .select("id, titulo, ordem, aulas(id, titulo, ordem, carga_min)")
      .eq("curso_id", curso.id)
      .order("ordem")
      .order("ordem", { referencedTable: "aulas" }),
    supabase
      .from("produtos")
      .select("preco_centavos")
      .eq("curso_id", curso.id)
      .eq("ativo", true)
      .maybeSingle(),
    supabase.auth.getUser(),
  ]);

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

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: curso.nome,
    description: curso.descricao,
    inLanguage: "pt-BR",
    isAccessibleForFree: true,
    provider: {
      "@type": "Organization",
      name: EMISSOR.nome,
      url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://sibrap.tec.br",
    },
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "online",
      courseWorkload: `PT${curso.carga_horaria_horas}H`,
    },
  };

  return (
    <div className="flex min-h-screen flex-col bg-white font-body">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CabecalhoSite logado={logado} />

      <section className="border-b border-[#D7DEE6] bg-surface-2">
        <div className="mx-auto max-w-[1180px] px-6 py-16">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#D7DEE6] bg-white px-3 py-1.5 font-data text-xs font-semibold text-brand">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-2" />
              Curso livre · 100% online · Gratuito
            </span>
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
                {logado ? "Ir para o curso" : "Quero me inscrever grátis"} <span aria-hidden>→</span>
              </Link>
              <span className="text-[13px] text-[#516278]">
                Sem mensalidade. Estude no seu ritmo.
              </span>
            </div>
          </Reveal>

          <Reveal delay={150} className="mt-12">
            <dl className="grid max-w-3xl grid-cols-2 gap-px overflow-hidden rounded-[10px] border border-[#D7DEE6] bg-[#D7DEE6] sm:grid-cols-4">
              {[
                [`${curso.carga_horaria_horas}h`, "carga horária"],
                [String(modulos?.length ?? 0), "módulos"],
                [String(totalAulas), "aulas em vídeo"],
                ["QR Code", "certificado validável"],
              ].map(([valor, rotulo]) => (
                <div key={rotulo} className="bg-white px-5 py-4">
                  <dt className="font-data text-xl font-semibold text-[#14213A]">{valor}</dt>
                  <dd className="text-[12.5px] text-[#516278]">{rotulo}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
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
              ["Assista às aulas", "Vídeo-aulas curtas e práticas, no celular ou no computador. Seu progresso fica salvo."],
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
              As aulas são gratuitas para todos. O certificado (com nome,
              carga horária e QR Code de validação) é emitido depois da
              conclusão das aulas e da aprovação na prova final.
            </p>
          </Reveal>
          <div className="mt-8 grid max-w-3xl grid-cols-1 gap-6 md:grid-cols-2">
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
            <Reveal delay={120}>
              <div className="h-full rounded-xl border border-[#D7DEE6] bg-white p-6">
                <p className="font-data text-xs font-semibold uppercase tracking-wide text-[#516278]">
                  Demais participantes
                </p>
                <p className="mt-2 font-data text-3xl font-semibold text-[#14213A]">
                  {preco ?? "—"}
                </p>
                <p className="mt-3 text-[14.5px] leading-relaxed text-[#516278]">
                  Pagamento único por PIX, direto na página. O valor é só do
                  certificado — o curso continua gratuito.
                </p>
              </div>
            </Reveal>
          </div>
          <p className="mt-6 max-w-[70ch] text-[12.5px] leading-relaxed text-[#93A0AF]">
            {AVISO_CURSO_LIVRE} Emitido por {EMISSOR.nome}, CNPJ {EMISSOR.cnpj}.
          </p>
        </div>
      </section>

      <section className="border-t-[3px] border-accent bg-brand py-14 text-white">
        <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-6 px-6">
          <p className="max-w-[24ch] font-display text-3xl font-extrabold leading-tight">
            Comece hoje. É de graça.
          </p>
          <Link
            href={ctaHref}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-7 py-4 text-base font-bold text-accent-ink transition-colors hover:brightness-105"
          >
            {logado ? "Ir para o curso" : "Quero me inscrever grátis"} <span aria-hidden>→</span>
          </Link>
        </div>
      </section>

      <RodapeSite />
    </div>
  );
}
