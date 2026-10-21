import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { criarClienteSupabaseServer } from "@/lib/supabase-server";
import { CabecalhoSite, RodapeSite } from "@/components/site-chrome";
import { IconeSolido } from "@/components/icones-solidos";
import { Reveal } from "@/components/reveal";
import { diasAte, formatarDataIso, formatarPreco } from "@/lib/apostilas";
import { comboPorSlug } from "@/lib/combos";

type Props = { params: Promise<{ slug: string }> };

async function carregar(slug: string) {
  const combo = comboPorSlug(slug);
  if (!combo) return null;
  const supabase = await criarClienteSupabaseServer();
  const [{ data: apostila }, { data: produto }] = await Promise.all([
    supabase.from("apostilas").select("*").eq("slug", slug).eq("status", "publicada").maybeSingle(),
    supabase.from("produtos").select("id, preco_centavos").eq("slug", `combo-${slug}`).eq("ativo", true).maybeSingle(),
  ]);
  if (!apostila) return null;
  return { combo, supabase, apostila, produto };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const d = await carregar(slug);
  if (!d) return {};
  const titulo = `Combo ${d.apostila.cargo} — ${d.apostila.orgao}: apostila + videoaulas`;
  const descricao = `Apostila em PDF com simulado online e videoaulas de ${d.combo.videoaulas.join(" e ")} para o concurso da SESA-AP, cargo de ${d.apostila.cargo}.`;
  return {
    title: titulo,
    description: descricao,
    alternates: { canonical: `/combos/${slug}` },
    openGraph: {
      url: `/combos/${slug}`,
      locale: "pt_BR",
      title: titulo,
      description: descricao,
      type: "website",
      images: [{ url: "/hero-combo-enfermagem.webp" }],
    },
  };
}

