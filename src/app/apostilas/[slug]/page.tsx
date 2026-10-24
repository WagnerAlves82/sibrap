import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { criarClienteSupabaseServer } from "@/lib/supabase-server";
import { CabecalhoSite, RodapeSite } from "@/components/site-chrome";
import { EMISSOR } from "@/lib/emissor";
import {
  diasAte,
  formatarDataIso,
  slugValido,
  urlCapa,
} from "@/lib/apostilas";
import { GaleriaApostila, type ImagemGaleria } from "@/components/galeria-apostila";
import { PrecoApostila } from "@/components/preco-apostila";
import { CompartilharWhatsApp } from "@/components/compartilhar-whatsapp";
import { VendaApostila, perguntasVenda, type DadosVenda } from "@/components/venda-apostila";
import { formatarPreco, listarApostilasPublicadas } from "@/lib/apostilas";
import { listarPostsVitrine, postsDaApostila } from "@/lib/blog";
import { CardPost } from "@/components/card-post";
import { slugDaBanca } from "@/lib/bancas";

type Props = { params: Promise<{ slug: string }> };

async function carregar(slug: string) {
  const supabase = await criarClienteSupabaseServer();
  if (!slugValido(slug)) return { supabase, apostila: null };
  const { data } = await supabase
    .from("apostilas")
    .select("*, produtos(preco_centavos, inclui_simulado)")
    .eq("slug", slug)
    .eq("status", "publicada")
    .maybeSingle();
  if (!data?.produtos) return { supabase, apostila: null };
  const { produtos, ...resto } = data;
  return { supabase, apostila: { ...resto, preco_centavos: produtos.preco_centavos, inclui_simulado: !!produtos.inclui_simulado } };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { apostila } = await carregar(slug);
  if (!apostila) return {};
  const capa = urlCapa(apostila.capa_path);
  const local = apostila.cidade ?? apostila.orgao;
  const ano = apostila.data_prova ? apostila.data_prova.slice(0, 4) : "2026";
  const tituloSeo = `Apostila ${local} ${ano}: ${apostila.cargo}${apostila.banca ? ` (banca ${apostila.banca})` : ""}`;
  const descricao =
    `Apostila em PDF para o concurso ${apostila.orgao}, cargo de ${apostila.cargo}${apostila.banca ? `, banca ${apostila.banca}` : ""}${apostila.data_prova ? `, prova em ${formatarDataIso(apostila.data_prova)}` : ""}. Conteúdo na ordem do edital, questões comentadas e simulado on-line.`;
  return {
    title: tituloSeo,
    description: descricao,
    alternates: { canonical: `/apostilas/${slug}` },
    openGraph: {
      url: `/apostilas/${slug}`,
      locale: "pt_BR",
      title: tituloSeo,
      description: descricao,
      type: "website",
      images: capa ? [{ url: capa }] : undefined,
    },
    twitter: { card: "summary_large_image", title: tituloSeo, description: descricao, images: capa ? [capa] : undefined },
  };
}

