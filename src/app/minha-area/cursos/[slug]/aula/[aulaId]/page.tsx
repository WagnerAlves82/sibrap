import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { criarClienteSupabaseServer } from "@/lib/supabase-server";
import { CabecalhoSite } from "@/components/site-chrome";
import { TextoSimples } from "@/components/texto-simples";
import { formatarHoras } from "@/lib/emissor";
import { PlayerAula } from "./PlayerAula";
import { MiniQuiz, type QuestaoMini } from "./MiniQuiz";

export const metadata: Metadata = {
  title: "Aula",
  robots: { index: false },
};

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="mb-3 font-display text-xl font-extrabold text-[#14213A]">{titulo}</h2>
      {children}
    </section>
  );
}

export default async function AulaPage({
  params,
}: {
  params: Promise<{ slug: string; aulaId: string }>;
}) {
  const { slug, aulaId } = await params;
  const supabase = await criarClienteSupabaseServer();
  const cursoHref = `/minha-area/cursos/${slug}`;

  const { data: curso } = await supabase
    .from("cursos")
    .select("id, nome, ordem_obrigatoria")
    .eq("slug", slug)
    .maybeSingle();
  if (!curso) notFound();

  const [{ data: matricula }, { data: modulos }, { data: progresso }] = await Promise.all([
    supabase.from("matriculas").select("curso_id").eq("curso_id", curso.id).maybeSingle(),
    supabase
      .from("modulos")
      .select("titulo, ordem, aulas(id, titulo, ordem, youtube_id, carga_min, objetivo, resumo, atividade)")
      .eq("curso_id", curso.id)
      .order("ordem")
      .order("ordem", { referencedTable: "aulas" }),
    supabase.from("progresso_aulas").select("aula_id, concluida_em"),
  ]);
  if (!matricula) redirect(cursoHref);

  const lista = (modulos ?? []).flatMap((m) => m.aulas.map((a) => ({ ...a, modulo: m.titulo })));
  const indice = lista.findIndex((a) => a.id === aulaId);
  const aula = lista[indice];
  if (!aula || !aula.youtube_id) redirect(cursoHref);

  // a regra de ordem também é conferida no banco; aqui só evita mostrar tela vazia
  const { error: erroAbrir } = await supabase.rpc("abrir_aula", { p_aula_id: aula.id });
  if (erroAbrir) redirect(cursoHref);

  const concluidas = new Set(
    (progresso ?? []).filter((p) => p.concluida_em).map((p) => p.aula_id)
  );

  const [{ data: materiais }, { data: mini }] = await Promise.all([
    supabase.from("aula_materiais").select("id, titulo, url").eq("aula_id", aula.id).order("criado_em"),
    supabase.rpc("miniquiz_da_aula", { p_aula_id: aula.id }),
  ]);
  const questoes: QuestaoMini[] = (mini ?? []).map((q) => ({
    ...q,
    alternativas: q.alternativas as unknown as QuestaoMini["alternativas"],
  }));

  const anterior = lista[indice - 1];
  const proxima = lista.slice(indice + 1).find((a) => a.youtube_id);
  const aulaHref = (id: string) => `${cursoHref}/aula/${id}`;

  return (
    <div className="flex min-h-screen flex-col bg-surface-2 font-body">
      <CabecalhoSite logado />
      <main className="mx-auto grid w-full max-w-[1180px] flex-1 grid-cols-1 gap-8 px-6 py-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <article className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-data text-xs font-semibold uppercase tracking-wide text-accent-2">
              {aula.modulo} · Aula {indice + 1} de {lista.length}
            </p>
            {anterior?.youtube_id && (
              <Link href={aulaHref(anterior.id)} className="text-[13px] font-semibold text-brand underline underline-offset-4">
                ← Aula anterior
              </Link>
            )}
          </div>
          <h1 className="mt-1 mb-4 font-display text-2xl font-extrabold text-[#14213A] sm:text-3xl">
            {aula.titulo}
          </h1>

          {aula.objetivo && (
            <div className="mb-5 rounded-xl border border-[#D7DEE6] bg-white px-5 py-4">
              <p className="font-data text-xs font-semibold uppercase tracking-wide text-[#93A0AF]">
                O que você vai aprender
              </p>
              <p className="mt-1 text-[15.5px] leading-relaxed text-[#14213A]">{aula.objetivo}</p>
            </div>
          )}

          <PlayerAula
            key={aula.id}
            aulaId={aula.id}
            youtubeId={aula.youtube_id}
            titulo={aula.titulo}
            concluidaInicial={concluidas.has(aula.id)}
            proximaHref={proxima ? aulaHref(proxima.id) : null}
            cursoHref={cursoHref}
          />

          {aula.resumo && (
            <Secao titulo="Resumo da aula">
              <TextoSimples texto={aula.resumo} />
            </Secao>
          )}

          {(aula.atividade || (materiais?.length ?? 0) > 0) && (
            <Secao titulo="Pratique">
              <div className="rounded-xl border-2 border-accent bg-white p-5">
                {aula.atividade && <TextoSimples texto={aula.atividade} />}
                {(materiais?.length ?? 0) > 0 && (
                  <ul className="mt-4 flex flex-col gap-2">
                    {materiais?.map((m) => (
                      <li key={m.id}>
                        <a
                          href={m.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-[14.5px] font-semibold text-brand underline underline-offset-4"
                        >
                          <span aria-hidden>↓</span> {m.titulo}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Secao>
          )}

          {questoes.length > 0 && (
            <Secao titulo="Fixe o que aprendeu">
              <MiniQuiz key={aula.id} questoes={questoes} />
            </Secao>
          )}
        </article>

        <aside className="lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:self-start lg:overflow-y-auto">
          <div className="rounded-xl border border-[#D7DEE6] bg-white">
            <p className="border-b border-[#E7EDF3] px-4 py-3 font-display text-[15px] font-extrabold text-[#14213A]">
              Todas as aulas · {[...concluidas].filter((id) => lista.some((a) => a.id === id)).length}/{lista.length}
            </p>
            {(modulos ?? []).map((m) => (
              <div key={m.ordem}>
                <p className="bg-[#F6F9FC] px-4 py-2 text-[12px] font-bold uppercase tracking-wide text-[#516278]">
                  {m.titulo}
                </p>
                <ul>
                  {m.aulas.map((a) => {
                    const i = lista.findIndex((x) => x.id === a.id);
                    const feita = concluidas.has(a.id);
                    const atual = a.id === aula.id;
                    const anteriorFeita = i === 0 || concluidas.has(lista[i - 1].id);
                    const liberada =
                      !!a.youtube_id && (feita || atual || !curso.ordem_obrigatoria || anteriorFeita);
                    const icone = feita ? "✓" : atual ? "▶" : liberada ? "○" : a.youtube_id ? "🔒" : "·";
                    const linha = (
                      <>
                        <span
                          aria-hidden
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                            feita ? "bg-accent-2 text-white" : atual ? "bg-accent text-accent-ink" : "text-[#93A0AF]"
                          }`}
                        >
                          {icone}
                        </span>
                        <span className="flex-1 text-[13.5px] leading-snug">{a.titulo}</span>
                        <span className="font-data text-[11px] text-[#93A0AF]">
                          {a.youtube_id ? formatarHoras(a.carga_min) : "em breve"}
                        </span>
                      </>
                    );
                    return (
                      <li key={a.id} className={`border-t border-[#F0F4F8] ${atual ? "bg-[#FBF5E4]" : ""}`}>
                        {liberada && !atual ? (
                          <Link href={aulaHref(a.id)} className="flex items-center gap-2.5 px-4 py-2.5 text-[#14213A] hover:bg-[#F6F9FC]">
                            {linha}
                          </Link>
                        ) : (
                          <div className={`flex items-center gap-2.5 px-4 py-2.5 ${atual ? "font-semibold text-[#14213A]" : "text-[#93A0AF]"}`}>
                            {linha}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
            <Link href={cursoHref} className="block border-t border-[#E7EDF3] px-4 py-3 text-[13.5px] font-bold text-brand">
              ← Voltar ao painel do curso
            </Link>
          </div>
        </aside>
      </main>
    </div>
  );
}
