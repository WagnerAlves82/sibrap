import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CabecalhoSite, RodapeSite } from "@/components/site-chrome";
import { criarClienteSupabasePublico } from "@/lib/supabase-publico";
import { formatarDataLonga, markdownParaHtml } from "@/lib/blog";
import { capaDoGuia, listarGuias, perguntasDoGuia } from "@/lib/profissoes";
import { EMISSOR } from "@/lib/emissor";

export const revalidate = 3600;

type Props = { params: Promise<{ slug: string }> };

async function carregar(slug: string) {
  const supabase = criarClienteSupabasePublico();
  const { data } = await supabase.from("guias_profissoes").select("*").eq("slug", slug).eq("status", "publicada").maybeSingle();
  return { supabase, guia: data };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { guia } = await carregar(slug);
  if (!guia) return {};
  const titulo = guia.seo_titulo || guia.titulo;
  const descricao = guia.seo_descricao || guia.resumo;
  const capa = capaDoGuia(guia);
  return {
    title: titulo,
    description: descricao,
    keywords: guia.palavras_chave,
    alternates: { canonical: `/profissoes/${slug}` },
    openGraph: {
      title: titulo,
      description: descricao,
      url: `/profissoes/${slug}`,
      type: "article",
      locale: "pt_BR",
      publishedTime: guia.publicado_em ?? undefined,
      modifiedTime: guia.atualizado_em,
      section: "Profissões",
      tags: guia.hashtags.map((h) => h.replace(/^#/, "")),
      images: capa ? [{ url: capa }] : ["/opengraph-image"],
    },
    twitter: { card: "summary_large_image", title: titulo, description: descricao, images: capa ? [capa] : undefined },
  };
}

export default async function GuiaProfissaoPage({ params }: Props) {
  const { slug } = await params;
  const { supabase, guia } = await carregar(slug);
  if (!guia) notFound();

  const outros = (await listarGuias(supabase, 7)).filter((g) => g.slug !== guia.slug).slice(0, 6);
  const perguntas = perguntasDoGuia(guia);
  const capa = capaDoGuia(guia);
  const html = markdownParaHtml(guia.conteudo);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.sibrap.tec.br";
  const url = `${siteUrl}/profissoes/${guia.slug}`;
  const cursoHref = guia.curso_link
    ? `${guia.curso_link}${guia.curso_link.includes("?") ? "&" : "?"}utm_source=site&utm_medium=organico&utm_campaign=profissoes-${guia.slug}`
    : null;

  const dados = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": `${url}#artigo`,
        headline: guia.titulo,
        description: guia.resumo,
        inLanguage: "pt-BR",
        articleSection: "Profissões",
        about: { "@type": "Occupation", name: guia.profissao },
        keywords: guia.palavras_chave.join(", "),
        datePublished: guia.publicado_em,
        dateModified: guia.atualizado_em,
        mainEntityOfPage: url,
        image: capa ? [capa] : undefined,
        author: { "@type": "Organization", name: EMISSOR.nomeCurto, url: siteUrl },
        publisher: { "@type": "Organization", name: EMISSOR.nomeCurto, url: siteUrl, logo: { "@type": "ImageObject", url: `${siteUrl}/logo.png` } },
        speakable: { "@type": "SpeakableSpecification", cssSelector: ["h1", "#resumo-guia"] },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Início", item: siteUrl },
          { "@type": "ListItem", position: 2, name: "Profissões", item: `${siteUrl}/profissoes` },
          { "@type": "ListItem", position: 3, name: guia.profissao, item: url },
        ],
      },
      ...(perguntas.length
        ? [
            {
              "@type": "FAQPage",
              mainEntity: perguntas.map((p) => ({
                "@type": "Question",
                name: p.pergunta,
                acceptedAnswer: { "@type": "Answer", text: p.resposta },
              })),
            },
          ]
        : []),
    ],
  };

  return (
    <div className="flex min-h-screen flex-col bg-white font-body">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(dados) }} />
      <CabecalhoSite />
      <main className="flex-1 py-8 sm:py-10">
        <div className="mx-auto grid max-w-[1180px] gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <article className="min-w-0">
            <nav aria-label="Você está em" className="text-[12.5px] text-[#516278]">
              <Link href="/profissoes" className="hover:text-brand">
                Profissões
              </Link>
              <span className="mx-1.5 opacity-50">/</span>
              {guia.area}
            </nav>
            <p className="mt-4 font-data text-[11px] font-semibold uppercase tracking-wide text-accent-2">
              Guia de profissão · atualizado em {formatarDataLonga(guia.atualizado_em)}
            </p>
            <h1 className="mt-2 font-display text-[1.9rem] font-extrabold leading-tight text-[#14213A] sm:text-[2.5rem]">{guia.titulo}</h1>
            <p id="resumo-guia" className="mt-4 border-l-4 border-accent bg-[#F6F9FC] px-4 py-3 text-[15.5px] leading-relaxed text-[#2A3A52]">
              <strong>Resumo:</strong> {guia.resumo}
            </p>
            {capa && (
              <figure className="mt-6">
                <span className="relative block aspect-[16/9] w-full overflow-hidden bg-surface-2">
                  <Image src={capa} alt={guia.profissao} fill priority sizes="(min-width: 1024px) 800px, 100vw" className="object-cover" />
                </span>
                {guia.capa_credito && <figcaption className="mt-1.5 text-[11.5px] text-[#93A0AF]">{guia.capa_credito}</figcaption>}
              </figure>
            )}

            <div className="post-conteudo mt-8 text-[16px] leading-relaxed" dangerouslySetInnerHTML={{ __html: html }} />

            {perguntas.length > 0 && (
              <section aria-labelledby="perguntas" className="mt-10">
                <h2 id="perguntas" className="font-display text-[1.4rem] font-extrabold text-[#14213A]">
                  Perguntas frequentes
                </h2>
                <div className="mt-3 divide-y divide-[#D7DEE6] border-y border-[#D7DEE6]">
                  {perguntas.map((p) => (
                    <details key={p.pergunta} className="group py-3">
                      <summary className="cursor-pointer list-none font-semibold text-[#14213A]">
                        <span className="mr-2 text-accent-2 group-open:hidden">+</span>
                        <span className="mr-2 hidden text-accent-2 group-open:inline">−</span>
                        {p.pergunta}
                      </summary>
                      <p className="mt-2 text-[15px] leading-relaxed text-[#516278]">{p.resposta}</p>
                    </details>
                  ))}
                </div>
              </section>
            )}

            {cursoHref && (
              <aside
                aria-label="Curso relacionado"
                className="mt-10 flex flex-col gap-3 border border-[#D7DEE6] bg-[#F6F9FC] p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-data text-[11px] font-semibold uppercase tracking-wide text-[#516278]">Quer começar nessa área?</p>
                  <p className="mt-1 text-[15.5px] leading-snug text-[#14213A]">
                    {guia.curso_chamada ?? "O SIBRAP tem um curso online com certificado para quem está começando."}
                  </p>
                </div>
                <Link
                  href={cursoHref}
                  className="shrink-0 bg-brand px-4 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:brightness-125"
                >
                  Conhecer o curso →
                </Link>
              </aside>
            )}

            {guia.hashtags.length > 0 && <p className="mt-6 text-[13px] text-[#93A0AF]">{guia.hashtags.join(" ")}</p>}
          </article>

          <aside className="lg:pt-16">
            {outros.length > 0 && (
              <div className="border border-[#D7DEE6]">
                <h2 className="border-b border-[#D7DEE6] bg-[#F6F9FC] px-4 py-2.5 font-data text-[11px] font-semibold uppercase tracking-wide text-[#516278]">
                  Outras profissões
                </h2>
                <ul className="divide-y divide-[#EEF2F6]">
                  {outros.map((g) => (
                    <li key={g.id}>
                      <Link href={`/profissoes/${g.slug}`} className="block px-4 py-3 text-[14.5px] font-semibold leading-snug text-[#14213A] hover:text-brand">
                        {g.titulo}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        </div>
      </main>
      <RodapeSite />
    </div>
  );
}
