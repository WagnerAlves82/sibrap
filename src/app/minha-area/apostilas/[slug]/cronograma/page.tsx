import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { criarClienteSupabaseServer } from "@/lib/supabase-server";
import { criarClienteSupabaseAdmin } from "@/lib/supabase-admin";
import { CabecalhoSite, RodapeSite } from "@/components/site-chrome";
import { diasAte, formatarDataIso, slugValido } from "@/lib/apostilas";
import { ListaCronograma, type TopicoCronograma } from "./ListaCronograma";

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
    .select("titulo, produto_id, data_prova, produtos(cargo_id)")
    .eq("slug", slug)
    .maybeSingle();
  if (!apostila) notFound();

  const { data: acesso } = await supabase
    .from("acessos")
    .select("id")
    .eq("produto_id", apostila.produto_id)
    .maybeSingle();
  if (!acesso) redirect(`/minha-area/apostilas/${slug}`);

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
