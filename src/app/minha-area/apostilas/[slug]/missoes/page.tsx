import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { criarClienteSupabaseServer } from "@/lib/supabase-server";
import { criarClienteSupabaseAdmin } from "@/lib/supabase-admin";
import { CabecalhoSite, RodapeSite } from "@/components/site-chrome";
import { slugValido } from "@/lib/apostilas";

export const metadata: Metadata = {
  title: "Missões",
  robots: { index: false },
};

type Missao = {
  titulo: string;
  categoria: string;
  concluida: boolean;
  progresso: string;
  xp: number;
};

/** Data (AAAA-MM-DD, UTC) de um timestamp — pra agrupar atividade por dia. */
function dataUtc(iso: string): string {
  return iso.slice(0, 10);
}

/** Sequência de dias seguidos com atividade, terminando hoje ou ontem. */
function calcularSequencia(datas: string[]): number {
  const unicas = [...new Set(datas)].sort().reverse();
  if (unicas.length === 0) return 0;
  const [hy, hm, hd] = new Date().toISOString().slice(0, 10).split("-").map(Number);
  const hoje = Date.UTC(hy, hm - 1, hd);
  const [ay, am, ad] = unicas[0].split("-").map(Number);
  const diffUltima = Math.round((hoje - Date.UTC(ay, am - 1, ad)) / 86_400_000);
  if (diffUltima > 1) return 0;

  let seq = 1;
  for (let i = 1; i < unicas.length; i++) {
    const [by, bm, bd] = unicas[i - 1].split("-").map(Number);
    const [cy, cm, cd] = unicas[i].split("-").map(Number);
    const diff = Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(cy, cm - 1, cd)) / 86_400_000);
    if (diff === 1) seq++;
    else break;
  }
  return seq;
}

