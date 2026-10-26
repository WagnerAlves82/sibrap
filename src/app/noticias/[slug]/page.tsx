import { NotaCertame } from "@/components/concurso-ou-processo";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { criarClienteSupabaseServer } from "@/lib/supabase-server";
import { CabecalhoSite, RodapeSite } from "@/components/site-chrome";
import { BlocoNoticias } from "@/components/noticias-lateral";
import { listarApostilasPublicadas } from "@/lib/apostilas";
import { CapaImagem } from "@/components/capa-imagem";
import { CarrosselEstado } from "@/components/carrossel-estado";
import { CardApostilaMini } from "@/components/card-apostila-mini";
import { GarantaPreparacao } from "@/components/garanta-preparacao";
import {
  apostilasRelacionadas,
  formatarDataLonga,
  markdownParaHtml,
  pontuacaoDivulgacao,
  resumoAutomatico,
  slugValidoPost,
  capaDoPost,
} from "@/lib/blog";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sibrap.tec.br";

type Props = { params: Promise<{ slug: string }> };

async function carregar(slug: string) {
  const supabase = await criarClienteSupabaseServer();
  if (!slugValidoPost(slug)) return { supabase, post: null };
  const { data } = await supabase
    .from("posts")
    .select("*")
    .eq("slug", slug)
    .eq("status", "publicada")
    .maybeSingle();
  return { supabase, post: data };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { post } = await carregar(slug);
  if (!post) return {};
  const descricao = post.seo_descricao || post.resumo || resumoAutomatico(post.conteudo);
  const capa = capaDoPost(post);
  return {
    title: post.seo_titulo || post.titulo,
    description: descricao,
    keywords: post.palavras_chave?.length ? post.palavras_chave : undefined,
    alternates: { canonical: `/noticias/${slug}`, types: { "application/rss+xml": "/noticias/feed.xml" } },
    // trecho e imagem grandes liberados: ajuda no Google Discover e nas respostas com IA
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
    openGraph: {
      title: post.titulo,
      description: descricao,
      type: "article",
      url: `/noticias/${slug}`,
      locale: "pt_BR",
      publishedTime: post.publicado_em ?? post.criado_em,
      modifiedTime: post.atualizado_em,
      authors: [post.autor || "SIBRAP"],
      section: post.categoria,
      images: capa ? [{ url: capa, alt: post.titulo }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: post.titulo,
      description: descricao,
      images: capa ? [capa] : undefined,
    },
  };
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const { supabase, post } = await carregar(slug);
  if (!post) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const capa = capaDoPost(post);
  const data = formatarDataLonga(post.publicado_em ?? post.criado_em);
  const html = markdownParaHtml(post.conteudo);

  const { data: recentesData } = await supabase
    .from("posts")
    .select("*")
    .eq("status", "publicada")
    .neq("id", post.id)
    .order("publicado_em", { ascending: false })
    .limit(6);
  const recentes = recentesData ?? [];
  const { data: doEstadoData } = post.uf
    ? await supabase
        .from("posts")
        .select("*")
        .eq("status", "publicada")
        .eq("uf", post.uf)
        .neq("id", post.id)
        .order("publicado_em", { ascending: false })
        .limit(12)
    : { data: null };
  const doEstado = (doEstadoData ?? []).slice(0, 5);
  // carrossel do meio: as mais importantes do mesmo estado (esfera + destaque + ajuste manual), depois as mais novas
  const carrossel = [...(doEstadoData ?? [])]
    .sort((a, b) => pontuacaoDivulgacao(b) - pontuacaoDivulgacao(a))
    .slice(0, 8)
    .map((p) => ({ id: p.id, slug: p.slug, titulo: p.titulo, uf: p.uf, regiao: p.regiao, data: formatarDataLonga(p.publicado_em ?? p.criado_em) }));
  const todasApostilas = await listarApostilasPublicadas(supabase);
  const apostilasEspecificas = apostilasRelacionadas(post, todasApostilas, 4);
  const apostilas = apostilasEspecificas.length > 0 ? apostilasEspecificas : todasApostilas.slice(0, 2);
  const apostilasSaoEspecificas = apostilasEspecificas.length > 0;

  const urlPost = `${siteUrl}/noticias/${slug}`;
  const resumo = post.resumo || post.seo_descricao || resumoAutomatico(post.conteudo);
  const atualizado = formatarDataLonga(post.atualizado_em);
  const foiAtualizado = new Date(post.atualizado_em).getTime() - new Date(post.publicado_em ?? post.criado_em).getTime() > 6 * 3600 * 1000;
  const orgSibrap = { "@type": "Organization", "@id": `${siteUrl}/#organizacao`, name: "SIBRAP", url: siteUrl, logo: { "@type": "ImageObject", url: `${siteUrl}/logo.png` } };
  // NewsArticle completo: é o que o Google (Notícias e AI Overviews), o Bing/ChatGPT e o Perplexity leem para
  // entender do que se trata, de quando é, onde é e quem publicou. "speakable" aponta o título e o resumo.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    mainEntityOfPage: { "@type": "WebPage", "@id": urlPost },
    url: urlPost,
    inLanguage: "pt-BR",
    publisher: orgSibrap,
    author: post.autor && post.autor !== "SIBRAP" ? { "@type": "Person", name: post.autor } : orgSibrap,
    headline: post.titulo.slice(0, 110),
    alternativeHeadline: post.seo_titulo && post.seo_titulo !== post.titulo ? post.seo_titulo : undefined,
    description: post.seo_descricao || resumo,
    abstract: resumo,
    articleSection: post.categoria,
    keywords: post.palavras_chave?.length ? post.palavras_chave.join(", ") : undefined,
    image: capa ? [capa] : undefined,
    thumbnailUrl: capa ?? undefined,
    datePublished: post.publicado_em ?? post.criado_em,
    dateModified: post.atualizado_em,
    isAccessibleForFree: true,
    wordCount: post.conteudo.split(/\s+/).filter(Boolean).length,
    contentLocation: post.uf ? { "@type": "Place", address: { "@type": "PostalAddress", addressRegion: post.uf, addressCountry: "BR" } } : undefined,
    citation: post.edital_url ?? undefined,
    speakable: { "@type": "SpeakableSpecification", cssSelector: ["h1", "#resumo-materia"] },
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Início", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Notícias", item: `${siteUrl}/noticias` },
      { "@type": "ListItem", position: 3, name: post.titulo, item: urlPost },
    ],
  };

  return (
    <div className="flex min-h-screen flex-col bg-white font-body">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <CabecalhoSite logado={!!user} />

      <main className="flex-1 bg-white py-10 sm:py-14">
        <div className="mx-auto grid max-w-[1180px] gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <article className="min-w-0 max-w-[760px]">
          <nav aria-label="Você está em" className="mb-4 text-[13px] text-[#516278]">
            <Link href="/noticias" className="hover:text-brand">
              Notícias
            </Link>
            {(post.uf || post.regiao) && (
              <>
                <span className="mx-1.5 opacity-50">/</span>
                {post.uf ?? post.regiao}
              </>
            )}
          </nav>

          <p className="font-data text-[11.5px] font-semibold uppercase tracking-wide text-accent-2">
            {post.categoria}
            {data && (
              <>
                {" · "}
                <time dateTime={post.publicado_em ?? post.criado_em}>{data}</time>
              </>
            )}
            {foiAtualizado && atualizado && (
              <>
                {" · Atualizado em "}
                <time dateTime={post.atualizado_em}>{atualizado}</time>
              </>
            )}
          </p>
          <h1 className="mt-1.5 font-display text-[1.9rem] leading-[1.1] font-extrabold text-balance text-[#14213A] sm:text-[2.4rem]">
            {post.titulo}
          </h1>

          {/* resposta direta logo no topo: é o trecho que os buscadores com IA costumam citar */}
          {resumo && (
            <p id="resumo-materia" className="mt-4 border-l-4 border-accent bg-[#F6F9FC] px-4 py-3 text-[15.5px] leading-relaxed text-[#2A3A52]">
              <strong className="text-[#14213A]">Resumo: </strong>
              {resumo}
            </p>
          )}

          <NotaCertame tipo={post.certame_tipo} />

          {(post.certame_tipo || post.edital_numero) && (
            <div className="mt-5 grid grid-cols-1 gap-x-6 gap-y-3 rounded-xl border-2 border-accent bg-brand-deep px-5 py-4 sm:grid-cols-3">
              {post.certame_tipo && (
                <div>
                  <p className="font-data text-[10.5px] font-bold uppercase tracking-wider text-accent">Certame</p>
                  <p className="font-data text-[13.5px] font-bold uppercase text-white">{post.certame_tipo}</p>
                </div>
              )}
              {post.edital_numero && (
                <div>
                  <p className="font-data text-[10.5px] font-bold uppercase tracking-wider text-accent">Edital</p>
                  <p className="font-data text-[13.5px] font-bold uppercase text-white">{post.edital_numero}</p>
                </div>
              )}
              <div>
                <p className="font-data text-[10.5px] font-bold uppercase tracking-wider text-accent">Retificações</p>
                <p className="font-data text-[13.5px] font-bold uppercase text-white">{post.retificacoes || "Nenhuma até o momento"}</p>
              </div>
            </div>
          )}

          {capa && (
            <figure className="mt-6">
              <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl bg-[#E6EEF7]">
                <CapaImagem src={capa} alt={post.titulo} sizes="(min-width: 800px) 760px, 100vw" className="object-cover" priority fallback={null} />
              </div>
              {post.capa_credito && (
                <figcaption className="mt-1.5 text-[11.5px] leading-snug text-[#516278]">
                  {post.capa_credito.split(/(https?:\/\/\S+)/).map((parte, i) =>
                    /^https?:\/\//.test(parte) ? (
                      <a key={i} href={parte} target="_blank" rel="noopener noreferrer nofollow" className="underline hover:text-brand">
                        {parte}
                      </a>
                    ) : (
                      parte
                    )
                  )}
                </figcaption>
              )}
            </figure>
          )}

          {(() => {
            // no meio do texto só o carrossel de matérias do mesmo estado (a loja fica no pé da matéria);
            // sem outra matéria do estado, o texto segue inteiro
            const blocos = html.split("\n");
            const meio = Math.ceil(blocos.length / 2);
            const comCarrossel = !!post.uf && carrossel.length > 0 && blocos.length >= 6;
            return (
              <>
                <div
                  className="post-conteudo mt-8 text-[16px] leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: comCarrossel ? blocos.slice(0, meio).join("\n") : html }}
                />
                {comCarrossel && <CarrosselEstado uf={post.uf!} itens={carrossel} />}
                {comCarrossel && (
                  <div
                    className="post-conteudo text-[16px] leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: blocos.slice(meio).join("\n") }}
                  />
                )}
              </>
            );
          })()}

          {post.edital_url && (
            <aside className="mt-12 flex flex-col gap-3 rounded-2xl border border-[#D7DEE6] bg-white p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div>
                <h2 className="font-display text-lg font-extrabold text-[#14213A]">Edital oficial</h2>
                <p className="mt-0.5 text-[14px] text-[#516278]">Leia o edital completo na fonte, com regras, vagas e prazos.</p>
              </div>
              <a
                href={post.edital_url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="shrink-0 rounded-md bg-brand px-4 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:brightness-125"
              >
                Abrir o edital →
              </a>
            </aside>
          )}

          {apostilasSaoEspecificas && <GarantaPreparacao apostilas={apostilasEspecificas} />}

          {apostilas.length > 0 && !apostilasSaoEspecificas && (
            <aside className="mt-6" aria-labelledby="apostila-rel">
              <h2 id="apostila-rel" className="font-data text-[11px] font-semibold uppercase tracking-wide text-[#516278]">
                {apostilasSaoEspecificas ? "Estude com a apostila do edital" : "Enquanto isso, confira nossas apostilas"}
              </h2>
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {apostilas.map((a) => (
                  <CardApostilaMini key={a.id} apostila={a} />
                ))}
              </div>
            </aside>
          )}

        </article>

        <aside className="flex flex-col gap-6" aria-label="Mais notícias">
          <BlocoNoticias titulo="Leia também" posts={recentes} />
          {doEstado.length >= 2 && <BlocoNoticias titulo={`Concursos em ${post.uf}`} posts={doEstado} />}
        </aside>
        </div>
      </main>
      <RodapeSite />
    </div>
  );
}
