import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { criarClienteSupabaseServer } from "@/lib/supabase-server";
import { CabecalhoSite } from "@/components/site-chrome";
import { formatarReais } from "@/lib/curso-pago";
import { CURSOS_PACOTE_ADM, HORAS_PACOTE_ADM, PACOTE_ADM } from "@/lib/pacote-administrativo";
import { ComprarPacote } from "./ComprarPacote";

export const metadata: Metadata = { title: "Pacote Administrativo", robots: { index: false } };

// Área do aluno do pacote: sem compra, mostra o PIX; com compra, os cursos e o caminho dos certificados.
export default async function PacoteAdministrativoAreaPage() {
  const supabase = await criarClienteSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/cadastro?next=${encodeURIComponent(PACOTE_ADM.area)}`);

  const [{ data: produto }, { data: acessos }] = await Promise.all([
    supabase.from("produtos").select("preco_centavos").eq("slug", PACOTE_ADM.produto).eq("ativo", true).maybeSingle(),
    supabase.from("acessos").select("produtos!inner(slug)").eq("produtos.slug", PACOTE_ADM.produto),
  ]);
  const comprou = (acessos ?? []).length > 0;
  const valor = produto?.preco_centavos ?? PACOTE_ADM.precoCentavos;

  if (!comprou) {
    return (
      <div className="flex min-h-screen flex-col bg-surface-2 font-body">
        <CabecalhoSite aluno logado />
        <main className="mx-auto flex w-full max-w-[640px] flex-1 items-center px-6 py-14">
          <div className="w-full border border-[#D7DEE6] bg-white p-8">
            <p className="font-data text-xs font-semibold uppercase tracking-wide text-accent-2">
              4 cursos · 4 certificados · {HORAS_PACOTE_ADM} h
            </p>
            <h1 className="mt-2 font-display text-3xl font-extrabold text-[#14213A]">{PACOTE_ADM.nome}</h1>
            <ul className="mt-4 flex flex-col gap-2 text-[15px] text-[#2B3A52]">
              {CURSOS_PACOTE_ADM.map((c) => (
                <li key={c.slug} className="flex gap-2">
                  <span aria-hidden className="font-bold text-accent-2">
                    ✓
                  </span>
                  {c.nome} ({c.horas} h)
                </li>
              ))}
            </ul>
            <p className="mt-4 text-[15px] leading-relaxed text-[#516278]">
              Pagamento único de <strong className="text-[#14213A]">{formatarReais(valor)}</strong> no PIX. Assim que o
              pagamento cair, os 4 certificados ficam garantidos nesta página.
            </p>
            <div className="mt-6">
              <ComprarPacote preco={formatarReais(valor)} valorCentavos={valor} />
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-surface-2 font-body">
      <CabecalhoSite aluno logado />
      <main className="mx-auto w-full max-w-[820px] flex-1 px-6 py-14">
        <p className="font-data text-xs font-semibold uppercase tracking-wide text-accent-2">Compra confirmada</p>
        <h1 className="mt-2 font-display text-3xl font-extrabold text-[#14213A]">{PACOTE_ADM.nome}</h1>
        <p className="mt-2 text-[15.5px] text-[#516278]">
          Seus 4 certificados estão pagos. Conclua as aulas e a prova de cada curso para emitir.
        </p>
        <div className="mt-7 flex flex-col gap-3">
          {CURSOS_PACOTE_ADM.map((c, i) => (
            <Link
              key={c.slug}
              href={`/minha-area/cursos/${c.slug}`}
              className="flex items-center justify-between gap-4 border border-[#D7DEE6] bg-white p-5 transition-colors hover:border-brand"
            >
              <span>
                <span className="font-display text-2xl font-extrabold text-accent">{i + 1}</span>
                <span className="ml-3 font-display text-[17px] font-bold text-[#14213A]">{c.nome}</span>
                <span className="ml-2 font-data text-[13px] text-[#516278]">{c.horas} h</span>
              </span>
              <span className="shrink-0 font-bold text-brand">Estudar →</span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
