import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { criarClienteSupabaseServer } from "@/lib/supabase-server";
import { criarClienteSupabaseAdmin } from "@/lib/supabase-admin";
import { CabecalhoSite, RodapeSite } from "@/components/site-chrome";
import { slugValido } from "@/lib/apostilas";

export const metadata: Metadata = {
  title: "Ler a apostila",
  robots: { index: false },
};

export default async function LerIndicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!slugValido(slug)) notFound();

  const supabase = await criarClienteSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/minha-area/apostilas/${slug}/ler`)}`);

  const admin = criarClienteSupabaseAdmin();
  const { data: apostila } = await admin.from("apostilas").select("id, titulo, produto_id").eq("slug", slug).maybeSingle();
  if (!apostila) notFound();

  const { data: acesso } = await supabase.from("acessos").select("id").eq("produto_id", apostila.produto_id).maybeSingle();
  if (!acesso) redirect(`/minha-area/apostilas/${slug}`);

  const { data: capitulos } = await supabase
    .from("apostila_capitulos")
    .select("numero, titulo")
    .eq("apostila_id", apostila.id)
    .order("numero");

  return (
    <div className="flex min-h-screen flex-col bg-surface-2 font-body">
      <CabecalhoSite logado />
      <main className="mx-auto w-full max-w-[720px] flex-1 px-4 py-8 sm:px-6">
        <Link href={`/minha-area/apostilas/${slug}`} className="text-[13px] font-semibold text-brand underline underline-offset-4">
          ← Voltar à apostila
        </Link>
        <h1 className="mt-4 font-display text-[1.6rem] font-extrabold text-[#14213A]">Ler a apostila</h1>
        <p className="mt-1 text-[14px] text-[#516278]">{apostila.titulo}. Leia no celular ou no computador, capítulo por capítulo.</p>

        {(capitulos ?? []).length === 0 ? (
          <p className="mt-8 rounded-xl border border-[#D7DEE6] bg-white p-5 text-[14px] text-[#516278]">
            A leitura online desta apostila ainda está sendo preparada. Por enquanto, baixe o PDF na página da apostila.
          </p>
        ) : (
          <ol className="mt-6 flex flex-col gap-2">
            {capitulos!.map((c) => (
              <li key={c.numero}>
                <Link
                  href={`/minha-area/apostilas/${slug}/ler/${c.numero}`}
                  className="flex items-center gap-3 rounded-xl border border-[#D7DEE6] bg-white px-4 py-3 transition-colors hover:border-brand"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand font-data text-[13px] font-bold text-white">
                    {c.numero}
                  </span>
                  <span className="text-[14.5px] font-semibold leading-snug text-[#14213A]">{c.titulo}</span>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </main>
      <RodapeSite />
    </div>
  );
}
