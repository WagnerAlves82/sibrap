import { redirect } from "next/navigation";
import { criarClienteSupabaseServer } from "@/lib/supabase-server";
import { criarClienteSupabaseAdmin } from "@/lib/supabase-admin";
import { SimuladoCompletoApp } from "./SimuladoCompletoApp";

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
    .select("id, nome, quadro")
    .order("quadro")
    .order("nome");

  // Verifica, por cargo, se o banco de Conhecimentos Específicos já tem
  // questões suficientes pra cobrir o que o edital exige (`numero_questoes`
  // em `cargo_disciplinas`) — usado só pra avisar o aluno, não bloqueia nada.
  const { data: disciplinasCE } = await supabase
    .from("cargo_disciplinas")
    .select("cargo_id, numero_questoes, disciplinas(slug)");

  const necessariasPorCargo = new Map<string, number>();
  for (const row of disciplinasCE ?? []) {
    if (row.disciplinas?.slug?.startsWith("ce-")) {
      necessariasPorCargo.set(row.cargo_id, row.numero_questoes);
    }
  }

  // `questoes` não tem policy de leitura pública de propósito (protege o
  // gabarito) — aqui só contamos `cargo_id`, sem tocar em enunciado nem
  // gabarito, então usar o client admin pra essa contagem é seguro.
  const supabaseAdmin = criarClienteSupabaseAdmin();
  const { data: questoesCE } = await supabaseAdmin
    .from("questoes")
    .select("cargo_id")
    .not("cargo_id", "is", null)
    .eq("ativa", true);

  const disponiveisPorCargo = new Map<string, number>();
  for (const q of questoesCE ?? []) {
    if (q.cargo_id) {
      disponiveisPorCargo.set(q.cargo_id, (disponiveisPorCargo.get(q.cargo_id) ?? 0) + 1);
    }
  }

  const cargosComStatus = (cargos ?? []).map((c) => {
    const necessarias = necessariasPorCargo.get(c.id) ?? 0;
    const disponiveis = disponiveisPorCargo.get(c.id) ?? 0;
    return { ...c, conteudoCompleto: necessarias > 0 && disponiveis >= necessarias };
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 py-16">
      <SimuladoCompletoApp produtoId={produto.id} cargos={cargosComStatus} />
    </div>
  );
}
