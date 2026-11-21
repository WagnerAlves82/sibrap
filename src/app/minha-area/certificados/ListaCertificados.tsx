import Link from "next/link";
import { criarClienteSupabaseServer } from "@/lib/supabase-server";
import { formatarDataIso } from "@/lib/apostilas";

// Certificados do aluno: prontos para emitir (curso concluído e aprovado, sem certificado) e emitidos.
// Usado na página /minha-area/certificados e na sanfona "Certificados" da Minha área.
export async function dadosCertificados() {
  const supabase = await criarClienteSupabaseServer();
  const [{ data: emitidos }, { data: matriculas }, { data: aulas }, { data: feitas }, { data: provas }] = await Promise.all([
    supabase.from("certificados").select("codigo, curso_id, carga_horaria_horas, emitido_em, cursos(nome, slug)").order("emitido_em", { ascending: false }),
    supabase.from("matriculas").select("curso_id, cursos(nome, slug, carga_horaria_horas, nota_minima)"),
    supabase.from("aulas").select("id, curso_id"),
    supabase.from("progresso_aulas").select("aula_id").not("concluida_em", "is", null),
    supabase.from("tentativas_quiz").select("curso_id, nota").not("finalizado_em", "is", null).is("etapa_horas", null),
  ]);
  const comCertificado = new Set((emitidos ?? []).map((c) => c.curso_id));
  const concluidas = new Set((feitas ?? []).map((f) => f.aula_id));
  const prontos = (matriculas ?? []).filter((m) => {
    if (!m.cursos || comCertificado.has(m.curso_id)) return false;
    const doCurso = (aulas ?? []).filter((a) => a.curso_id === m.curso_id);
    if (!doCurso.length || doCurso.some((a) => !concluidas.has(a.id))) return false;
    const melhor = Math.max(0, ...(provas ?? []).filter((p) => p.curso_id === m.curso_id).map((p) => Number(p.nota) || 0));
    return melhor >= (m.cursos.nota_minima ?? 70);
  });
  return { emitidos: emitidos ?? [], prontos };
}

type Dados = Awaited<ReturnType<typeof dadosCertificados>>;
const cartao = "rounded-xl border border-[#D7DEE6] bg-white p-5";

export function ListaCertificados({ dados, titulos = true }: { dados: Dados; titulos?: boolean }) {
  const { emitidos, prontos } = dados;
  const subtitulo = "mb-3 font-display text-lg font-extrabold text-[#14213A]";
  return (
    <div className="flex flex-col gap-6">
      {prontos.length > 0 && (
        <section>
          {titulos && <h2 className={subtitulo}>Prontos para emitir</h2>}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {prontos.map((m) => (
              <div key={m.curso_id} className={`${cartao} border-2 border-accent`}>
                <p className="font-data text-[11.5px] font-semibold text-accent-2">{m.cursos!.carga_horaria_horas} h · curso concluído</p>
                <p className="mt-1 font-display text-lg font-extrabold leading-snug text-[#14213A]">{m.cursos!.nome}</p>
                <Link
                  prefetch={false}
                  href={`/minha-area/cursos/${m.cursos!.slug}/certificado`}
                  className="mt-4 inline-block bg-accent px-4 py-2.5 text-[14.5px] font-extrabold text-accent-ink hover:brightness-105"
                >
                  Emitir meu certificado →
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}
      <section>
        {titulos && <h2 className={subtitulo}>Emitidos</h2>}
        {emitidos.length === 0 ? (
          <p className="text-[15px] text-[#516278]">
            {prontos.length ? "Nenhum certificado emitido ainda." : "Você ainda não emitiu nenhum certificado. Conclua as aulas e a prova final de um curso para emitir."}
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {emitidos.map((c) => (
              <div key={c.codigo} className={cartao}>
                <p className="font-data text-[11.5px] font-semibold text-accent-2">
                  {c.carga_horaria_horas} h · emitido em {formatarDataIso(c.emitido_em.slice(0, 10))}
                </p>
                <p className="mt-1 font-display text-lg font-extrabold leading-snug text-[#14213A]">{c.cursos?.nome ?? "Curso"}</p>
                <p className="mt-1 font-data text-[12.5px] text-[#8A97A8]">Código {c.codigo}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <a href={`/certificado/${c.codigo}`} className="bg-brand px-3.5 py-2 text-[13.5px] font-bold text-white hover:brightness-125">
                    Ver certificado
                  </a>
                  <a href={`/certificado/${c.codigo}/pdf`} className="border-2 border-brand px-3.5 py-1.5 text-[13.5px] font-bold text-brand hover:bg-[#EEF3F8]">
                    Baixar PDF
                  </a>
                  <a href={`/validar/${c.codigo}`} className="px-2 py-2 text-[13.5px] font-semibold text-[#516278] underline underline-offset-4 hover:text-brand">
                    Validação
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