export default async function ApostilaPage({ params }: Props) {
  const { slug } = await params;
  const { supabase, apostila } = await carregar(slug);
  if (!apostila) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let jaTem = false;
  if (user) {
    const { data: acesso } = await supabase
      .from("acessos")
      .select("id")
      .eq("produto_id", apostila.produto_id)
      .maybeSingle();
    jaTem = !!acesso;
  }

  const [todasApostilas, todosPosts] = await Promise.all([listarApostilasPublicadas(supabase), listarPostsVitrine(supabase)]);
  const atual = todasApostilas.find((a) => a.slug === apostila.slug);
  const noticias = atual ? postsDaApostila(atual, todosPosts, 3) : [];

  const areaHref = `/minha-area/apostilas/${apostila.slug}`;
  const ctaHref = user ? areaHref : `/cadastro?next=${encodeURIComponent(areaHref)}`;
  const capa = urlCapa(apostila.capa_path);
  const prova = formatarDataIso(apostila.data_prova);
  const dias = diasAte(apostila.data_prova);
  const inscricoes = formatarDataIso(apostila.inscricoes_ate);
  const alt = `Apostila ${apostila.orgao} — ${apostila.cargo}`;
  const galeria: ImagemGaleria[] = [
    ...(apostila.imagens ?? []).flatMap((p) => {
      const url = urlCapa(p);
      return url ? [{ url, alt, mockup: true }] : [];
    }),
    ...(capa ? [{ url: capa, alt: `Capa da ${alt.toLowerCase()}`, mockup: false }] : []),
  ];
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sibrap.tec.br";

  const fatos: [string, string][] = [
    ["Órgão", apostila.orgao],
    ["Cargo", apostila.cargo],
  ];
  if (apostila.banca) fatos.push(["Banca", apostila.banca]);
  if (apostila.vagas) fatos.push(["Vagas", apostila.vagas]);
  if (apostila.salario) fatos.push(["Remuneração", apostila.salario]);
  if (inscricoes) fatos.push(["Inscrições até", inscricoes]);
  if (prova) fatos.push(["Prova", prova]);

  const inclui = [
    apostila.paginas ? `${apostila.paginas} páginas em PDF` : "Material em PDF",
    apostila.questoes
      ? `${apostila.questoes} questões com gabarito comentado`
      : "Questões com gabarito comentado",
    "Banco de provas com mais de 1.800 questões e simulado online",
    "Teoria na ordem do edital, com dicas e resumos",
    "Download liberado na sua área após a confirmação do PIX",
    "Acesso ao Ambiente Virtual de Aprendizagem: simulado online, missões e cronograma de estudos",
  ].filter((i): i is string => !!i);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `Apostila ${apostila.cargo} — ${apostila.orgao}${apostila.banca ? ` (banca ${apostila.banca})` : ""}`,
    description: apostila.descricao ?? undefined,
    url: `${siteUrl}/apostilas/${apostila.slug}`,
    sku: apostila.slug,
    mpn: apostila.slug,
    category: apostila.categoria ?? "Apostilas para concursos públicos",
    inLanguage: "pt-BR",
    image: galeria.length ? galeria.map((g) => g.url) : capa ? [capa] : undefined,
    brand: { "@type": "Brand", name: "SIBRAP" },
    manufacturer: { "@type": "Organization", name: EMISSOR.nome, url: siteUrl },
    audience: { "@type": "Audience", audienceType: `Candidatos ao cargo de ${apostila.cargo} (${apostila.orgao})` },
    additionalProperty: [
      { "@type": "PropertyValue", name: "Órgão", value: apostila.orgao },
      { "@type": "PropertyValue", name: "Cargo", value: apostila.cargo },
      ...(apostila.banca ? [{ "@type": "PropertyValue", name: "Banca", value: apostila.banca }] : []),
      ...(apostila.data_prova ? [{ "@type": "PropertyValue", name: "Data da prova", value: apostila.data_prova }] : []),
      ...(apostila.inscricoes_ate ? [{ "@type": "PropertyValue", name: "Inscrições até", value: apostila.inscricoes_ate }] : []),
      ...(apostila.vagas ? [{ "@type": "PropertyValue", name: "Vagas", value: apostila.vagas }] : []),
      ...(apostila.salario ? [{ "@type": "PropertyValue", name: "Remuneração", value: apostila.salario }] : []),
      ...(apostila.paginas ? [{ "@type": "PropertyValue", name: "Páginas", value: String(apostila.paginas) }] : []),
      ...(apostila.questoes ? [{ "@type": "PropertyValue", name: "Questões comentadas", value: String(apostila.questoes) }] : []),
      { "@type": "PropertyValue", name: "Formato", value: "PDF, com capítulos online e simulado" },
    ],
    offers: {
      "@type": "Offer",
      url: `${siteUrl}/apostilas/${apostila.slug}`,
      priceCurrency: "BRL",
      price: (apostila.preco_centavos / 100).toFixed(2),
      availability: "https://schema.org/InStock",
      priceValidUntil: apostila.data_prova ?? undefined,
      itemCondition: "https://schema.org/NewCondition",
      description: `Apostila em PDF mais simulado online${apostila.questoes ? ` com ${apostila.questoes} questões comentadas` : ""} para treinar até a data da prova, no mesmo preço.`,
      seller: { "@type": "Organization", name: EMISSOR.nome },
    },
  };

  const venda: DadosVenda = {
    cargo: apostila.cargo,
    orgao: apostila.orgao,
    cidade: apostila.cidade ?? null,
    banca: apostila.banca ?? null,
    prova,
    dias,
    paginas: apostila.paginas ?? null,
    questoes: apostila.questoes ?? null,
    simulados: apostila.simulados ?? null,
    incluiSimulado: apostila.inclui_simulado,
    imagem: galeria[0]?.url ?? null,
    precoOriginalCentavos: apostila.preco_original_centavos ?? null,
    precoCentavos: apostila.preco_centavos,
    jaTem,
    ctaHref: jaTem ? `${areaHref}/baixar` : ctaHref,
    ctaRotulo: jaTem ? "Baixar minha apostila" : "Quero minha aprovação",
  };
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Início", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Apostilas", item: `${siteUrl}/apostilas` },
      { "@type": "ListItem", position: 3, name: apostila.cargo, item: `${siteUrl}/apostilas/${apostila.slug}` },
    ],
  };
  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: perguntasVenda(venda).map(([q, a]) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };

  return (
    <div className="flex min-h-screen flex-col overflow-x-clip bg-white pb-16 font-body md:pb-0">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <CabecalhoSite logado={!!user} next={areaHref} />

      <main className="flex-1 bg-[#F6F8FB] py-10 sm:py-14">
        <div className="mx-auto grid max-w-[1080px] gap-8 px-4 sm:px-6 md:grid-cols-2 md:gap-10 lg:gap-14">
          <div className="relative mx-auto w-full max-w-[375px] md:max-w-none">
            <GaleriaApostila imagens={galeria} />
            <div
              aria-hidden
              className="pointer-events-none absolute -right-3 -top-3 z-10 flex h-24 w-24 rotate-[-9deg] flex-col items-center justify-center gap-0.5 rounded-full border-[3px] border-dashed border-white/85 bg-accent text-center shadow-[0_16px_30px_-10px_rgba(185,134,42,0.6)] sm:h-28 sm:w-28"
            >
              <span className="font-display text-[11px] font-extrabold leading-tight text-accent-ink sm:text-[12.5px]">
                Simulado
                <br />
                online
              </span>
              <span className="mt-1 font-data text-[8px] font-bold uppercase leading-tight text-accent-ink sm:text-[9px]">
                centenas de
                <br />
                questões
              </span>
            </div>
          </div>

          <div>
            <nav aria-label="Você está em" className="mb-3 text-[13px] text-[#516278]">
              <Link href="/apostilas" className="hover:text-brand">
                Apostilas
              </Link>
              <span className="mx-1.5 opacity-50">/</span>
              {apostila.uf}
              {apostila.cidade ? ` · ${apostila.cidade}` : ""}
              {apostila.banca && (
                <>
                  <span className="mx-1.5 opacity-50">·</span>
                  <Link href={`/bancas/${slugDaBanca(apostila.banca)}`} className="hover:text-brand">
                    Banca {apostila.banca}
                  </Link>
                </>
              )}
            </nav>

            <h1 className="font-display text-[1.9rem] leading-[1.08] font-extrabold text-balance text-[#14213A] sm:text-[2.5rem]">
              {apostila.titulo}
            </h1>
            {apostila.descricao && (
              <p className="mt-3 max-w-[64ch] text-[15px] leading-relaxed text-[#516278]">{apostila.descricao}</p>
            )}

            {apostila.selos?.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-2">
                {apostila.selos.map((selo) => (
                  <li
                    key={selo}
                    className="rounded-full border border-[#D7DEE6] bg-white px-3 py-1 text-[12.5px] font-semibold text-brand"
                  >
                    {selo}
                  </li>
                ))}
              </ul>
            )}

            {dias !== null && dias >= 0 && (
              <p className="mt-4 inline-block rounded-lg bg-accent px-3 py-2 font-data text-[13px] font-bold text-accent-ink">
                ⏳{" "}
                {dias === 0
                  ? "A prova é hoje"
                  : dias === 1
                    ? "Falta 1 dia para a prova"
                    : `Faltam ${dias} dias para a prova`}
              </p>
            )}

            <div className="mt-5 rounded-xl border-2 border-accent bg-white p-5 shadow-[0_24px_50px_-28px_rgba(11,42,74,0.45)]">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <PrecoApostila
                    centavos={apostila.preco_centavos}
                    original={apostila.preco_original_centavos}
                    tamanho="grande"
                  />
                  <p className="mt-1 text-[13px] text-[#516278]">Pagamento único · sem mensalidade</p>
                  <CompartilharWhatsApp
                    className="mt-2"
                    url={`${siteUrl}/apostilas/${apostila.slug}`}
                    texto={`📘 Apostila ${apostila.cargo} — ${apostila.orgao}${apostila.banca ? ` (banca ${apostila.banca})` : ""}, ${formatarPreco(apostila.preco_centavos)} no PIX, com simulado online incluso:`}
                  />
                </div>
                <Link
                  href={jaTem ? `${areaHref}/baixar` : ctaHref}
                  prefetch={false}
                  className="btn-pulso brilho inline-flex items-center gap-2 rounded-lg bg-accent px-7 py-4 text-[16px] font-extrabold text-accent-ink"
                >
                  {jaTem ? "Baixar minha apostila" : "Quero minha aprovação"} <span aria-hidden>→</span>
                </Link>
              </div>
              <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] font-semibold text-[#33465E]">
                <span>⚡ Acesso imediato no PIX</span>
                <span>✓ 7 dias de garantia</span>
                <span>✓ Simulado online incluído</span>
              </p>
              {!user && (
                <p className="mt-2 text-[12.5px] text-[#516278]">
                  Você cria a conta em menos de um minuto e paga na sequência.
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-8 md:col-span-2 md:grid-cols-2 md:gap-10 lg:gap-14">
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
              <h2 className="font-display text-xl font-extrabold text-[#14213A]">O que vem na apostila</h2>
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
        </div>
      </main>
      <VendaApostila d={venda} />
      {noticias.length > 0 && (
        <section className="border-t border-[#D7DEE6] bg-[#F6F8FB] py-12 sm:py-14">
          <div className="mx-auto max-w-[1080px] px-4 sm:px-6">
            <h2 className="font-display text-[1.4rem] font-extrabold text-[#14213A] sm:text-[1.8rem]">
              Notícias do concurso: {apostila.cidade ?? apostila.orgao}
            </h2>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
              {noticias.map((p) => (
                <CardPost key={p.id} post={p} />
              ))}
            </div>
          </div>
        </section>
      )}
      {!jaTem && (
        <div className="fixed inset-x-0 bottom-0 z-40 overflow-hidden border-t border-[#D7DEE6] bg-white/95 px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur md:hidden">
          <div className="mx-auto flex max-w-[400px] items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-display text-[1rem] font-extrabold leading-none text-[#14213A]">{formatarPreco(apostila.preco_centavos)}</p>
              <p className="mt-0.5 truncate text-[10.5px] text-[#516278]">PIX · acesso imediato</p>
            </div>
            <Link href={ctaHref} prefetch={false} className="btn-pulso-suave shrink-0 whitespace-nowrap rounded-md bg-accent px-3 py-1.5 text-[12px] font-extrabold text-accent-ink">
              Quero minha aprovação →
            </Link>
          </div>
        </div>
      )}
      <RodapeSite />
    </div>
  );
}
