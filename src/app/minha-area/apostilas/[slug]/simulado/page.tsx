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

  return (
    <div className="flex min-h-screen flex-col bg-surface-2 font-body">
      <CabecalhoSite logado />
      <main className="mx-auto w-full max-w-[720px] flex-1 px-4 py-10 sm:px-6">
        <SimuladoApostilaApp
          produtoId={apostila.produto_id}
          cargoId={cargoId}
          tituloApostila={apostila.titulo}
          slugApostila={slug}
        />
      </main>
      <RodapeSite />
    </div>
  );
}
