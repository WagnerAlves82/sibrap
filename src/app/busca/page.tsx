import type { Metadata } from "next";
import Link from "next/link";
import { criarClienteSupabaseServer } from "@/lib/supabase-server";
import { CabecalhoSite, RodapeSite } from "@/components/site-chrome";
import { CardApostila } from "@/components/card-apostila";
import { CardPost } from "@/components/card-post";
import { listarApostilasPublicadas } from "@/lib/apostilas";
import { listarPostsVitrine } from "@/lib/blog";
import { casaComTermos, termosDaBusca, textoDaApostila, textoDoPost } from "@/lib/busca";

export const metadata: Metadata = {
  title: "Buscar no SIBRAP",
  robots: { index: false },
};

const SUGESTOES = ["apostila Curitiba", "técnico de enfermagem Amapá", "professor Porto Velho", "agente administrativo", "Santa Catarina"];

export default async function BuscaPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const busca = q.trim().slice(0, 80);
  const termos = termosDaBusca(busca);

  const supabase = await criarClienteSupabaseServer();
  const [apostilas, posts, { data: userData }] = await Promise.all([
    listarApostilasPublicadas(supabase),
    listarPostsVitrine(supabase),
    supabase.auth.getUser(),
  ]);

  const apostilasAchadas = termos.length ? apostilas.filter((a) => casaComTermos(textoDaApostila(a), termos)) : [];
  const postsAchados = termos.length ? posts.filter((p) => casaComTermos(textoDoPost(p), termos)).slice(0, 24) : [];
  const nada = termos.length > 0 && apostilasAchadas.length === 0 && postsAchados.length === 0;

  return (
    <div className="flex min-h-screen flex-col bg-white font-body">
      <CabecalhoSite logado={!!userData.user} semBusca />
      <main className="flex-1 bg-[#F6F8FB] py-10 sm:py-12">
        <div className="mx-auto max-w-[1180px] px-4 sm:px-6">
          <h1 className="font-display text-[1.8rem] font-extrabold text-[#14213A] sm:text-[2.3rem]">Buscar</h1>
          <form action="/busca" method="get" role="search" className="mt-4 flex max-w-[640px] gap-2">
            <input
              type="search"
              name="q"
              defaultValue={busca}
              autoFocus={!busca}
              placeholder="Ex.: apostila Curitiba, técnico de enfermagem, Santa Catarina"
              aria-label="Buscar apostilas e notícias"
              className="min-w-0 flex-1 rounded-lg border border-[#D7DEE6] bg-white px-4 py-3 text-[15px] text-[#14213A] focus:border-brand focus:outline-none"
            />
            <button type="submit" className="rounded-lg bg-brand px-5 py-3 text-[15px] font-bold text-white hover:brightness-125">
              Buscar
            </button>
          </form>

          {!termos.length && (
            <div className="mt-6">
              <p className="text-[14px] text-[#516278]">Digite poucas palavras: o órgão, a cidade, o cargo ou o estado. Por exemplo:</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {SUGESTOES.map((s) => (
                  <Link
                    key={s}
                    href={`/busca?q=${encodeURIComponent(s)}`}
                    className="rounded-full border border-[#D7DEE6] bg-white px-3.5 py-1.5 text-[13px] font-semibold text-[#33465E] hover:border-brand hover:text-brand"
                  >
                    {s}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {nada && (
            <p className="mt-8 rounded-xl border border-dashed border-[#C4CEDA] bg-white px-6 py-10 text-center text-[15px] text-[#516278]">
              Não achamos nada para “{busca}”. Tente menos palavras, só a cidade ou o cargo, ou veja{" "}
              <Link href="/apostilas" className="font-semibold text-brand underline underline-offset-4">
                todas as apostilas
              </Link>{" "}
              e as{" "}
              <Link href="/noticias" className="font-semibold text-brand underline underline-offset-4">
                notícias
              </Link>
              .
            </p>
          )}

          {apostilasAchadas.length > 0 && (
            <section className="mt-8" aria-label="Apostilas encontradas">
              <h2 className="font-display text-[1.3rem] font-extrabold text-[#14213A]">
                Apostilas <span className="font-data text-[14px] font-semibold text-[#516278]">({apostilasAchadas.length})</span>
              </h2>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
                {apostilasAchadas.map((a) => (
                  <CardApostila key={a.id} apostila={a} />
                ))}
              </div>
            </section>
          )}

          {postsAchados.length > 0 && (
            <section className="mt-10" aria-label="Notícias encontradas">
              <h2 className="font-display text-[1.3rem] font-extrabold text-[#14213A]">
                Notícias <span className="font-data text-[14px] font-semibold text-[#516278]">({postsAchados.length})</span>
              </h2>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
                {postsAchados.map((p) => (
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
