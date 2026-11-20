import type { Metadata } from "next";
import Link from "next/link";
import { IconeEmoji } from "@/components/icone-emoji";
import { Fragment } from "react";
import { notFound } from "next/navigation";
import { criarClienteSupabaseServer } from "@/lib/supabase-server";
import { CabecalhoSite, RodapeSite } from "@/components/site-chrome";
import { BarraProgresso, Reveal } from "@/components/reveal";
import { formatarHoras } from "@/lib/emissor";
import { matricularAction } from "./actions";
import { ComprarCurso } from "./ComprarCurso";
import { formatarReais, produtoDoCursoPago } from "@/lib/curso-pago";
import { dadosCartaoCompra } from "@/lib/cartao-transparente";
import { PopupEtapa } from "./certificado/PopupEtapa";
import { TourEtapas } from "./TourEtapas";
import { APOSTILA_DO_CURSO, temApostilaDoCurso } from "@/lib/cursos-apostila";
import { AREA_SUPORTE_MARCA, CURSO_MARCA } from "@/lib/suporte-marca";
import { dataHoraBR, diaBR, diasParaCertificado, liberacaoCertificado } from "@/lib/certificado-prazo";

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
    .select("id, slug, nome, carga_horaria_horas, nota_minima, ordem_obrigatoria, certificado_por_etapas, profissionalizante, tempo_min_aula_pct, minutos_dia_max, dias_minimos_prova")
    .eq("slug", slug)
    .maybeSingle();
  if (!curso) notFound();

  const [{ data: matricula }, { data: modulos }, { data: progresso }, { data: tentativas }, { data: certificado }, { data: etapas }, apostilaLiberada] =
    await Promise.all([
      supabase.from("matriculas").select("curso_id, criado_em").eq("curso_id", curso.id).maybeSingle(),
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
        .is("etapa_horas", null)
        .not("finalizado_em", "is", null),
      supabase.from("certificados").select("codigo").eq("curso_id", curso.id).maybeSingle(),
      // certificado por etapas: situação de cada etapa (20 h, 40 h…) para este aluno
      curso.certificado_por_etapas ? supabase.rpc("minhas_etapas_curso", { p_curso: curso.id }) : Promise.resolve({ data: null }),
      APOSTILA_DO_CURSO[curso.slug] ? temApostilaDoCurso(supabase, curso.id, curso.slug) : Promise.resolve(false),
    ]);

  if (!matricula) {
    // curso pago: sem compra, mostra o pagamento (a matrícula é travada no banco até o pagamento ser aprovado)
    const produtoPago = await produtoDoCursoPago(supabase, curso.slug);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return (
      <div className="flex min-h-screen flex-col bg-surface-2 font-body">
        <CabecalhoSite logado />
        <main className="mx-auto flex w-full max-w-[640px] flex-1 items-center px-6 py-14">
          <div className="w-full rounded-xl border border-[#D7DEE6] bg-white p-8">
            <p className="font-data text-xs font-semibold uppercase tracking-wide text-accent-2">
              {produtoPago ? "Curso online" : "Curso gratuito"} · {curso.carga_horaria_horas}h
            </p>
            <h1 className="mt-2 font-display text-3xl font-extrabold text-[#14213A]">
              {curso.nome}
            </h1>
            {produtoPago ? (
              <>
                <p className="mt-3 text-[15px] leading-relaxed text-[#516278]">
                  Pagamento único de{" "}
                  <strong className="text-[#14213A]">{formatarReais(produtoPago.preco_centavos)}</strong> no PIX ou em até 3x, com
                  acesso a todas as aulas e o certificado online incluso. Assim que o pagamento cair, o curso é
                  liberado nesta página.
                </p>
                <div className="mt-6">
                  <ComprarCurso
                    slug={curso.slug}
                    preco={formatarReais(produtoPago.preco_centavos)}
                    valorCentavos={produtoPago.preco_centavos}
                    cartao={dadosCartaoCompra(`curso-${curso.slug}`, user)}
                  />
                </div>
              </>
            ) : (
            <>
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
            </>
            )}
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
  const minutosFeitos = todasAulas
    .filter((a) => concluidas.has(a.id))
    .reduce((s, a) => s + a.carga_min, 0);
  const percentual = total ? (feitas / total) * 100 : 0;
  const aulasOk = total > 0 && feitas === total;
  const melhorNota = (tentativas ?? []).reduce((m, t) => Math.max(m, Number(t.nota ?? 0)), 0);
  const provaOk = melhorNota >= curso.nota_minima;
  const proxima = todasAulas.find((a) => !concluidas.has(a.id));
  // ritmo de estudo (cursos com limite diário): carga concluída hoje, no fuso de Brasília
  const hoje = diaBR(new Date());
  const cargaDaAula = new Map(todasAulas.map((a) => [a.id, a.carga_min]));
  const minutosHoje = (progresso ?? [])
    .filter((p) => p.concluida_em && diaBR(p.concluida_em) === hoje)
    .reduce((s, p) => s + (cargaDaAula.get(p.aula_id) ?? 0), 0);
  const proximaJaAberta = !!proxima && (progresso ?? []).some((p) => p.aula_id === proxima.id);
  const limiteHoje = !!curso.minutos_dia_max && minutosHoje >= curso.minutos_dia_max && !proximaJaAberta;
  const diasCert = diasParaCertificado(curso.dias_minimos_prova);
  const provaLiberaEm = curso.dias_minimos_prova ? liberacaoCertificado(matricula.criado_em, curso.dias_minimos_prova) : null;
  const listaEtapas = (etapas ?? []) as { horas: number; aulas_exigidas: number; tem_questionario: boolean; aprovado: boolean; melhor_nota: number | null }[];
  const etapaLiberada = (e: (typeof listaEtapas)[number]) => feitas >= e.aulas_exigidas && (!e.tem_questionario || e.aprovado);
  const ultimaLiberada = [...listaEtapas].reverse().find(etapaLiberada);
  const proximaEtapa = listaEtapas.find((e) => !etapaLiberada(e));
  // marcador do questionário na lista de aulas: logo depois da aula de número aulas_exigidas
  const posicaoAula = new Map(todasAulas.map((a, i) => [a.id, i + 1]));
  const etapaDepoisDa = new Map(listaEtapas.map((e) => [e.aulas_exigidas, e]));
  const liberada = (id: string) => {
    const i = todasAulas.findIndex((a) => a.id === id);
    if (!curso.ordem_obrigatoria || i === 0 || concluidas.has(id)) return true;
    return concluidas.has(todasAulas[i - 1].id);
  };

  return (
    <div className="flex min-h-screen flex-col bg-surface-2 font-body">
      <CabecalhoSite logado />

      <main className="mx-auto w-full max-w-[900px] flex-1 px-6 py-10">
        <Reveal>
          <Link prefetch={false} href="/minha-area" className="text-[13px] font-semibold text-brand underline underline-offset-4">
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
            {proxima && limiteHoje && (
              <p className="mt-5 border-l-4 border-accent-2 bg-[#EAF6F3] px-4 py-3 text-[15px] leading-relaxed text-[#14213A]">
                <strong>Você já cumpriu {formatarHoras(minutosHoje)} de aulas hoje.</strong> O limite deste curso é de{" "}
                {formatarHoras(curso.minutos_dia_max!)} por dia; a próxima aula libera amanhã. Aproveite para revisar e baixar a
                apostila.
              </p>
            )}
            {proxima && !limiteHoje && (
              <Link prefetch={false}
                href={`/minha-area/cursos/${curso.slug}/aula/${proxima.id}`}
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 text-[15px] font-bold text-accent-ink transition-colors hover:brightness-105"
              >
                {feitas === 0 ? "Começar a primeira aula" : "Continuar de onde parei"} <span aria-hidden>→</span>
              </Link>
            )}
            {(curso.minutos_dia_max || curso.tempo_min_aula_pct) && !certificado && (
              <div className="mt-4 border border-[#D7DEE6] bg-[#F6F9FC] px-4 py-3 text-[14.5px] leading-relaxed text-[#14213A]">
                <p className="font-bold">Ritmo do curso (controle de tempo de estudo)</p>
                <ul className="mt-1 list-disc pl-5 text-[#33465E]">
                  {curso.tempo_min_aula_pct ? (
                    <li>Cada aula tem um tempo mínimo de estudo, contado com a aula aberta na tela.</li>
                  ) : null}
                  {curso.minutos_dia_max ? (
                    <li>
                      Até {formatarHoras(curso.minutos_dia_max)} de aulas por dia. Hoje: <strong>{formatarHoras(minutosHoje)}</strong>.
                    </li>
                  ) : null}
                  {provaLiberaEm ? (
                    <li>
                      Prova final a partir de <strong>{dataHoraBR(provaLiberaEm)}</strong> ({curso.dias_minimos_prova} dias após a
                      matrícula).
                    </li>
                  ) : null}
                </ul>
              </div>
            )}
            {curso.profissionalizante && !certificado && (
              <p className="mt-4 border-l-4 border-accent bg-[#FFF8EB] px-4 py-3 text-[14.5px] leading-relaxed text-[#14213A]">
                <strong>Sobre o seu certificado:</strong> ele traz a data de início (matrícula) e a de conclusão do curso e pode ser
                emitido a partir de <strong>{dataHoraBR(liberacaoCertificado(matricula.criado_em, diasCert))}</strong> ({diasCert} dias
                após a matrícula), depois de concluir as aulas e passar na prova final. É o tempo para você estudar com calma e praticar.
              </p>
            )}
            {APOSTILA_DO_CURSO[curso.slug] && apostilaLiberada && (
              <a
                href={`/minha-area/cursos/${curso.slug}/apostila`}
                className="ml-0 mt-3 inline-flex items-center gap-2 border-2 border-brand px-5 py-2.5 text-[15px] font-bold text-brand transition-colors hover:bg-[#F6F9FC] sm:ml-3"
              >
                Baixar a apostila prática (PDF) <span aria-hidden>↓</span>
              </a>
            )}
            {APOSTILA_DO_CURSO[curso.slug] && !apostilaLiberada && (
              <p className="mt-3 text-[14.5px] text-[#516278]">
                A apostila prática em PDF vem junto com o certificado.{" "}
                <Link href={`/minha-area/cursos/${curso.slug}/certificado#certificado-opcoes`} className="font-bold text-brand underline">
                  Ver o certificado
                </Link>
              </p>
            )}
          </div>
        </Reveal>

        {curso.certificado_por_etapas && listaEtapas.length > 0 ? (
          <Reveal delay={100} className="mt-6">
            <TourEtapas
              chave={curso.slug}
              cargaTotal={curso.carga_horaria_horas}
              etapas={listaEtapas.map((e) => ({ horas: e.horas, aulas: e.aulas_exigidas }))}
              totalAulas={total}
            />
            {ultimaLiberada && !certificado && (
              <PopupEtapa
                horas={ultimaLiberada.horas}
                proxima={proximaEtapa?.horas ?? curso.carga_horaria_horas}
                cursoHref={`/minha-area/cursos/${curso.slug}`}
                chave={`${curso.slug}-${ultimaLiberada.horas}`}
                emitirHref={`/minha-area/cursos/${curso.slug}/certificado#certificado-opcoes`}
              />
            )}
            <div className="border border-[#D7DEE6] bg-white p-5">
              <h2 className="font-display text-lg font-extrabold text-[#14213A]">Jornada do certificado</h2>
              <p className="mt-1 text-[14px] text-[#516278]">
                Cada etapa libera um certificado: conclua as aulas, faça o questionário de 5 questões e emita quando quiser,
                ou continue até a carga completa.
              </p>
              <ol className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {listaEtapas.map((e) => {
                  const ok = etapaLiberada(e);
                  const aulasOkEtapa = feitas >= e.aulas_exigidas;
                  return (
                    <li key={e.horas} className={`flex flex-col border p-4 ${ok ? "border-accent-2 bg-[#E6F4F1]" : "border-[#D7DEE6]"}`}>
                      <p className="font-display text-2xl font-extrabold text-[#14213A]">
                        {e.horas} h {ok && <IconeEmoji emoji="bi:star-fill" cor="#E3A92B" />}
                      </p>
                      <p className="mt-1 flex-1 text-[13px] text-[#516278]">
                        {ok
                          ? "Liberado!"
                          : aulasOkEtapa
                            ? "Aulas concluídas: falta o questionário"
                            : `Faltam ${e.aulas_exigidas - feitas} aulas`}
                      </p>
                      {ok ? (
                        <Link prefetch={false} href={`/minha-area/cursos/${curso.slug}/certificado`} className="mt-3 text-[13.5px] font-bold text-accent-2 underline underline-offset-4">
                          Emitir certificado →
                        </Link>
                      ) : aulasOkEtapa && e.tem_questionario ? (
                        <Link prefetch={false} href={`/minha-area/cursos/${curso.slug}/prova?etapa=${e.horas}`} className="mt-3 bg-accent px-3 py-2 text-center text-[13.5px] font-bold text-accent-ink">
                          Fazer questionário
                        </Link>
                      ) : null}
                    </li>
                  );
                })}
                <li className={`flex flex-col border p-4 ${aulasOk && provaOk ? "border-accent-2 bg-[#E6F4F1]" : "border-[#D7DEE6]"}`}>
                  <p className="font-display text-2xl font-extrabold text-[#14213A]">
                    {curso.carga_horaria_horas} h {aulasOk && provaOk && <IconeEmoji emoji="bi:trophy-fill" cor="#E3A92B" />}
                  </p>
                  <p className="mt-1 flex-1 text-[13px] text-[#516278]">
                    {aulasOk && provaOk ? "Curso completo!" : aulasOk ? "Falta a prova final" : `Todas as ${total} aulas + prova final`}
                  </p>
                  {aulasOk && (
                    <Link prefetch={false} href={`/minha-area/cursos/${curso.slug}/prova`} className="mt-3 text-[13.5px] font-bold text-brand underline underline-offset-4">
                      {provaOk ? "Refazer a prova" : "Fazer a prova final"} →
                    </Link>
                  )}
                </li>
              </ol>
            </div>
          </Reveal>
        ) : (
        <Reveal delay={100} className="mt-6">
          <ol className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <EtapaCard numero={1} titulo="Concluir as aulas" ok={aulasOk} texto={`${feitas}/${total} concluídas`} />
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
              texto={certificado ? "Emitido" : undefined}
              href={`/minha-area/cursos/${curso.slug}/certificado`}
              rotuloLink={certificado ? "Ver certificado" : "Como obter"}
            />
          </ol>
        </Reveal>
        )}


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
                          {feita ? "✓" : disponivel ? "▶" : <IconeEmoji emoji="bi:lock-fill" cor="currentColor" />}
                        </span>
                        <span className="flex-1 text-[15px] text-[#14213A]">{aula.titulo}</span>
                      </>
                    );
                    return (
                      <Fragment key={aula.id}>
                      <li className="border-b border-[#F0F4F8] last:border-0">
                        {disponivel ? (
                          <Link
                            href={`/minha-area/cursos/${curso.slug}/aula/${aula.id}`}
                            prefetch={false}
                            className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-[#F6F9FC]"
                          >
                            {conteudo}
                          </Link>
                        ) : (
                          <div className="flex items-center gap-3 px-5 py-3 opacity-70">{conteudo}</div>
                        )}
                      </li>
                      {(() => {
                        const e = etapaDepoisDa.get(posicaoAula.get(aula.id) ?? -1);
                        if (!e || !e.tem_questionario) return null;
                        const ok = etapaLiberada(e);
                        const disponivelQ = feitas >= e.aulas_exigidas;
                        return (
                          <li className="border-b border-[#F0F4F8] bg-[#FFF8EB] last:border-0">
                            {disponivelQ && !ok ? (
                              <Link prefetch={false} href={`/minha-area/cursos/${curso.slug}/prova?etapa=${e.horas}`} className="flex items-center gap-3 px-5 py-3 font-semibold text-[#14213A] hover:bg-[#FFF1D6]">
                                <IconeEmoji emoji="bi:star-fill" cor="#E3A92B" className="text-[18px]" />
                                <span className="flex-1 text-[15px]">Questionário da etapa de {e.horas} horas (5 questões)</span>
                                <span className="text-[13px] font-bold text-brand">Fazer →</span>
                              </Link>
                            ) : (
                              <div className={`flex items-center gap-3 px-5 py-3 ${ok ? "" : "opacity-70"}`}>
                                <IconeEmoji emoji={ok ? "bi:star-fill" : "bi:lock-fill"} cor={ok ? "#E3A92B" : "#93A0AF"} className="text-[18px]" />
                                <span className="flex-1 text-[15px] text-[#14213A]">
                                  Questionário da etapa de {e.horas} horas{ok ? " · aprovado, certificado liberado" : ""}
                                </span>
                              </div>
                            )}
                          </li>
                        );
                      })()}
                      </Fragment>

                    );
                  })}
                </ul>
              </section>
            </Reveal>
          ))}
        </div>

        {curso.slug === CURSO_MARCA && (
          <section className="mt-8 flex flex-col gap-4 border-l-4 border-accent bg-white p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-[1.15rem] font-extrabold text-[#14213A]">Não conseguiu fazer o pedido sozinho?</h2>
              <p className="mt-1 text-[14.5px] leading-relaxed text-[#516278]">
                Suporte Especializado: fazemos o pedido com você, por acesso remoto, em até 24 horas corridas. R$ 59,90.
              </p>
            </div>
            <Link prefetch={false} href={AREA_SUPORTE_MARCA} className="shrink-0 bg-accent px-5 py-3 text-center font-extrabold text-accent-ink transition-all hover:brightness-110">
              Suporte Especializado →
            </Link>
          </section>
        )}
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
  texto?: string;
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
        <Link prefetch={false} href={href} className="mt-3 text-[13.5px] font-bold text-brand underline underline-offset-4">
          {rotuloLink} →
        </Link>
      )}
    </li>
  );
}
