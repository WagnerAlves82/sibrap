import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { criarClienteSupabaseServer } from "@/lib/supabase-server";
import { CabecalhoSite } from "@/components/site-chrome";
import { ProvaApp } from "./ProvaApp";

export const metadata: Metadata = {
  title: "Prova final",
  robots: { index: false },
};

export default async function ProvaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await criarClienteSupabaseServer();
  const cursoHref = `/minha-area/cursos/${slug}`;

  const { data: curso } = await supabase
    .from("cursos")
    .select("id, quiz_num_questoes, nota_minima")
    .eq("slug", slug)
    .maybeSingle();
  if (!curso) notFound();

  const { data: matricula } = await supabase
    .from("matriculas")
    .select("curso_id")
    .eq("curso_id", curso.id)
    .maybeSingle();
  if (!matricula) redirect(cursoHref);

  return (
    <div className="flex min-h-screen flex-col bg-surface-2 font-body">
      <CabecalhoSite logado />
      <main className="mx-auto w-full max-w-[720px] flex-1 px-6 py-10">
        <ProvaApp
          cursoId={curso.id}
          cursoHref={cursoHref}
          totalQuestoes={curso.quiz_num_questoes}
          notaMinima={curso.nota_minima}
        />
      </main>
    </div>
  );
}
