import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE_NAME } from "@/lib/admin-auth";
import { sessaoAdminValida } from "@/lib/admin-sessao";
import { criarClienteSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

const NOTAS = [
  ["satisfacao", "Satisfação geral"],
  ["clareza", "Clareza das aulas"],
  ["material", "Material"],
  ["exercicios", "Exercícios"],
  ["aplicacao", "Aplicação no dia a dia"],
] as const;

const media = (xs: number[]) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0);

export default async function AdminPesquisasPage() {
  const cookieStore = await cookies();
  if (!(await sessaoAdminValida(cookieStore.get(ADMIN_COOKIE_NAME)?.value))) {
    redirect("/admin/login");
  }

  const admin = criarClienteSupabaseAdmin();
  const [{ data: respostas }, { data: cursos }] = await Promise.all([
    admin.from("pesquisas_satisfacao").select("*").order("criado_em", { ascending: false }).limit(2000),
    admin.from("cursos").select("id, nome"),
  ]);
  const nomeCurso = new Map((cursos ?? []).map((c) => [c.id, c.nome]));
  const porCurso = new Map<string, NonNullable<typeof respostas>>();
  for (const r of respostas ?? []) porCurso.set(r.curso_id, [...(porCurso.get(r.curso_id) ?? []), r]);

  return (
    <div className="min-h-screen bg-zinc-50 px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <Link href="/admin" className="text-sm text-zinc-500 underline hover:text-zinc-700">
          ← Painel
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-zinc-900">Pesquisas de satisfação</h1>
        <p className="mb-6 text-sm text-zinc-500">
          Respondidas pelos alunos ao terminar o curso, antes de emitir o certificado. Notas de 1 a 5; recomendação de 0 a 10
          (NPS = % de notas 9–10 menos % de notas 0–6).
        </p>
        {porCurso.size === 0 && <p className="text-sm text-zinc-500">Nenhuma resposta ainda.</p>}
        {[...porCurso.entries()].map(([cursoId, lista]) => {
          const promotores = lista.filter((r) => r.recomendacao >= 9).length;
          const detratores = lista.filter((r) => r.recomendacao <= 6).length;
          const nps = Math.round(((promotores - detratores) / lista.length) * 100);
          const dur = (v: string) => lista.filter((r) => r.duracao === v).length;
          const comentarios = lista.filter((r) => r.comentario);
          return (
            <section key={cursoId} className="mb-8 border border-zinc-200 bg-white p-5">
              <h2 className="text-lg font-semibold text-zinc-900">
                {nomeCurso.get(cursoId) ?? "Curso"} · {lista.length} resposta{lista.length === 1 ? "" : "s"}
              </h2>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {NOTAS.map(([k, rotulo]) => (
                  <div key={k} className="border border-zinc-200 p-3">
                    <p className="text-xs text-zinc-500">{rotulo}</p>
                    <p className="text-xl font-bold text-zinc-900">{media(lista.map((r) => r[k])).toFixed(1)}</p>
                  </div>
                ))}
                <div className="border border-zinc-200 p-3">
                  <p className="text-xs text-zinc-500">NPS (recomendação)</p>
                  <p className="text-xl font-bold text-zinc-900">{nps}</p>
                </div>
                <div className="col-span-2 border border-zinc-200 p-3 sm:col-span-3">
                  <p className="text-xs text-zinc-500">Duração</p>
                  <p className="text-sm text-zinc-900">
                    Curta demais: {dur("curta")} · Na medida: {dur("adequada")} · Longa demais: {dur("longa")}
                  </p>
                </div>
              </div>
              {comentarios.length > 0 && (
                <ul className="mt-4 flex flex-col gap-2">
                  {comentarios.map((r) => (
                    <li key={r.id} className="border-l-2 border-zinc-300 pl-3 text-sm text-zinc-700">
                      “{r.comentario}”{" "}
                      <span className="text-xs text-zinc-400">
                        ({new Date(r.criado_em).toLocaleDateString("pt-BR")}, nota {r.satisfacao}/5)
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
