import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { criarClienteSupabaseServer } from "@/lib/supabase-server";
import { CabecalhoSite, RodapeSite } from "@/components/site-chrome";
import { VitrineApostilas } from "@/components/vitrine-apostilas";
import { CardPost } from "@/components/card-post";
import { formatarDataIso, listarApostilasPublicadas } from "@/lib/apostilas";
import { listarPostsVitrine } from "@/lib/blog";
import { bancasDasApostilas, slugDaBanca } from "@/lib/bancas";

type Props = { params: Promise<{ slug: string }> };

async function carregar(slug: string) {
  const supabase = await criarClienteSupabaseServer();
  const apostilas = await listarApostilasPublicadas(supabase);
  const banca = bancasDasApostilas(apostilas).find((b) => b.slug === slug);
  if (!banca) return null;
  return { supabase, banca, apostilas: apostilas.filter((a) => a.banca && slugDaBanca(a.banca) === slug) };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const d = await carregar(slug);
  if (!d) return {};
  const titulo = `Apostilas de concursos da banca ${d.banca.nome}`;
  const descricao = `Apostilas em PDF com simulado on-line para concursos organizados pela banca ${d.banca.nome}: ${d.apostilas
    .map((a) => `${a.cargo} (${a.cidade ?? a.orgao})`)
    .slice(0, 3)
    .join("; ")}.`;
  return {
    title: titulo,
    description: descricao,
    alternates: { canonical: `/bancas/${slug}` },
    openGraph: { url: `/bancas/${slug}`, locale: "pt_BR", title: titulo, description: descricao, type: "website" },
  };
}

export default async function BancaPage({ params }: Props) {
  const { slug } = await params;
  const d = await carregar(slug);
  if (!d) notFound();
  const { supabase, banca, apostilas } = d;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const nomeBanca = banca.nome.toLowerCase();
  const posts = (await listarPostsVitrine(supabase))
    .filter((p) => `${p.titulo} ${p.conteudo}`.toLowerCase().includes(nomeBanca))
    .slice(0, 3);
  const provas = apostilas
    .filter((a) => a.data_prova)
    .sort((a, b) => (a.data_prova! < b.data_prova! ? -1 : 1))
    .map((a) => `${a.cidade ?? a.orgao}: ${formatarDataIso(a.data_prova)}`);

  return (
    <div className="flex min-h-screen flex-col bg-white font-body">
      <CabecalhoSite logado={!!user} />
      <main className="flex-1 bg-[#F6F8FB] py-10 sm:py-12">
        <div className="mx-auto max-w-[1180px] px-4 sm:px-6">
          <nav aria-label="Você está em" className="mb-3 text-[13px] text-[#516278]">
            <Link href="/bancas" className="hover:text-brand">
              Bancas
            </Link>
            <span className="mx-1.5 opacity-50">/</span>
            {banca.nome}
          </nav>
          <h1 className="font-display text-[1.8rem] leading-tight font-extrabold text-[#14213A] sm:text-[2.4rem]">
            Apostilas para concursos da banca {banca.nome}
          </h1>
          <p className="mt-3 max-w-[70ch] text-[15.5px] leading-relaxed text-[#516278]">
            {apostilas.length === 1 ? "A apostila" : `As ${apostilas.length} apostilas`} abaixo{" "}
            {apostilas.length === 1 ? "foi montada" : "foram montadas"} a partir do edital de concursos organizados pela{" "}
            {banca.nome}, com conteúdo na ordem do edital, questões comentadas e simulado on-line.
            {provas.length > 0 && <> Próximas provas: {provas.join(" · ")}.</>}
          </p>

          <div className="mt-8">
            <VitrineApostilas apostilas={apostilas} />
          </div>

          {posts.length > 0 && (
            <section className="mt-12" aria-label="Notícias">
              <h2 className="font-display text-[1.4rem] font-extrabold text-[#14213A] sm:text-[1.8rem]">
                Notícias de concursos da {banca.nome}
              </h2>
              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
                {posts.map((p) => (
                  <CardPost key={p.id} post={p} />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
      <RodapeSite />
    </div>
  );
}
