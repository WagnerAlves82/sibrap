import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { criarClienteSupabaseServer } from "@/lib/supabase-server";
import { criarClienteSupabaseAdmin } from "@/lib/supabase-admin";
import { cartaoLiberado } from "@/lib/abacatepay";
import { CabecalhoSite, RodapeSite } from "@/components/site-chrome";
import { formatarPreco } from "@/lib/apostilas";
import { comboPorSlug } from "@/lib/combos";
import { ComprarApostila } from "../../apostilas/[slug]/Comprar";

export const metadata: Metadata = {
  title: "Meu combo",
  robots: { index: false },
};

export default async function ComboAreaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const combo = comboPorSlug(slug);
  if (!combo) notFound();

  const supabase = await criarClienteSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const admin = criarClienteSupabaseAdmin();
  const { data: produto } = await admin
    .from("produtos")
    .select("id, nome, preco_centavos, ativo")
    .eq("slug", `combo-${slug}`)
    .maybeSingle();
  if (!produto) notFound();

  const { data: acesso } = await supabase.from("acessos").select("id").eq("produto_id", produto.id).maybeSingle();
  const tem = !!acesso;
  if (!tem && !produto.ativo) notFound();

  const preco = formatarPreco(produto.preco_centavos);

  return (
    <div className="flex min-h-screen flex-col bg-surface-2 font-body">
      <CabecalhoSite logado={!!user} next={`/minha-area/combos/${slug}`} />
      <main className="mx-auto w-full max-w-[860px] flex-1 px-4 py-10 sm:px-6">
        <Link href="/minha-area" className="text-[13px] font-semibold text-brand underline underline-offset-4">
          ← Minha área
        </Link>

        <div className="mt-5 grid gap-7 rounded-xl border border-[#D7DEE6] bg-white p-5 sm:grid-cols-[260px_minmax(0,1fr)] sm:p-7">
          <Image
            src="/hero-combo-enfermagem.webp"
            alt="Combo apostila e videoaulas"
            width={1000}
            height={875}
            sizes="260px"
            className="mx-auto h-auto w-full max-w-[260px]"
          />
          <div>
            <p className="font-data text-[11.5px] font-semibold uppercase tracking-wide text-accent-2">Combo · {combo.uf}</p>
            <h1 className="mt-1 font-display text-2xl font-extrabold text-[#14213A] sm:text-3xl">{produto.nome}</h1>

            {tem ? (
              <div className="mt-5">
                <p className="text-[15px] text-[#516278]">
                  Pagamento confirmado. A apostila, o simulado on-line e o plano de estudos já estão liberados. As videoaulas de{" "}
                  {combo.videoaulas.join(" e ")} aparecem aqui na sua área.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link
                    href={`/minha-area/apostilas/${slug}`}
                    className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3.5 text-[15px] font-bold text-accent-ink transition-colors hover:brightness-105"
                  >
                    Abrir minha apostila <span aria-hidden>→</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="mt-5">
                <p className="font-data text-3xl font-semibold text-[#14213A]">{preco}</p>
                <p className="mb-4 text-[13px] text-[#516278]">
                  Apostila + videoaulas, pagamento único por PIX ou cartão de crédito. A liberação é automática assim que o
                  pagamento for confirmado.
                </p>
                <ComprarApostila
                  slug={slug}
                  titulo={produto.nome}
                  preco={preco}
                  precoCentavos={produto.preco_centavos}
                  cartaoAtivo={cartaoLiberado()}
                  combo
                />
              </div>
            )}
          </div>
        </div>
      </main>
      <RodapeSite />
    </div>
  );
}
