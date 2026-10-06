import type { Metadata } from "next";
import { criarClienteSupabaseServer } from "@/lib/supabase-server";
import { CabecalhoSite, RodapeSite } from "@/components/site-chrome";
import { VitrineApostilas } from "@/components/vitrine-apostilas";
import { listarApostilasPublicadas } from "@/lib/apostilas";

export const metadata: Metadata = {
  title: "Apostilas para concursos públicos",
  alternates: { canonical: "/apostilas" },
  description:
    "Apostilas em PDF montadas a partir do edital, com questões e gabarito comentado. Pagamento único por PIX.",
};

export default async function ApostilasPage() {
  const supabase = await criarClienteSupabaseServer();
  const [apostilas, { data: userData }] = await Promise.all([
    listarApostilasPublicadas(supabase),
    supabase.auth.getUser(),
  ]);

  return (
    <div className="flex min-h-screen flex-col bg-white font-body">
      <CabecalhoSite logado={!!userData.user} />
      <main className="flex-1 bg-[#F6F8FB] py-12 sm:py-14">
        <div className="mx-auto max-w-[1180px] px-4 sm:px-6">
          <h1 className="font-display text-[2rem] font-extrabold text-[#14213A] sm:text-[2.6rem]">
            Apostilas
          </h1>
          <p className="mt-2 mb-8 max-w-[60ch] text-[15.5px] leading-relaxed text-[#516278]">
            Escolha o concurso e o cargo. Cada apostila é em PDF, tem questões
            de treino com gabarito comentado e é paga uma única vez.
          </p>
          <VitrineApostilas apostilas={apostilas} comBusca />
        </div>
      </main>
      <RodapeSite />
    </div>
  );
}
