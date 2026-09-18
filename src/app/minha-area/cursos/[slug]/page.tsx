import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { criarClienteSupabaseServer } from "@/lib/supabase-server";
import { CabecalhoSite, RodapeSite } from "@/components/site-chrome";
import { BarraProgresso, Reveal } from "@/components/reveal";
import { formatarHoras } from "@/lib/emissor";
import { matricularAction } from "./actions";

export const metadata: Metadata = {
  title: "Meu curso",
  robots: { index: false },
};

export default async function AreaDoCursoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await criarClienteSupabaseServer();

  const { data: curso } = await supabase
    .from("cursos")
    .select("id, slug, nome, carga_horaria_horas, nota_minima, ordem_obrigatoria")
    .eq("slug", slug)
    .maybeSingle();
  if (!curso) notFound();

  const [{ data: matricula }, { data: modulos }, { data: progresso }, { data: tentativas }, { data: certificado }] =
    await Promise.all([
      supabase.from("matriculas").select("curso_id").eq("curso_id", curso.id).maybeSingle(),
      supabase
        .from("modulos")
        .select("id, titulo, ordem, aulas(id, titulo, ordem, carga_min, youtube_id)")
        .eq("curso_id", curso.id)
        .order("ordem")
        .order("ordem", { referencedTable: "aulas" }),
      supabase.from("progresso_aulas").select("aula_id, concluida_em"),
      supabase
        .from("tentativas_quiz")
        .select("nota")
        .eq("curso_id", curso.id)
        .not("finalizado_em", "is", null),
      supabase.from("certificados").select("codigo").eq("curso_id", curso.id).maybeSingle(),
    ]);

  if (!matricula) {
    return (
      <div className="flex min-h-screen flex-col bg-surface-2 font-body">
        <CabecalhoSite logado />
        <main className="mx-auto flex w-full max-w-[640px] flex-1 items-center px-6 py-14">
          <div className="w-full rounded-xl border border-[#D7DEE6] bg-white p-8">
            <p className="font-data text-xs font-semibold uppercase tracking-wide text-accent-2">
              Curso gratuito · {curso.carga_horaria_horas}h
            </p>
            <h1 className="mt-2 font-display text-3xl font-extrabold text-[#14213A]">
              {curso.nome}
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-[#516278]">
              Confirme sua matrícula para começar. Seu progresso fica salvo e
              você pode continuar de onde parou.
            </p>
            <form action={matricularAction} className="mt-6">
              <input type="hidden" name="slug" value={curso.slug} />
              <button
                type="submit"
                className="w-full rounded-lg bg-accent px-5 py-3.5 text-[15px] font-bold text-accent-ink transition-colors hover:brightness-105"
              >
                Começar o curso →
              </button>
            </form>
          </div>
        </main>
      </div>
    );
  }

  const concluidas = new Set(
    (progresso ?? []).filter((p) => p.concluida_em).map((p) => p.aula_id)
  );
  const todasAulas = (modulos ?? []).flatMap((m) => m.aulas);
  const total = todasAulas.length;
  const feitas = todasAulas.filter((a) => concluidas.has(a.id)).length;
  const publicadas = todasAulas.filter((a) => a.youtube_id).length;
  const minutosFeitos = todasAulas
    .filter((a) => concluidas.has(a.id))
    .reduce((s, a) => s + a.carga_min, 0);
  const percentual = total ? (feitas / total) * 100 : 0;
  const aulasOk = total > 0 && publicadas === total && feitas === total;
  const melhorNota = (tentativas ?? []).reduce((m, t) => Math.max(m, Number(t.nota ?? 0)), 0);
  const provaOk = melhorNota >= curso.nota_minima;
  const proxima = todasAulas.find((a) => a.youtube_id && !concluidas.has(a.id));
  const liberada = (id: string) => {
    const i = todasAulas.findIndex((a) => a.id === id);
    const a = todasAulas[i];
    if (!a?.youtube_id) return false;
    if (!curso.ordem_obrigatoria || i === 0 || concluidas.has(id)) return true;
    return concluidas.has(todasAulas[i - 1].id);
  };

  return (
    <div className="flex min-h-screen flex-col bg-surface-2 font-body">
      <CabecalhoSite logado />

      <main className="mx-auto w-full max-w-[900px] flex-1 px-6 py-10">
        <Reveal>
          <Link href="/minha-area" className="text-[13px] font-semibold text-brand underline underline-offset-4">
            ← Minha área
          </Link>
          <h1 className="mt-3 font-display text-3xl font-extrabold text-[#14213A] sm:text-4xl">
            {curso.nome}
          </h1>

          <div className="mt-6 rounded-xl border border-[#D7DEE6] bg-white p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-display text-xl font-extrabold text-[#14213A]">
                {feitas} de {total} aulas
              </p>
              <p className="font-data text-sm text-[#516278]">
                {formatarHoras(minutosFeitos)} de {curso.carga_horaria_horas}h
              </p>
            </div>
            <BarraProgresso percentual={percentual} className="mt-3" />
            {proxima ? (
              <Link
                href={`/minha-area/cursos/${curso.slug}/aula/${proxima.id}`}
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 text-[15px] font-bold text-accent-ink transition-colors hover:brightness-105"
              >
                {feitas === 0 ? "Começar a primeira aula" : "Continuar de onde parei"} <span aria-hidden>→</span>
              </Link>
            ) : (
              publicadas < total && (
                <p className="mt-4 text-[13.5px] text-[#516278]">
                  Novas aulas são liberadas aos poucos. Volte em breve!
                </p>
              )
            )}
          </div>
        </Reveal>

        <Reveal delay={100} className="mt-6">
          <ol className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <EtapaCard numero={1} titulo="Assistir às aulas" ok={aulasOk} texto={`${feitas}/${total} concluídas`} />
            <EtapaCard
              numero={2}
              titulo="Prova final"
              ok={provaOk}
              texto={provaOk ? `Nota ${melhorNota.toFixed(0)}%` : `Mínimo ${curso.nota_minima}%`}
              href={aulasOk ? `/minha-area/cursos/${curso.slug}/prova` : undefined}
              rotuloLink={provaOk ? "Refazer" : "Fazer a prova"}
            />
            <EtapaCard
              numero={3}
              titulo="Certificado"
              ok={!!certificado}
              texto={certificado ? "Emitido" : "Grátis com CadÚnico ou R$ 49,90"}
              href={`/minha-area/cursos/${curso.slug}/certificado`}
              rotuloLink={certificado ? "Ver certificado" : "Como obter"}
            />
          </ol>
        </Reveal>

        <div className="mt-8 flex flex-col gap-4">
          {modulos?.map((modulo, i) => (
            <Reveal key={modulo.id} delay={Math.min(i, 4) * 60}>
              <section className="rounded-xl border border-[#D7DEE6] bg-white">
                <h2 className="border-b border-[#E7EDF3] px-5 py-4 font-display text-[17px] font-extrabold text-[#14213A]">
                  {modulo.titulo}
                </h2>
                <ul>
                  {modulo.aulas.map((aula) => {
                    const feita = concluidas.has(aula.id);
                    const disponivel = liberada(aula.id);
                    const bloqueada = !!aula.youtube_id && !disponivel;
                    const conteudo = (
                      <>
                        <span
                          aria-hidden
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                            feita
                              ? "bg-accent-2 text-white"
                              : disponivel
                                ? "border-2 border-accent text-accent"
                                : "border border-[#C4CEDA] text-[#93A0AF]"
                          }`}
                        >
                          {feita ? "✓" : disponivel ? "▶" : bloqueada ? "🔒" : "·"}
                        </span>
                        <span className="flex-1 text-[15px] text-[#14213A]">{aula.titulo}</span>
                        <span className="font-data text-xs text-[#93A0AF]">
                          {aula.youtube_id ? formatarHoras(aula.carga_min) : "em breve"}
                        </span>
                      </>
                    );
                    return (
                      <li key={aula.id} className="border-b border-[#F0F4F8] last:border-0">
                        {disponivel ? (
                          <Link
                            href={`/minha-area/cursos/${curso.slug}/aula/${aula.id}`}
                            className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-[#F6F9FC]"
                          >
                            {conteudo}
                          </Link>
                        ) : (
                          <div className="flex items-center gap-3 px-5 py-3 opacity-70">{conteudo}</div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>
            </Reveal>
          ))}
        </div>
      </main>

      <RodapeSite />
    </div>
  );
}

function EtapaCard({
  numero,
  titulo,
  texto,
  ok,
  href,
  rotuloLink,
}: {
  numero: number;
  titulo: string;
  texto: string;
  ok: boolean;
  href?: string;
  rotuloLink?: string;
}) {
  return (
    <li className="flex flex-col rounded-xl border border-[#D7DEE6] bg-white p-5">
      <span className="flex items-center gap-2 font-data text-xs font-semibold text-[#516278]">
        <span
          aria-hidden
          className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] text-white ${ok ? "bg-accent-2" : "bg-[#93A0AF]"}`}
        >
          {ok ? "✓" : numero}
        </span>
        Etapa {numero}
      </span>
      <p className="mt-2 font-display text-lg font-extrabold text-[#14213A]">{titulo}</p>
      <p className="mt-1 flex-1 text-[13px] text-[#516278]">{texto}</p>
      {href && (
        <Link href={href} className="mt-3 text-[13.5px] font-bold text-brand underline underline-offset-4">
          {rotuloLink} →
        </Link>
      )}
    </li>
  );
}
