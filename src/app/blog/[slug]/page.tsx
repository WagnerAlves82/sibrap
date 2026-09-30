import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { criarClienteSupabaseServer } from "@/lib/supabase-server";
import { CabecalhoSite, RodapeSite } from "@/components/site-chrome";
import { CardPost } from "@/components/card-post";
import { listarApostilasPublicadas } from "@/lib/apostilas";
import { CardApostilaMini } from "@/components/card-apostila-mini";
import {
  apostilasRelacionadas,
  formatarDataLonga,
  markdownParaHtml,
  resumoAutomatico,
  slugValidoPost,
  urlCapa,
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
  const descricao = post.resumo || resumoAutomatico(post.conteudo);
  const capa = urlCapa(post.capa_path);
  return {
    title: post.titulo,
    description: descricao,
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

  const capa = urlCapa(post.capa_path);
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
  const apostilas = apostilasRelacionadas(post, await listarApostilasPublicadas(supabase));

  const urlPost = `${siteUrl}/blog/${slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    mainEntityOfPage: { "@type": "WebPage", "@id": urlPost },
    inLanguage: "pt-BR",
    publisher: { "@type": "Organization", name: "SIBRAP", logo: { "@type": "ImageObject", url: `${siteUrl}/logo.png` } },
    headline: post.titulo,
    description: post.resumo || resumoAutomatico(post.conteudo),
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

          {capa && (
            <div className="relative mt-6 aspect-[16/9] w-full overflow-hidden rounded-xl bg-[#E6EEF7]">
              <Image src={capa} alt={post.titulo} fill sizes="(min-width: 800px) 760px, 100vw" className="object-cover" priority />
            </div>
          )}

          <div className="post-conteudo mt-8 text-[16px] leading-relaxed" dangerouslySetInnerHTML={{ __html: html }} />

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

          {apostilas.length > 0 && (
            <aside className="mt-6" aria-labelledby="apostila-rel">
              <h2 id="apostila-rel" className="font-data text-[11px] font-semibold uppercase tracking-wide text-[#516278]">
                Estude com a apostila do edital
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
