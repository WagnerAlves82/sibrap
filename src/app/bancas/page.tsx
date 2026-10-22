import type { Metadata } from "next";
import Link from "next/link";
import { criarClienteSupabaseServer } from "@/lib/supabase-server";
import { CabecalhoSite, RodapeSite } from "@/components/site-chrome";
import { listarApostilasPublicadas } from "@/lib/apostilas";
import { bancasDasApostilas } from "@/lib/bancas";

export const metadata: Metadata = {
  title: "Apostilas por banca organizadora",
  description: "Veja as apostilas SIBRAP agrupadas pela banca do concurso: Instituto AOCP, FEPESE, Fundação UNIVALI, IBAM e outras.",
  alternates: { canonical: "/bancas" },
};

export default async function BancasPage() {
  const supabase = await criarClienteSupabaseServer();
  const [apostilas, { data: userData }] = await Promise.all([listarApostilasPublicadas(supabase), supabase.auth.getUser()]);
  const bancas = bancasDasApostilas(apostilas);

  return (
    <div className="flex min-h-screen flex-col bg-white font-body">
      <CabecalhoSite logado={!!userData.user} />
      <main className="flex-1 bg-[#F6F8FB] py-10 sm:py-12">
        <div className="mx-auto max-w-[1180px] px-4 sm:px-6">
          <h1 className="font-display text-[1.8rem] font-extrabold text-[#14213A] sm:text-[2.4rem]">Apostilas por banca</h1>
          <p className="mt-3 max-w-[64ch] text-[15.5px] leading-relaxed text-[#516278]">
            Cada banca organizadora tem seu jeito de montar a prova. Escolha a banca do seu concurso para ver as apostilas
            feitas para ela.
          </p>
          <ul className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {bancas.map((b) => (
              <li key={b.slug}>
                <Link
                  href={`/bancas/${b.slug}`}
                  className="flex items-center justify-between rounded-lg border border-[#D7DEE6] bg-white px-4 py-4 font-display text-[1.05rem] font-bold text-[#14213A] transition-colors hover:border-accent"
                >
                  {b.nome}
                  <span className="font-data text-[12.5px] font-semibold text-[#516278]">
                    {b.apostilas} {b.apostilas === 1 ? "apostila" : "apostilas"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </main>
      <RodapeSite />
    </div>
  );
}
