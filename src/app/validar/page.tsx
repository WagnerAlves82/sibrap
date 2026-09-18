import type { Metadata } from "next";
import { criarClienteSupabaseServer } from "@/lib/supabase-server";
import { CabecalhoSite, RodapeSite } from "@/components/site-chrome";
import { CLASSE_INPUT } from "@/components/auth-shell";
import { ResultadoValidacao } from "./resultado";

export const metadata: Metadata = {
  title: "Validar certificado",
  description: "Confira a autenticidade de um certificado emitido pelo SIBRAP.",
};

export default async function ValidarPage({
  searchParams,
}: {
  searchParams: Promise<{ codigo?: string }>;
}) {
  const { codigo } = await searchParams;
  const supabase = await criarClienteSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const codigoLimpo = codigo?.trim().slice(0, 40);

  return (
    <div className="flex min-h-screen flex-col bg-surface-2 font-body">
      <CabecalhoSite logado={!!user} />
      <main className="mx-auto w-full max-w-[720px] flex-1 px-6 py-12">
        <h1 className="font-display text-3xl font-extrabold text-[#14213A] sm:text-4xl">
          Validar certificado
        </h1>
        <p className="mt-2 text-[15px] text-[#516278]">
          Digite o código impresso no certificado (ou aponte a câmera para o
          QR Code) para conferir se ele é verdadeiro.
        </p>

        <form action="/validar" method="get" className="mt-6 flex flex-col gap-3 sm:flex-row">
          <label htmlFor="codigo" className="sr-only">
            Código do certificado
          </label>
          <input
            id="codigo"
            name="codigo"
            defaultValue={codigoLimpo}
            placeholder="SIB-XXXX-XXXX-XXXX"
            autoComplete="off"
            required
            className={`${CLASSE_INPUT} font-data uppercase`}
          />
          <button
            type="submit"
            className="rounded-lg bg-accent px-6 py-3 text-[15px] font-bold text-accent-ink transition-colors hover:brightness-105"
          >
            Validar
          </button>
        </form>

        {codigoLimpo && (
          <div className="mt-8">
            <ResultadoValidacao codigo={codigoLimpo} />
          </div>
        )}
      </main>
      <RodapeSite />
    </div>
  );
}