export default async function ComboPage({ params }: Props) {
  const { slug } = await params;
  const d = await carregar(slug);
  if (!d) notFound();
  const { combo, supabase, apostila, produto } = d;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const areaHref = `/minha-area/combos/${slug}`;
  const ctaHref = user ? areaHref : `/cadastro?next=${encodeURIComponent(areaHref)}`;
  const preco = produto?.preco_centavos ?? combo.precoPadraoCentavos;
  const prova = formatarDataIso(apostila.data_prova);
  const dias = diasAte(apostila.data_prova);
  const materias = combo.videoaulas.join(" e ");

  const fatos: [string, string][] = [
    ["Órgão", apostila.orgao],
    ["Cargo", apostila.cargo],
  ];
  if (apostila.banca) fatos.push(["Banca", apostila.banca]);
  if (apostila.vagas) fatos.push(["Vagas", apostila.vagas]);
  if (apostila.salario) fatos.push(["Remuneração", apostila.salario]);
  if (prova) fatos.push(["Prova", prova]);

  const inclui = [
    apostila.paginas ? `Apostila completa em PDF, com ${apostila.paginas} páginas` : "Apostila completa em PDF",
    apostila.questoes ? `${apostila.questoes} questões comentadas no estilo da banca` : "Questões comentadas no estilo da banca",
    "Capítulos para ler no celular e plano de estudos até a prova",
    "Simulado on-line com questões do seu cargo, missões e cronograma",
    `Videoaulas de ${materias}`,
    "Acesso imediato na sua área, após a confirmação do PIX",
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `Combo ${apostila.cargo} — ${apostila.orgao}`,
    description: apostila.descricao ?? undefined,
    image: "https://sibrap.tec.br/hero-combo-enfermagem.webp",
    brand: { "@type": "Brand", name: "SIBRAP" },
    offers: {
      "@type": "Offer",
      url: `https://sibrap.tec.br/combos/${slug}`,
      priceCurrency: "BRL",
      price: (preco / 100).toFixed(2),
      availability: "https://schema.org/InStock",
      priceValidUntil: apostila.data_prova ?? undefined,
    },
  };

  return (
    <div className="flex min-h-screen flex-col overflow-x-clip bg-white pb-16 font-body md:pb-0">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <CabecalhoSite logado={!!user} next={areaHref} />

      <main className="flex-1 bg-[#F6F8FB] py-10 sm:py-14">
        <div className="mx-auto grid max-w-[1080px] gap-8 px-4 sm:px-6 md:grid-cols-2 md:items-center md:gap-10 lg:gap-14">
          <div className="relative mx-auto w-full max-w-[420px] md:max-w-none">
            <span aria-hidden className="absolute inset-8 rounded-full bg-accent/25 blur-3xl" />
            <Image
              src="/hero-combo-enfermagem.webp"
              alt={`Combo apostila e videoaulas — ${apostila.cargo}, ${apostila.orgao}`}
              width={1000}
              height={875}
              priority
              sizes="(min-width: 768px) 520px, 90vw"
              className="relative h-auto w-full drop-shadow-[0_22px_34px_rgba(11,42,74,0.35)]"
            />
          </div>

          <div>
            <nav aria-label="Você está em" className="mb-3 text-[13px] text-[#516278]">
              <Link href="/#combo" className="hover:text-brand">
                Combos
              </Link>
              <span className="mx-1.5 opacity-50">/</span>
              {combo.uf}
            </nav>

            <h1 className="font-display text-[1.7rem] leading-[1.1] font-extrabold text-balance text-[#14213A] sm:text-[2.2rem]">
              Combo SESA-AP, Técnico em Enfermagem: apostila + videoaulas
            </h1>
            {apostila.descricao && (
              <p className="mt-3 max-w-[64ch] text-[15px] leading-relaxed text-[#516278]">{apostila.descricao}</p>
            )}
            <p className="mt-3 max-w-[64ch] text-[15px] leading-relaxed text-[#516278]">
              No combo você leva também videoaulas de {materias}, cobrindo os assuntos dessas matérias no edital, com
              explicação em vídeo para estudar no celular ou no computador.
            </p>

            {dias !== null && dias >= 0 && (
              <p className="mt-4 inline-block rounded-lg bg-accent px-3 py-2 font-data text-[13px] font-bold text-accent-ink">
                ⏳ {dias === 0 ? "A prova é hoje" : dias === 1 ? "Falta 1 dia para a prova" : `Faltam ${dias} dias para a prova`}
              </p>
            )}

            <div className="mt-5 rounded-xl border-2 border-accent bg-white p-5 shadow-[0_24px_50px_-28px_rgba(11,42,74,0.45)]">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="font-data text-4xl font-semibold text-[#14213A]">{formatarPreco(preco)}</p>
                  <p className="mt-1 text-[13px] text-[#516278]">Apostila + videoaulas · pagamento único, sem mensalidade</p>
                </div>
                <Link
                  href={ctaHref}
                  prefetch={false}
                  className="btn-pulso brilho inline-flex items-center gap-2 rounded-lg bg-accent px-7 py-4 text-[16px] font-extrabold text-accent-ink"
                >
                  Quero o combo <span aria-hidden>→</span>
                </Link>
              </div>
              <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] font-semibold text-[#33465E]">
                <span>⚡ Acesso imediato no PIX</span>
                <span>✓ 7 dias de garantia</span>
                <span>✓ Simulado on-line incluído</span>
              </p>
              {!user && (
                <p className="mt-2 text-[12.5px] text-[#516278]">Você cria a conta em menos de um minuto e paga na sequência.</p>
              )}
            </div>
          </div>
        </div>

        <div className="mx-auto mt-12 grid max-w-[1080px] gap-8 px-4 sm:px-6 md:grid-cols-2 md:gap-10 lg:gap-14">
          <div>
            <h2 className="font-display text-xl font-extrabold text-[#14213A]">Dados do concurso</h2>
            <dl className="mt-3 grid grid-cols-2 gap-px overflow-hidden rounded-[10px] border border-[#D7DEE6] bg-[#D7DEE6]">
              {fatos.map(([rotulo, valor]) => (
                <div key={rotulo} className="bg-white px-4 py-3">
                  <dt className="text-[11.5px] uppercase tracking-wide text-[#516278]">{rotulo}</dt>
                  <dd className="font-data text-[14px] font-semibold text-[#14213A]">{valor}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div>
            <h2 className="font-display text-xl font-extrabold text-[#14213A]">O que vem no combo</h2>
            <ul className="mt-3 flex flex-col gap-2 text-[15px] text-[#33465E]">
              {inclui.map((i) => (
                <li key={i} className="flex gap-2">
                  <span className="mt-0.5 text-accent-2" aria-hidden>
                    ✓
                  </span>
                  {i}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>

      <section className="overflow-hidden bg-brand py-14 text-white sm:py-16">
        <div className="mx-auto grid max-w-[1080px] items-center gap-10 px-4 sm:px-6 md:grid-cols-2">
          <Reveal variante="esquerda">
            <p className="font-data text-xs font-semibold uppercase tracking-wide text-accent">Videoaulas incluídas</p>
            <h2 className="mt-2 font-display text-[1.6rem] font-extrabold leading-tight sm:text-[2.1rem]">
              Veja o conteúdo explicado em vídeo.
            </h2>
            <p className="mt-4 text-[15.5px] leading-relaxed text-[#B9CBDF]">
              Videoaulas de {materias} cobrindo os assuntos que o edital pede nessas matérias. Você lê a apostila, assiste
              à aula quando precisar de uma explicação a mais e pratica no simulado on-line.
            </p>
            <ul className="mt-5 flex flex-col gap-2.5 text-[15px] leading-relaxed text-white/90">
              {combo.videoaulas.map((v) => (
                <li key={v} className="flex gap-2">
                  <span className="mt-0.5 text-accent" aria-hidden>
                    ✓
                  </span>
                  Videoaulas de {v}, na ordem do edital
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal variante="direita" delay={150}>
            <div className="rounded-xl border border-white/15 bg-white/10 p-6 text-center">
              <div className="flex justify-center">
                <IconeSolido nome="video" atraso={0} />
              </div>
              <p className="mt-3 font-display text-[1.15rem] font-extrabold">Videoaulas direto na sua área</p>
              <p className="mt-1 text-[14px] text-[#D7E6F7]">Sem baixar nada: é só entrar e assistir pelo celular ou computador.</p>
              <Link
                href={ctaHref}
                prefetch={false}
                className="btn-pulso brilho mt-5 inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-7 py-3.5 text-[15px] font-extrabold text-accent-ink"
              >
                Quero o combo <span aria-hidden>→</span>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-40 overflow-hidden border-t border-[#D7DEE6] bg-white/95 px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-[400px] items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-display text-[1rem] font-extrabold leading-none text-[#14213A]">{formatarPreco(preco)}</p>
            <p className="mt-0.5 truncate text-[10.5px] text-[#516278]">Apostila + videoaulas · PIX</p>
          </div>
          <Link
            href={ctaHref}
            prefetch={false}
            className="btn-pulso-suave shrink-0 whitespace-nowrap rounded-md bg-accent px-3 py-1.5 text-[12px] font-extrabold text-accent-ink"
          >
            Quero o combo →
          </Link>
        </div>
      </div>
      <RodapeSite />
    </div>
  );
}
