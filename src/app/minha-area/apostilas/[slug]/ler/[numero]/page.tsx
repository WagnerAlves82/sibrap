import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { criarClienteSupabaseServer } from "@/lib/supabase-server";
import { criarClienteSupabaseAdmin } from "@/lib/supabase-admin";
import { slugValido } from "@/lib/apostilas";
import { LeitorCapitulo } from "./LeitorCapitulo";

export const metadata: Metadata = {
  title: "Ler capítulo",
  robots: { index: false },
};

export default async function LerCapituloPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; numero: string }>;
  searchParams: Promise<{ secao?: string; de?: string }>;
}) {
  const { slug, numero } = await params;
  const { secao, de } = await searchParams;
  const n = Number(numero);
  if (!slugValido(slug) || !Number.isInteger(n) || n < 1) notFound();

  const supabase = await criarClienteSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/minha-area/apostilas/${slug}/ler/${n}`)}`);

  const admin = criarClienteSupabaseAdmin();
  const { data: apostila } = await admin.from("apostilas").select("id, titulo, produto_id").eq("slug", slug).maybeSingle();
  if (!apostila) notFound();

  const { data: acesso } = await supabase.from("acessos").select("id").eq("produto_id", apostila.produto_id).maybeSingle();
  if (!acesso) redirect(`/minha-area/apostilas/${slug}`);

  // a política de segurança do banco só devolve capítulos de quem comprou
  const [{ data: capitulo }, { data: indice }] = await Promise.all([
    supabase.from("apostila_capitulos").select("numero, titulo, html, secoes").eq("apostila_id", apostila.id).eq("numero", n).maybeSingle(),
    supabase.from("apostila_capitulos").select("numero, titulo").eq("apostila_id", apostila.id).order("numero"),
  ]);
  if (!capitulo) notFound();

  const lista = indice ?? [];
  const pos = lista.findIndex((c) => c.numero === n);
  const anterior = pos > 0 ? lista[pos - 1] : null;
  const proximo = pos >= 0 && pos < lista.length - 1 ? lista[pos + 1] : null;
  const secoes = (capitulo.secoes as unknown as { id: string; titulo: string }[]) ?? [];
  const secaoValida = secao && /^s\d+-\d+$/.test(secao) ? secao : null;

  return (
    <LeitorCapitulo
      slug={slug}
      tituloApostila={apostila.titulo}
      capitulo={{ numero: capitulo.numero, titulo: capitulo.titulo, html: capitulo.html }}
      secoes={secoes}
      indice={lista}
      anterior={anterior}
      proximo={proximo}
      secaoAlvo={secaoValida}
      vindoDoSimulado={de === "simulado"}
    />
  );
}
