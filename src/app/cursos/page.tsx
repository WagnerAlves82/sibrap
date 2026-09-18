import type { Metadata } from "next";
import Link from "next/link";
import { criarClienteSupabaseServer } from "@/lib/supabase-server";
import { CabecalhoSite, RodapeSite } from "@/components/site-chrome";
import { Reveal } from "@/components/reveal";

export const metadata: Metadata = {
  title: "Cursos gratuitos",
  description:
    "Cursos livres gratuitos do SIBRAP para pessoas de baixa renda, com certificado e QR Code de validação.",
};

export default async function CursosPage() {
  const supabase = await criarClienteSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: cursos } = await supabase
    .from("cursos")
    .select("slug, nome, subtitulo, descricao, carga_horaria_horas")
    .order("criado_em");

  return (
    <div className="flex min-h-screen flex-col bg-surface-2 font-body">
      <CabecalhoSite logado={!!user} />

      <main className="mx-auto w-full max-w-[1180px] flex-1 px-6 py-14">
        <Reveal>
          <p className="font-data text-xs uppercase tracking-[0.2em] text-accent-2">
            Educação que transforma vidas e o futuro
          </p>
          <h1 className="mt-3 max-w-[18ch] font-display text-4xl font-extrabold text-[#14213A] sm:text-5xl">
            Cursos gratuitos com certificado.
          </h1>
          <p className="mt-4 max-w-[60ch] text-[16px] leading-relaxed text-[#516278]">
            Aprenda no seu ritmo, pelo celular ou computador. As aulas são
            gratuitas para todos; o certificado é gratuito para quem
            comprova inscrição no CadÚnico.
          </p>
        </Reveal>

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
          {cursos?.map((curso, i) => (
            <Reveal key={curso.slug} delay={i * 100}>
              <Link
                href={`/cursos/${curso.slug}`}
                className="group flex h-full flex-col rounded-xl border border-[#D7DEE6] bg-white p-7 transition-shadow hover:shadow-[0_20px_45px_-24px_rgba(11,42,74,0.3)]"
              >
                <span className="font-data text-xs font-semibold text-accent-2">
                  {curso.carga_horaria_horas}h · 100% online
                </span>
                <h2 className="mt-2 font-display text-2xl font-extrabold text-[#14213A]">
                  {curso.nome}
                </h2>
                <p className="mt-3 flex-1 text-[15px] leading-relaxed text-[#516278]">
                  {curso.descricao}
                </p>
                <span
                  aria-hidden
                  className="mt-6 flex justify-end text-lg text-accent transition-transform group-hover:translate-x-1"
                >
                  →
                </span>
              </Link>
            </Reveal>
          ))}
          {cursos?.length === 0 && (
            <p className="text-[#516278]">Novos cursos em breve.</p>
          )}
        </div>
      </main>

      <RodapeSite />
    </div>
  );
}
