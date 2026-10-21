import type { Metadata } from "next";
import { criarClienteSupabaseServer } from "@/lib/supabase-server";
import { CabecalhoSite, RodapeSite } from "@/components/site-chrome";
import { VitrinePosts } from "@/components/vitrine-posts";
import { listarPostsVitrine } from "@/lib/blog";
import { listarApostilasPublicadas } from "@/lib/apostilas";

export const metadata: Metadata = {
  title: "Notícias de concursos públicos e processos seletivos: editais, prazos e vagas",
  description:
    "Notícias sobre concursos públicos (vagas efetivas) e processos seletivos (contratação temporária): editais, prazos de inscrição e vagas, por região e estado.",
  alternates: { canonical: "/noticias" },
  openGraph: { title: "Notícias de concursos públicos | SIBRAP", url: "/noticias", type: "website", locale: "pt_BR" },
};

export default async function NoticiasPage({ searchParams }: { searchParams: Promise<{ uf?: string }> }) {
  const { uf } = await searchParams;
  const supabase = await criarClienteSupabaseServer();
  const [posts, apostilas, { data: userData }] = await Promise.all([
    listarPostsVitrine(supabase),
    listarApostilasPublicadas(supabase),
    supabase.auth.getUser(),
  ]);

  return (
    <div className="flex min-h-screen flex-col bg-white font-body">
      <CabecalhoSite logado={!!userData.user} />
      <main className="flex-1 bg-white py-12 sm:py-14">
        <div className="mx-auto max-w-[1180px] px-4 sm:px-6">
          <h1 className="font-display text-[2rem] font-extrabold text-[#14213A] sm:text-[2.6rem]">
            Notícias de concursos
          </h1>
          <p className="mt-2 mb-8 max-w-[60ch] text-[15.5px] leading-relaxed text-[#516278]">
            Editais novos, prazos de inscrição e vagas abertas. Escolha o seu
            estado pra ver as oportunidades mais atuais primeiro.
          </p>
          <VitrinePosts posts={posts} apostilas={apostilas} comBusca ufInicial={uf && /^[A-Z]{2}$/.test(uf) ? uf : ""} />
        </div>
      </main>
      <RodapeSite />
    </div>
  );
}
