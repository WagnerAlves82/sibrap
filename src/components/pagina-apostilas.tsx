import { criarClienteSupabasePublico } from "@/lib/supabase-publico";
import { CabecalhoSite, RodapeSite } from "@/components/site-chrome";
import { VitrineApostilas } from "@/components/vitrine-apostilas";
import { listarApostilasPublicadas } from "@/lib/apostilas";

// Corpo comum de /apostilas e /apostilas/estado/[uf]. Os botões de estado trocam a lista
// no navegador (sem recarregar) e a URL acompanha; a página do estado existe para o Google.
export async function PaginaApostilas({ uf = "" }: { uf?: string }) {
  const apostilas = await listarApostilasPublicadas(criarClienteSupabasePublico());
  return (
    <div className="flex min-h-screen flex-col bg-white font-body">
      <CabecalhoSite />
      <main className="flex-1 bg-[#F6F8FB] py-12 sm:py-14">
        <div className="mx-auto max-w-[1180px] px-4 sm:px-6">
          <h1 className="font-display text-[2rem] font-extrabold text-[#14213A] sm:text-[2.6rem]">
            Apostilas para concursos
          </h1>
          <p className="mt-2 mb-7 max-w-[60ch] text-[15.5px] leading-relaxed text-[#516278]">
            Escolha o estado e o concurso. PDF pelo edital, questões comentadas e pagamento único.
          </p>
          <VitrineApostilas apostilas={apostilas} comBusca porEstado ufInicial={uf} />
        </div>
      </main>
      <RodapeSite />
    </div>
  );
}
