import Link from "next/link";
import { criarClienteSupabaseAdmin } from "@/lib/supabase-admin";
import { formatarHoras } from "@/lib/emissor";
import { FormAula } from "./FormAula";

export const dynamic = "force-dynamic";

export default async function AdminCursosPage() {
  const admin = criarClienteSupabaseAdmin();

  const { data: cursos } = await admin
    .from("cursos")
    .select(
      "id, nome, carga_horaria_horas, modulos(id, titulo, ordem, aulas(id, titulo, ordem, carga_min, duracao_video_min, youtube_id))"
    )
    .order("criado_em")
    .order("ordem", { referencedTable: "modulos" })
    .order("ordem", { referencedTable: "modulos.aulas" });

  return (
    <div className="min-h-screen bg-zinc-50 px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <Link href="/admin" className="text-sm text-zinc-500 underline hover:text-zinc-700">
          ← Painel
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-zinc-900">Aulas dos cursos</h1>
        <p className="mb-6 text-sm text-zinc-500">
          Cole o link do vídeo (pode ser não listado) para publicar a aula.
          &quot;Carga&quot; é o tempo da aula em minutos (vídeo + prática) e entra no
          total do certificado; &quot;vídeo&quot; é a duração real do vídeo — o aluno só
          consegue concluir depois de 60% dela.
        </p>

        {cursos?.map((curso) => {
          const aulas = curso.modulos.flatMap((m) => m.aulas);
          const totalMin = aulas.reduce((s, a) => s + a.carga_min, 0);
          const publicadas = aulas.filter((a) => a.youtube_id).length;
          const bate = totalMin === curso.carga_horaria_horas * 60;
          return (
            <section key={curso.id} className="mb-10">
              <h2 className="text-lg font-semibold text-zinc-900">{curso.nome}</h2>
              <p className={`mb-4 text-sm ${bate ? "text-zinc-500" : "text-amber-700"}`}>
                {publicadas}/{aulas.length} aulas publicadas · carga somada {formatarHoras(totalMin)}{" "}
                (certificado: {curso.carga_horaria_horas}h)
                {!bate && " — a soma não bate com a carga horária do certificado"}
              </p>
              <div className="flex flex-col gap-4">
                {curso.modulos.map((modulo) => (
                  <div key={modulo.id} className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
                    <h3 className="bg-zinc-100 px-4 py-2.5 text-sm font-semibold text-zinc-700">
                      {modulo.ordem}. {modulo.titulo}
                    </h3>
                    {modulo.aulas.map((aula) => (
                      <FormAula key={aula.id} aula={aula} />
                    ))}
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
