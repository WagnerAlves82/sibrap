import Link from "next/link";
import { notFound } from "next/navigation";
import { criarClienteSupabaseAdmin } from "@/lib/supabase-admin";
import { FormConteudo, FormMaterial, FormQuestao } from "./Formularios";
import { removerMaterialAction, removerQuestaoAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminAulaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const admin = criarClienteSupabaseAdmin();

  const { data: aula } = await admin
    .from("aulas")
    .select("id, titulo, objetivo, resumo, atividade, youtube_id, modulos(titulo)")
    .eq("id", id)
    .maybeSingle();
  if (!aula) notFound();

  const [{ data: materiais }, { data: questoes }] = await Promise.all([
    admin.from("aula_materiais").select("id, titulo, url").eq("aula_id", id).order("criado_em"),
    admin.from("aula_quiz").select("id, ordem, enunciado, alternativas, gabarito, comentario").eq("aula_id", id).order("ordem"),
  ]);

  const secao = "rounded-lg border border-zinc-200 bg-white p-5";

  return (
    <div className="min-h-screen bg-zinc-50 px-6 py-10">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <div>
          <Link href="/admin/cursos" className="text-sm text-zinc-500 underline hover:text-zinc-700">
            ← Aulas dos cursos
          </Link>
          <p className="mt-2 text-xs uppercase tracking-wide text-zinc-500">{aula.modulos?.titulo}</p>
          <h1 className="text-2xl font-bold text-zinc-900">{aula.titulo}</h1>
          <p className="text-sm text-zinc-500">
            {aula.youtube_id ? "Aula publicada" : "Ainda sem vídeo (não aparece para o aluno)"}
          </p>
        </div>

        <section className={secao}>
          <h2 className="mb-3 font-semibold text-zinc-900">Textos da aula</h2>
          <FormConteudo aula={aula} />
        </section>

        <section className={secao}>
          <h2 className="mb-3 font-semibold text-zinc-900">Materiais de apoio</h2>
          <ul className="mb-4 flex flex-col gap-2">
            {materiais?.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-3 rounded-md bg-zinc-50 px-3 py-2 text-sm">
                <a href={m.url} target="_blank" rel="noopener noreferrer" className="truncate text-blue-700 underline">
                  {m.titulo}
                </a>
                <form action={removerMaterialAction}>
                  <input type="hidden" name="id" value={m.id} />
                  <input type="hidden" name="aula_id" value={id} />
                  <button className="text-red-600 hover:underline">remover</button>
                </form>
              </li>
            ))}
            {materiais?.length === 0 && <li className="text-sm text-zinc-400">Nenhum material ainda.</li>}
          </ul>
          <FormMaterial aulaId={id} />
        </section>

        <section className={secao}>
          <h2 className="mb-1 font-semibold text-zinc-900">Mini-quiz da aula</h2>
          <p className="mb-4 text-sm text-zinc-500">
            Exercício de fixação: o aluno vê a resposta e a explicação na hora. Não vale nota.
          </p>
          <div className="flex flex-col gap-5">
            {questoes?.map((q) => (
              <div key={q.id} className="rounded-md border border-zinc-200 p-4">
                <FormQuestao
                  aulaId={id}
                  proximaOrdem={q.ordem}
                  questao={{ ...q, alternativas: q.alternativas as unknown as { letra: string; texto: string }[] }}
                />
                <form action={removerQuestaoAction} className="mt-2">
                  <input type="hidden" name="id" value={q.id} />
                  <input type="hidden" name="aula_id" value={id} />
                  <button className="text-sm text-red-600 hover:underline">remover esta questão</button>
                </form>
              </div>
            ))}
            <div className="rounded-md border border-dashed border-zinc-300 p-4">
              <p className="mb-2 text-sm font-medium text-zinc-700">Nova questão</p>
              <FormQuestao aulaId={id} proximaOrdem={(questoes?.length ?? 0) + 1} />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
