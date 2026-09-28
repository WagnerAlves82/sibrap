import type { Metadata } from "next";
import { criarClienteSupabaseServer } from "@/lib/supabase-server";
import { CabecalhoSite, RodapeSite } from "@/components/site-chrome";
import { VitrinePosts } from "@/components/vitrine-posts";
import { listarPostsPublicados } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog de concursos públicos",
  description:
    "Editais, prazos de inscrição e dicas de estudo para concursos públicos, organizados por região e estado.",
};

export default async function BlogPage() {
  const supabase = await criarClienteSupabaseServer();
  const [posts, { data: userData }] = await Promise.all([
    listarPostsPublicados(supabase),
    supabase.auth.getUser(),
  ]);

  return (
    <div className="flex min-h-screen flex-col bg-white font-body">
      <CabecalhoSite logado={!!userData.user} />
      <main className="flex-1 bg-[#F6F8FB] py-12 sm:py-14">
        <div className="mx-auto max-w-[1180px] px-4 sm:px-6">
          <h1 className="font-display text-[2rem] font-extrabold text-[#14213A] sm:text-[2.6rem]">
            Blog
          </h1>
          <p className="mt-2 mb-8 max-w-[60ch] text-[15.5px] leading-relaxed text-[#516278]">
            Editais novos, prazos de inscrição e dicas de estudo. Filtre por
            região ou estado pra ver só o que interessa pra você.
          </p>
          <VitrinePosts posts={posts} comBusca />
        </div>
      </main>
      <RodapeSite />
    </div>
  );
}
