import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { criarClienteSupabaseServer } from "@/lib/supabase-server";
import { criarClienteSupabaseAdmin } from "@/lib/supabase-admin";
import { CabecalhoSite, RodapeSite } from "@/components/site-chrome";
import { slugValido } from "@/lib/apostilas";
import { SimuladoApostilaApp } from "./SimuladoApostilaApp";

export const metadata: Metadata = {
  title: "Simulado online",
  robots: { index: false },
};

export default async function SimuladoApostilaPage({
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
  if (!user) redirect(`/login?next=${encodeURIComponent(`/minha-area/apostilas/${slug}/simulado`)}`);

  const admin = criarClienteSupabaseAdmin();
  const { data: apostila } = await admin
    .from("apostilas")
    .select("titulo, produto_id, produtos(inclui_simulado, cargo_id)")
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
  if (!apostila.produtos?.inclui_simulado || !cargoId) {
    redirect(`/minha-area/apostilas/${slug}`);
  }

  // quantas questões o banco tem para esse cargo (limite do que dá pra escolher)
  const { data: produto } = await admin.from("produtos").select("concurso_id").eq("id", apostila.produto_id).maybeSingle();
  const { data: discs } = await admin
    .from("cargo_disciplinas")
    .select("disciplina_id, numero_questoes")
    .eq("cargo_id", cargoId);
  const padrao = (discs ?? []).reduce((soma, d) => soma + d.numero_questoes, 0);
  let totalDisponivel = 0;
  if (produto?.concurso_id && discs?.length) {
    const { count } = await admin
      .from("questoes")
      .select("id", { count: "exact", head: true })
      .eq("concurso_id", produto.concurso_id)
      .eq("ativa", true)
      .in("disciplina_id", discs.map((d) => d.disciplina_id))
      .or(`cargo_id.is.null,cargo_id.eq.${cargoId}`);
    totalDisponivel = count ?? 0;
  }

  // tentativa em aberto (para "continuar de onde parou")
  const { data: aberta } = await supabase.rpc("retomar_simulado", { p_produto_id: apostila.produto_id });
  const emAberto = aberta?.length
    ? { total: aberta.length, respondidas: aberta.filter((q) => q.resposta).length }
    : null;

  return (
    <div className="flex min-h-screen flex-col bg-surface-2 font-body">
      <CabecalhoSite logado />
      <main className="mx-auto w-full max-w-[720px] flex-1 px-4 py-10 sm:px-6">
        <SimuladoApostilaApp
          produtoId={apostila.produto_id}
          cargoId={cargoId}
          tituloApostila={apostila.titulo}
          slugApostila={slug}
          padrao={padrao}
          totalDisponivel={totalDisponivel}
          emAberto={emAberto}
        />
      </main>
      <RodapeSite />
    </div>
  );
}
