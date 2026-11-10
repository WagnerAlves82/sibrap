import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { criarClienteSupabaseServer } from "@/lib/supabase-server";
import { CabecalhoSite } from "@/components/site-chrome";
import { TextoSimples } from "@/components/texto-simples";
import { PlayerAula } from "./PlayerAula";
import { MiniQuiz, type QuestaoMini } from "./MiniQuiz";
import type { ItemLista } from "./BarraAula";
import { AulaInterativa, type Bloco } from "@/components/aula-interativa";

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
  // sem publicidade nas aulas (AVA): decisão do Wagner em 29/10/2026, o aluno estuda sem distração

  const [{ data: matricula }, { data: modulos }, { data: progresso }] = await Promise.all([
    supabase.from("matriculas").select("curso_id").eq("curso_id", curso.id).maybeSingle(),
    supabase
      .from("modulos")
      // só o necessário para a lista lateral: carregar o conteúdo de TODAS as aulas a cada
      // clique gastava a CPU da Vercel à toa (o conteúdo da aula aberta vem logo abaixo)
      .select("titulo, ordem, aulas(id, titulo, ordem)")
      .eq("curso_id", curso.id)
      .order("ordem")
      .order("ordem", { referencedTable: "aulas" }),
    supabase.from("progresso_aulas").select("aula_id, concluida_em"),
  ]);
  if (!matricula) redirect(cursoHref);

  const lista = (modulos ?? []).flatMap((m) => m.aulas.map((a) => ({ ...a, modulo: m.titulo })));
  const indice = lista.findIndex((a) => a.id === aulaId);
  const itemAula = lista[indice];
  if (!itemAula) redirect(cursoHref);

  // a regra de ordem também é conferida no banco (abrir_aula); aqui só evita mostrar tela vazia
  const [{ data: detalhe }, { error: erroAbrir }] = await Promise.all([
    supabase
      .from("aulas")
      .select("youtube_id, carga_min, objetivo, resumo, atividade, conteudo")
      .eq("id", itemAula.id)
      .maybeSingle(),
    supabase.rpc("abrir_aula", { p_aula_id: itemAula.id }),
  ]);
  if (erroAbrir || !detalhe) redirect(cursoHref);
  const aula = { ...itemAula, ...detalhe };

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
  const proxima = lista[indice + 1] ?? null;
  const aulaHref = (id: string) => `${cursoHref}/aula/${id}`;
  // mesma regra do menu lateral: liberada se já feita, se é a atual, sem ordem obrigatória ou com a anterior feita
  const itensBarra: ItemLista[] = lista.map((a, i) => {
    const feita = concluidas.has(a.id);
    const liberada = feita || a.id === aula.id || !curso.ordem_obrigatoria || i === 0 || concluidas.has(lista[i - 1].id);
    return { id: a.id, titulo: a.titulo, modulo: a.modulo, href: liberada ? aulaHref(a.id) : null, feita, atual: a.id === aula.id };
  });
  const feitas = lista.filter((a) => concluidas.has(a.id)).length;

  return (
    <div className="flex min-h-screen flex-col bg-surface-2 font-body">
      <CabecalhoSite logado />
      <main className="mx-auto grid w-full max-w-[1180px] flex-1 grid-cols-1 gap-8 px-6 pt-8 pb-28 lg:grid-cols-[minmax(0,1fr)_320px]">
        <article className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-data text-xs font-semibold uppercase tracking-wide text-accent-2">
              {aula.modulo} · Aula {indice + 1} de {lista.length}
            </p>
            {anterior && (
              <Link prefetch={false} href={aulaHref(anterior.id)} className="text-[14px] font-semibold text-brand underline underline-offset-4">
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
              <p className="mt-1 text-[17px] leading-relaxed text-[#14213A]">{aula.objetivo}</p>
            </div>
          )}

          <PlayerAula
            key={aula.id}
            aulaId={aula.id}
            youtubeId={aula.youtube_id}
            titulo={aula.titulo}
            concluidaInicial={concluidas.has(aula.id)}
            proximaHref={proxima ? aulaHref(proxima.id) : null}
            anteriorHref={anterior ? aulaHref(anterior.id) : null}
            provaHref={`${cursoHref}/prova`}
            certificadoHref={`${cursoHref}/certificado`}
            lista={itensBarra}
            feitasInicial={feitas}
            totalQuiz={questoes.length}
          >
            {Array.isArray(aula.conteudo) && aula.conteudo.length > 0 && (
              // voz do navegador só no curso de inglês (nos outros, como Libras, os botões de ouvir somem)
              <AulaInterativa blocos={aula.conteudo as unknown as Bloco[]} idioma={slug.startsWith("ingles") ? "en-US" : null} />
            )}

            {aula.resumo && (
              <Secao titulo={Array.isArray(aula.conteudo) && aula.conteudo.length > 0 ? "Revisão rápida" : "Resumo da aula"}>
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
                            className="inline-flex items-center gap-2 text-[16px] font-semibold text-brand underline underline-offset-4"
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
              <div id="fixe-o-que-aprendeu" className="scroll-mt-6">
                <Secao titulo="Fixe o que aprendeu">
                  <MiniQuiz key={aula.id} questoes={questoes} />
                </Secao>
              </div>
            )}
          </PlayerAula>
        </article>

        <aside className="lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:self-start lg:overflow-y-auto">
          <div className="rounded-xl border border-[#D7DEE6] bg-white">
            <p className="border-b border-[#E7EDF3] px-4 py-3 font-display text-[16.5px] font-extrabold text-[#14213A]">
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
                    const liberada = feita || atual || !curso.ordem_obrigatoria || anteriorFeita;
                    const icone = feita ? "✓" : atual ? "▶" : liberada ? "○" : "🔒";
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
                        <span className="flex-1 text-[15px] leading-snug">{a.titulo}</span>
                      </>
                    );
                    return (
                      <li key={a.id} className={`border-t border-[#F0F4F8] ${atual ? "bg-[#FBF5E4]" : ""}`}>
                        {liberada && !atual ? (
                          <Link prefetch={false} href={aulaHref(a.id)} className="flex items-center gap-2.5 px-4 py-2.5 text-[#14213A] hover:bg-[#F6F9FC]">
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
            <Link prefetch={false} href={cursoHref} className="block border-t border-[#E7EDF3] px-4 py-3 text-[15px] font-bold text-brand">
              ← Voltar ao painel do curso
            </Link>
          </div>
        </aside>
      </main>
    </div>
  );
}
