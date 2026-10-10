import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { criarClienteSupabaseServer } from "@/lib/supabase-server";
import { CabecalhoSite, RodapeSite } from "@/components/site-chrome";
import { CardPost } from "@/components/card-post";
import { listarApostilasPublicadas } from "@/lib/apostilas";
import { CapaImagem } from "@/components/capa-imagem";
import { PromoApostila } from "@/components/promo-apostila";
import { CardApostilaMini } from "@/components/card-apostila-mini";
import { GarantaPreparacao } from "@/components/garanta-preparacao";
import {
  apostilasRelacionadas,
  formatarDataLonga,
  markdownParaHtml,
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
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      title: post.titulo,
      description: descricao,
      type: "article",
      url: `/blog/${slug}`,
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

  const { data: relacionadosData } = await supabase
    .from("posts")
    .select("*")
    .eq("status", "publicada")
    .neq("id", post.id)
    .order("publicado_em", { ascending: false })
    .limit(3);
  const relacionados = relacionadosData ?? [];
  const todasApostilas = await listarApostilasPublicadas(supabase);
  const apostilasEspecificas = apostilasRelacionadas(post, todasApostilas, 4);
  const apostilas = apostilasEspecificas.length > 0 ? apostilasEspecificas : todasApostilas.slice(0, 2);
  const apostilasSaoEspecificas = apostilasEspecificas.length > 0;

  const urlPost = `${siteUrl}/blog/${slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    mainEntityOfPage: { "@type": "WebPage", "@id": urlPost },
    inLanguage: "pt-BR",
    publisher: { "@type": "Organization", name: "SIBRAP", logo: { "@type": "ImageObject", url: `${siteUrl}/logo.png` } },
    headline: post.titulo,
    description: post.seo_descricao || post.resumo || resumoAutomatico(post.conteudo),
    keywords: post.palavras_chave?.length ? post.palavras_chave.join(", ") : undefined,
    image: capa ?? undefined,
    datePublished: post.publicado_em ?? post.criado_em,
    dateModified: post.atualizado_em,
    author: { "@type": "Organization", name: post.autor || "SIBRAP" },
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Início", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${siteUrl}/blog` },
      { "@type": "ListItem", position: 3, name: post.titulo, item: urlPost },
    ],
  };

  return (
    <div className="flex min-h-screen flex-col bg-white font-body">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <CabecalhoSite logado={!!user} />

      <main className="flex-1 bg-[#F6F8FB] py-10 sm:py-14">
        <article className="mx-auto max-w-[760px] px-4 sm:px-6">
          <nav aria-label="Você está em" className="mb-4 text-[13px] text-[#516278]">
            <Link href="/blog" className="hover:text-brand">
              Blog
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
            {data ? ` · ${data}` : ""}
          </p>
          <h1 className="mt-1.5 font-display text-[1.9rem] leading-[1.1] font-extrabold text-balance text-[#14213A] sm:text-[2.4rem]">
            {post.titulo}
          </h1>

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
            // propaganda orgânica no meio do texto: divide o HTML no bloco central
            const blocos = html.split("\n");
            const meio = Math.ceil(blocos.length / 2);
            const promo = apostilas[0];
            const comPromo = !!promo && blocos.length >= 6;
            return (
              <>
                <div
                  className="post-conteudo mt-8 text-[16px] leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: comPromo ? blocos.slice(0, meio).join("\n") : html }}
                />
                {comPromo && (
                  <div className="my-8 grid">
                    <PromoApostila apostila={promo} variante="faixa" origem="blog-post" />
                  </div>
                )}
                {comPromo && (
                  <div
                    className="post-conteudo text-[16px] leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: blocos.slice(meio).join("\n") }}
                  />
                )}
              </>
            );
          })()}

          <p className="mt-10 max-w-[62ch] text-[12.5px] leading-relaxed text-[#516278]">
            Conteúdo informativo, sem vínculo com a banca ou o órgão do
            concurso. O edital oficial sempre prevalece sobre qualquer
            conteúdo deste post.
          </p>

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

          {relacionados.length > 0 && (
            <div className="mt-14">
              <h2 className="font-display text-xl font-extrabold text-[#14213A]">Veja também</h2>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                {relacionados.map((p) => (
                  <CardPost key={p.id} post={p} />
                ))}
              </div>
            </div>
          )}
        </article>
      </main>
      <RodapeSite />
    </div>
  );
}
