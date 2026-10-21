import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { criarClienteSupabaseServer } from "@/lib/supabase-server";
import { criarClienteSupabaseAdmin } from "@/lib/supabase-admin";
import { CabecalhoSite, RodapeSite } from "@/components/site-chrome";
import { diasAte, formatarDataIso, slugValido } from "@/lib/apostilas";
import { hojeEmSaoPaulo, minutosDoCapitulo, montarPlano, type ItemPlano } from "@/lib/plano-estudos";
import { ListaCronograma, type TopicoCronograma } from "./ListaCronograma";
import { PlanoDiario, type DiaTela } from "./PlanoDiario";

export const metadata: Metadata = {
  title: "Cronograma de estudos",
  robots: { index: false },
};

export default async function CronogramaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!slugValido(slug)) notFound();

  const supabase = await criarClienteSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/minha-area/apostilas/${slug}/cronograma`)}`);

  const admin = criarClienteSupabaseAdmin();
  const { data: apostila } = await admin
    .from("apostilas")
    .select("id, titulo, produto_id, data_prova, produtos(cargo_id, inclui_simulado)")
    .eq("slug", slug)
    .maybeSingle();
  if (!apostila) notFound();

  const { data: acesso } = await supabase
    .from("acessos")
    .select("id")
    .eq("produto_id", apostila.produto_id)
    .maybeSingle();
  if (!acesso) redirect(`/minha-area/apostilas/${slug}`);

  // Apostila com capítulos online: plano diário automático até a prova.
  const { data: capitulos } = await supabase
    .from("apostila_capitulos")
    .select("numero, titulo, html")
    .eq("apostila_id", apostila.id)
    .order("numero");
  if ((capitulos ?? []).length > 0) {
    const { data: feitosPlano } = await supabase.from("plano_progresso").select("item").eq("produto_id", apostila.produto_id);
    const concluidos = (feitosPlano ?? []).map((f) => f.item);
    const feitosSet = new Set(concluidos);
    const itens: ItemPlano[] = capitulos!.map((c) => ({
      id: `cap${c.numero}`,
      numero: c.numero,
      titulo: c.titulo,
      minutos: minutosDoCapitulo(c.html.replace(/<[^>]+>/g, " ").length),
    }));
    const hoje = hojeEmSaoPaulo();
    const plano = montarPlano(
      itens.filter((i) => !feitosSet.has(i.id)),
      apostila.data_prova,
      hoje
    );
    const nomeDia = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "2-digit", timeZone: "UTC" });
    const dias: DiaTela[] = plano.dias.map((d) => ({
      data: d.data,
      rotulo: nomeDia.format(new Date(`${d.data}T12:00:00Z`)),
      tipo: d.tipo,
      itens: d.itens,
      minutos: d.minutos,
    }));
    const diasProva = plano.diasRestantes;
    const dataProva = formatarDataIso(apostila.data_prova);
    return (
      <div className="flex min-h-screen flex-col bg-surface-2 font-body">
        <CabecalhoSite logado />
        <main className="mx-auto w-full max-w-[820px] flex-1 px-4 py-10 sm:px-6">
          <Link href={`/minha-area/apostilas/${slug}`} className="text-[13px] font-semibold text-brand underline underline-offset-4">
            ← Voltar pra apostila
          </Link>
          <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl font-extrabold text-[#14213A] sm:text-[1.75rem]">Seu plano de estudos</h1>
              <p className="mt-1 text-[14px] text-[#516278]">{apostila.titulo}</p>
            </div>
            {diasProva !== null && diasProva > 0 && (
              <span className="rounded-lg bg-brand px-4 py-2.5 font-data text-[13px] font-bold text-white">
                {diasProva === 1 ? "A prova é amanhã" : `Faltam ${diasProva - 1} dias`}
                {dataProva ? ` · ${dataProva}` : ""}
              </span>
            )}
          </div>
          <p className="mt-3 text-[13.5px] text-[#516278]">
            {plano.semData
              ? "Esta apostila ainda não tem data de prova definida, então o plano segue um ritmo de 35 dias."
              : "O plano distribui os capítulos que faltam pelos dias até a prova. Se você atrasar, ele se reorganiza sozinho."}
            {plano.prazoCurto && !plano.semData ? " O prazo está curto: priorize os capítulos de cada dia e treine no simulado." : ""}
          </p>
          <div className="mt-6">
            {plano.dias.every((d) => d.itens.length === 0) && feitosSet.size >= itens.length ? (
              <p className="rounded-xl border border-[#D7DEE6] bg-white p-5 text-[14.5px] text-[#33465E]">
                Você concluiu todos os capítulos. Agora é revisar e praticar no simulado até a prova.
              </p>
            ) : (
              <PlanoDiario slug={slug} comSimulado={!!apostila.produtos?.inclui_simulado} dias={dias} concluidos={concluidos} total={itens.length} />
            )}
          </div>
        </main>
        <RodapeSite />
      </div>
    );
  }

  const cargoId = apostila.produtos?.cargo_id;
  if (!cargoId) redirect(`/minha-area/apostilas/${slug}`);

  const [{ data: topicos }, { data: progresso }] = await Promise.all([
    supabase
      .from("cronograma_topicos")
      .select("id, ordem, titulo, minutos_estimados, disciplinas(nome)")
      .eq("cargo_id", cargoId)
      .order("ordem"),
    supabase.from("cronograma_progresso").select("topico_id"),
  ]);

  const concluidos = new Set((progresso ?? []).map((p) => p.topico_id));
  const lista: TopicoCronograma[] = (topicos ?? []).map((t) => ({
    id: t.id,
    ordem: t.ordem,
    titulo: t.titulo,
    minutos: t.minutos_estimados,
    disciplina: t.disciplinas?.nome ?? "",
    concluido: concluidos.has(t.id),
  }));

  const total = lista.length;
  const feitos = lista.filter((t) => t.concluido).length;
  const percentual = total > 0 ? Math.round((feitos / total) * 100) : 0;
  const dias = diasAte(apostila.data_prova);
  const prova = formatarDataIso(apostila.data_prova);

  // Barra por disciplina (mesma ideia do protótipo: cobertura do edital por matéria)
  const porDisciplina = new Map<string, { total: number; feitos: number }>();
  for (const t of lista) {
    const atual = porDisciplina.get(t.disciplina) ?? { total: 0, feitos: 0 };
    atual.total += 1;
    if (t.concluido) atual.feitos += 1;
    porDisciplina.set(t.disciplina, atual);
  }

  return (
    <div className="flex min-h-screen flex-col bg-surface-2 font-body">
      <CabecalhoSite logado />
      <main className="mx-auto w-full max-w-[820px] flex-1 px-4 py-10 sm:px-6">
        <Link
          href={`/minha-area/apostilas/${slug}`}
          className="text-[13px] font-semibold text-brand underline underline-offset-4"
        >
          ← Voltar pra apostila
        </Link>

        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-extrabold text-[#14213A] sm:text-[1.75rem]">
              Cronograma de estudos
            </h1>
            <p className="mt-1 text-[14px] text-[#516278]">{apostila.titulo}</p>
          </div>
          {dias !== null && dias >= 0 && (
            <span className="rounded-lg bg-brand px-4 py-2.5 font-data text-[13px] font-bold text-white">
              {dias === 0 ? "A prova é hoje" : dias === 1 ? "Falta 1 dia para a prova" : `Faltam ${dias} dias`}
              {prova ? ` · ${prova}` : ""}
            </span>
          )}
        </div>

        <div className="mt-6 rounded-xl border border-[#D7DEE6] bg-white p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-bold text-[#33465E]">Cobertura do conteúdo</p>
            <p className="font-data text-[13px] text-[#516278]">
              {feitos} de {total} tópicos · <strong className="text-[#14213A]">{percentual}%</strong>
            </p>
          </div>
          <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-[#E7EEF4]">
            <div
              className="h-full rounded-full bg-brand transition-[width] duration-500"
              style={{ width: `${percentual}%` }}
            />
          </div>

          <div className="mt-4 flex flex-col gap-1.5">
            {[...porDisciplina.entries()].map(([nome, v]) => (
              <div key={nome} className="flex items-center gap-3 text-[12.5px] text-[#516278]">
                <span className="w-[220px] shrink-0 truncate">{nome}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#E7EEF4]">
                  <div
                    className="h-full rounded-full bg-accent-2"
                    style={{ width: `${v.total > 0 ? Math.round((v.feitos / v.total) * 100) : 0}%` }}
                  />
                </div>
                <span className="w-10 shrink-0 text-right font-data">
                  {v.feitos}/{v.total}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <ListaCronograma topicos={lista} slugApostila={slug} />
        </div>
      </main>
      <RodapeSite />
    </div>
  );
}