export default async function MissoesPage({
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
  if (!user) redirect(`/login?next=${encodeURIComponent(`/minha-area/apostilas/${slug}/missoes`)}`);

  const admin = criarClienteSupabaseAdmin();
  const { data: apostila } = await admin
    .from("apostilas")
    .select("titulo, produto_id, produtos(cargo_id)")
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

  const [{ data: topicos }, { data: progresso }, { data: tentativas }] = await Promise.all([
    supabase.from("cronograma_topicos").select("id, disciplinas(nome)").eq("cargo_id", cargoId),
    supabase.from("cronograma_progresso").select("topico_id, concluido_em"),
    supabase
      .from("tentativas_simulado")
      .select("nota, iniciado_em, finalizado_em")
      .eq("produto_id", apostila.produto_id)
      .not("finalizado_em", "is", null),
  ]);

  const concluidosPorTopico = new Map((progresso ?? []).map((p) => [p.topico_id, p.concluido_em]));

  const porDisciplina = new Map<string, { total: number; feitos: number }>();
  for (const t of topicos ?? []) {
    const nome = t.disciplinas?.nome ?? "";
    const atual = porDisciplina.get(nome) ?? { total: 0, feitos: 0 };
    atual.total += 1;
    if (concluidosPorTopico.has(t.id)) atual.feitos += 1;
    porDisciplina.set(nome, atual);
  }
  const totalTopicos = [...porDisciplina.values()].reduce((s, v) => s + v.total, 0);
  const totalFeitos = [...porDisciplina.values()].reduce((s, v) => s + v.feitos, 0);
  const percentualGeral = totalTopicos > 0 ? Math.round((totalFeitos / totalTopicos) * 100) : 0;

  const listaTentativas = tentativas ?? [];
  const melhorNota = listaTentativas.reduce((max, t) => Math.max(max, t.nota ?? 0), 0);

  const datasAtividade = [
    ...(progresso ?? []).map((p) => dataUtc(p.concluido_em)),
    ...listaTentativas.map((t) => dataUtc(t.iniciado_em)),
  ];
  const sequencia = calcularSequencia(datasAtividade);

  const missoes: Missao[] = [];
  for (const [nome, v] of porDisciplina) {
    missoes.push({
      titulo: `Complete os tópicos de ${nome} no cronograma`,
      categoria: nome,
      concluida: v.total > 0 && v.feitos === v.total,
      progresso: `${v.feitos}/${v.total}`,
      xp: 15,
    });
  }
  missoes.push({
    titulo: "Faça seu primeiro simulado online",
    categoria: "Simulado",
    concluida: listaTentativas.length > 0,
    progresso: listaTentativas.length > 0 ? "concluída" : "0/1",
    xp: 20,
  });
  missoes.push({
    titulo: "Tire nota 6 ou mais (60%) num simulado",
    categoria: "Simulado",
    concluida: melhorNota >= 60,
    progresso: `melhor nota: ${melhorNota.toFixed(0)}%`,
    xp: 25,
  });
  missoes.push({
    titulo: "Complete metade do cronograma (50%)",
    categoria: "Cronograma",
    concluida: percentualGeral >= 50,
    progresso: `${percentualGeral}%`,
    xp: 30,
  });
  missoes.push({
    titulo: "Complete o cronograma inteiro",
    categoria: "Cronograma",
    concluida: percentualGeral === 100 && totalTopicos > 0,
    progresso: `${percentualGeral}%`,
    xp: 50,
  });
  missoes.push({
    titulo: "Estude 3 dias seguidos",
    categoria: "Constância",
    concluida: sequencia >= 3,
    progresso: `${Math.min(sequencia, 3)}/3 dias`,
    xp: 20,
  });

  const xpTotal = missoes.filter((m) => m.concluida).reduce((s, m) => s + m.xp, 0);
  const concluidasCount = missoes.filter((m) => m.concluida).length;
  const percentualMissoes = missoes.length > 0 ? Math.round((concluidasCount / missoes.length) * 100) : 0;
  const circunferencia = 2 * Math.PI * 32;
  const tracoCheio = (percentualMissoes / 100) * circunferencia;

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

        <div className="mt-4 flex flex-wrap items-start justify-between gap-6">
          <div>
            <h1 className="font-display text-2xl font-extrabold text-[#14213A] sm:text-[1.75rem]">Missões</h1>
            <p className="mt-1 max-w-[46ch] text-[14px] text-[#516278]">
              Pequenos objetivos tirados do seu cronograma e do simulado — completar cada um te aproxima do
              conteúdo inteiro coberto.
            </p>
          </div>

          <div className="flex items-center gap-4 rounded-xl border border-[#D7DEE6] bg-white px-5 py-4">
            <svg width="64" height="64" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="32" fill="none" stroke="#E7EEF4" strokeWidth="10" />
              <circle
                cx="40"
                cy="40"
                r="32"
                fill="none"
                stroke="#b9862a"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${tracoCheio} ${circunferencia}`}
                transform="rotate(-90 40 40)"
              />
              <text x="40" y="45" textAnchor="middle" fontFamily="'IBM Plex Mono', monospace" fontSize="14" fontWeight="700" fill="#14213A">
                {percentualMissoes}%
              </text>
            </svg>
            <div className="flex flex-col gap-1.5">
              <p className="font-data text-[13px] font-bold text-[#14213A]">
                {sequencia > 0
                  ? sequencia === 1
                    ? "1 dia seguido"
                    : `${sequencia} dias seguidos`
                  : "Comece hoje"}
              </p>
              <p className="font-data text-[13px] font-bold text-accent-2">{xpTotal} XP acumulados</p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2.5">
          {missoes.map((m) => (
            <div
              key={m.titulo}
              className={`flex items-center gap-4 rounded-xl border bg-white px-4 py-3.5 ${
                m.concluida ? "border-accent-2/40" : "border-[#D7DEE6]"
              }`}
            >
              <span
                aria-hidden
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  m.concluida ? "bg-accent-2 text-white" : "border-2 border-[#D7DEE6] text-transparent"
                }`}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m5 13 4 4L19 7" />
                </svg>
              </span>
              <div className="min-w-0 flex-1">
                <p className={`text-[13.5px] font-bold ${m.concluida ? "text-[#14213A]" : "text-[#33465E]"}`}>
                  {m.titulo}
                </p>
                <p className="mt-0.5 font-data text-[10.5px] uppercase tracking-wide text-[#94A3B8]">
                  {m.categoria} · {m.progresso}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 font-data text-[11.5px] font-bold ${
                  m.concluida ? "bg-[#DDF3EA] text-[#0a6151]" : "bg-[#F6F8FB] text-[#516278]"
                }`}
              >
                +{m.xp} XP
              </span>
            </div>
          ))}
        </div>
      </main>
      <RodapeSite />
    </div>
  );
}
