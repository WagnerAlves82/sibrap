import type { Metadata } from "next";
import Link from "next/link";
import { criarClienteSupabaseServer } from "@/lib/supabase-server";
import { CabecalhoSite, RodapeSite } from "@/components/site-chrome";
import { ResultadoValidacao } from "../resultado";

export const metadata: Metadata = {
  title: "Validação de certificado",
  robots: { index: false, follow: false },
};

export default async function ValidarCodigoPage({
  params,
}: {
  params: Promise<{ codigo: string }>;
}) {
  const { codigo } = await params;
  const supabase = await criarClienteSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-screen flex-col bg-surface-2 font-body">
      <CabecalhoSite logado={!!user} />
      <main className="mx-auto w-full max-w-[720px] flex-1 px-6 py-12">
        <h1 className="mb-6 font-display text-3xl font-extrabold text-[#14213A]">
          Validação de certificado
        </h1>
        <ResultadoValidacao codigo={decodeURIComponent(codigo).slice(0, 40)} />
        <Link href="/validar" className="mt-6 inline-block text-[14px] font-semibold text-brand underline underline-offset-4">
          Validar outro certificado
        </Link>
      </main>
      <RodapeSite />
    </div>
  );
}
