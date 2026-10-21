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

  // Videoaulas: só o servidor lê; a URL do vídeo só vai para a página quando a aula está liberada.
  const { data: aulas } = tem
    ? await admin.from("combo_videoaulas").select("*").eq("combo_slug", slug).order("ordem")
    : { data: [] };
  const materias = combo.videoaulas.map((materia) => ({
    materia,
    aulas: (aulas ?? [])
      .filter((a) => a.materia === materia)
      .map((a) => ({ id: a.id, titulo: a.titulo, url: a.liberada ? a.video_url : null })),
  }));

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
        {tem && (
          <section className="mt-8" aria-label="Videoaulas">
            <h2 className="font-display text-xl font-extrabold text-[#14213A]">Videoaulas</h2>
            <p className="mt-1 text-[14px] text-[#516278]">As aulas são liberadas aos poucos. As que ainda não saíram aparecem como “Em breve”.</p>
            <div className="mt-4 grid gap-5 sm:grid-cols-2">
              {materias.map(({ materia, aulas: lista }) => (
                <div key={materia} className="rounded-xl border border-[#D7DEE6] bg-white p-5">
                  <h3 className="font-display text-[1.05rem] font-bold text-[#14213A]">{materia}</h3>
                  <ul className="mt-3 flex flex-col gap-2">
                    {lista.map((a) => {
                      const embed = urlEmbed(a.url);
                      return (
                        <li key={a.id} className="rounded-lg border border-[#E3EAF2]">
                          {a.url ? (
                            <details className="group">
                              <summary className="flex cursor-pointer list-none items-center gap-3 px-3 py-2.5 text-[14.5px] font-semibold text-[#14213A]">
                                <IconePlay ativo />
                                {a.titulo}
                              </summary>
                              <div className="px-3 pb-3">
                                {embed ? (
                                  <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
                                    <iframe
                                      src={embed}
                                      title={a.titulo}
                                      loading="lazy"
                                      allow="accelerometer; encrypted-media; picture-in-picture"
                                      allowFullScreen
                                      className="h-full w-full"
                                    />
                                  </div>
                                ) : (
                                  <a href={a.url} target="_blank" rel="noopener noreferrer" className="text-[14px] font-semibold text-brand underline underline-offset-4">
                                    Assistir à videoaula
                                  </a>
                                )}
                              </div>
                            </details>
                          ) : (
                            <div className="flex items-center gap-3 px-3 py-2.5 text-[14.5px] text-[#8793A3]" aria-disabled>
                              <IconePlay ativo={false} />
                              <span className="flex-1">{a.titulo}</span>
                              <span className="rounded bg-[#EEF2F7] px-2 py-0.5 font-data text-[11px] font-bold uppercase tracking-wide text-[#6B7A8D]">
                                Em breve
                              </span>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
      <RodapeSite />
    </div>
  );
}

// Converte link do YouTube (watch, youtu.be ou embed) em URL de incorporação; outros links viram botão.
function urlEmbed(url: string | null): string | null {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
  return m ? `https://www.youtube-nocookie.com/embed/${m[1]}` : null;
}

function IconePlay({ ativo }: { ativo: boolean }) {
  return (
    <span
      aria-hidden
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${ativo ? "bg-accent text-accent-ink" : "bg-[#E3EAF2] text-[#9AA7B7]"}`}
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
        <path d="M3 1.5v9l7.5-4.5L3 1.5Z" />
      </svg>
    </span>
  );
}
