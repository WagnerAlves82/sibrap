import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { criarClienteSupabaseServer } from "@/lib/supabase-server";
import { CabecalhoSite, RodapeSite } from "@/components/site-chrome";
import { CardPost } from "@/components/card-post";
import {
  formatarDataLonga,
  markdownParaHtml,
  resumoAutomatico,
  slugValidoPost,
  urlCapa,
} from "@/lib/blog";

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
    openGraph: {
      title: post.titulo,
      description: descricao,
      type: "article",
      images: capa ? [{ url: capa }] : undefined,
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

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.titulo,
    description: post.resumo || resumoAutomatico(post.conteudo),
    image: capa ?? undefined,
    datePublished: post.publicado_em ?? post.criado_em,
    dateModified: post.atualizado_em,
    author: { "@type": "Organization", name: post.autor || "SIBRAP" },
  };

  return (
    <div className="flex min-h-screen flex-col bg-white font-body">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
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
