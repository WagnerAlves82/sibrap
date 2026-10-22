import { redirect } from "next/navigation";
import { criarClienteSupabaseServer } from "@/lib/supabase-server";
import { criarClienteSupabaseAdmin } from "@/lib/supabase-admin";
import { CabecalhoSite, RodapeSite } from "@/components/site-chrome";
import { SimuladoPremiumApp, type CargoSimulado } from "./SimuladoPremiumApp";

export default async function SimuladoCompletoPage() {
  const supabase = await criarClienteSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: produto } = await supabase
    .from("produtos")
    .select("id")
    .eq("slug", "premium")
    .single();

  if (!produto) {
    redirect("/minha-area");
  }

  const { data: acesso } = await supabase
    .from("acessos")
    .select("id")
    .eq("user_id", user!.id)
    .eq("produto_id", produto.id)
    .maybeSingle();

  if (!acesso) {
    redirect("/minha-area/premium");
  }

  const { data: cargos } = await supabase
    .from("cargos")
    .select("id, nome, quadro, concurso_id")
    .order("quadro")
    .order("nome");

  // Por cargo: quantas questões a prova real tem (`numero_questoes` em `cargo_disciplinas`) e quantas o banco tem.
  // `questoes` não tem policy de leitura pública de propósito (protege o gabarito): aqui só se contam
  // disciplina e cargo, sem enunciado nem gabarito, então usar o client admin é seguro.
  const supabaseAdmin = criarClienteSupabaseAdmin();
  const [{ data: cd }, { data: qs }] = await Promise.all([
    supabase.from("cargo_disciplinas").select("cargo_id, disciplina_id, numero_questoes, disciplinas(slug)"),
    supabaseAdmin.from("questoes").select("disciplina_id, cargo_id, concurso_id").eq("ativa", true),
  ]);

  const cargosSimulado: CargoSimulado[] = (cargos ?? []).map((c) => {
    const discs = (cd ?? []).filter((d) => d.cargo_id === c.id);
    const padrao = discs.reduce((soma, d) => soma + d.numero_questoes, 0);
    const idsDisc = new Set(discs.map((d) => d.disciplina_id));
    const totalDisponivel = (qs ?? []).filter(
      (q) => q.concurso_id === c.concurso_id && idsDisc.has(q.disciplina_id) && (q.cargo_id === null || q.cargo_id === c.id)
    ).length;
    // aviso de "em construção": o banco de Conhecimentos Específicos do cargo cobre o que o edital pede?
    const ce = discs.find((d) => d.disciplinas?.slug?.startsWith("ce-"));
    const bancoCE = ce ? (qs ?? []).filter((q) => q.disciplina_id === ce.disciplina_id && (q.cargo_id === null || q.cargo_id === c.id)).length : 0;
    return {
      id: c.id,
      nome: c.nome,
      quadro: c.quadro,
      padrao,
      totalDisponivel,
      conteudoCompleto: !!ce && ce.numero_questoes > 0 && bancoCE >= ce.numero_questoes,
    };
  });

  // simulado começado e não encerrado: a página já abre nele
  const { data: aberta } = await supabase.rpc("retomar_simulado", { p_produto_id: produto.id });
  const retomada = aberta?.length
    ? aberta.map((q) => ({ ...q, alternativas: q.alternativas as unknown as { letra: string; texto: string }[] }))
    : null;
  let cargoRetomadaId: string | null = null;
  if (retomada) {
    const { data: t } = await supabaseAdmin
      .from("tentativas_simulado")
      .select("cargo_id")
      .eq("id", retomada[0].tentativa_id)
      .eq("user_id", user!.id)
      .maybeSingle();
    cargoRetomadaId = t?.cargo_id ?? null;
  }

  return (
    <div className="flex min-h-screen flex-col bg-surface-2 font-body">
      <CabecalhoSite logado />
      <main className="mx-auto w-full max-w-[720px] flex-1 px-4 py-10 sm:px-6">
        <SimuladoPremiumApp
          produtoId={produto.id}
          cargos={cargosSimulado}
          retomada={retomada}
          cargoRetomadaId={cargoRetomadaId}
        />
      </main>
      <RodapeSite />
    </div>
  );
}
