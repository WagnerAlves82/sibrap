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
  formatarPreco,
  slugValido,
  urlCapa,
} from "@/lib/apostilas";

type Props = { params: Promise<{ slug: string }> };

async function carregar(slug: string) {
  const supabase = await criarClienteSupabaseServer();
  if (!slugValido(slug)) return { supabase, apostila: null };
  const { data } = await supabase
    .from("apostilas")
    .select("*, produtos(preco_centavos)")
    .eq("slug", slug)
    .eq("status", "publicada")
    .maybeSingle();
  if (!data?.produtos) return { supabase, apostila: null };
  const { produtos, ...resto } = data;
  return { supabase, apostila: { ...resto, preco_centavos: produtos.preco_centavos } };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { apostila } = await carregar(slug);
  if (!apostila) return {};
  const capa = urlCapa(apostila.capa_path);
  const descricao =
    apostila.descricao ??
    `Apostila em PDF para ${apostila.cargo} — ${apostila.orgao}${apostila.banca ? ` (banca ${apostila.banca})` : ""}, com questões e gabarito comentado.`;
  return {
    title: apostila.titulo,
    description: descricao,
    openGraph: {
      title: apostila.titulo,
      description: descricao,
      type: "website",
      images: capa ? [{ url: capa }] : undefined,
    },
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

  const areaHref = `/minha-area/apostilas/${apostila.slug}`;
  const ctaHref = user ? areaHref : `/cadastro?next=${encodeURIComponent(areaHref)}`;
  const capa = urlCapa(apostila.capa_path);
  const prova = formatarDataIso(apostila.data_prova);
  const dias = diasAte(apostila.data_prova);
  const inscricoes = formatarDataIso(apostila.inscricoes_ate);
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
    apostila.simulados ? `${apostila.simulados} simulados finais` : null,
    "Teoria na ordem do edital, com dicas e resumos",
    "Download liberado na sua área após a confirmação do PIX",
  ].filter((i): i is string => !!i);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: apostila.titulo,
    description: apostila.descricao ?? undefined,
    image: capa ?? undefined,
    brand: { "@type": "Brand", name: "SIBRAP" },
    offers: {
      "@type": "Offer",
      url: `${siteUrl}/apostilas/${apostila.slug}`,
      priceCurrency: "BRL",
      price: (apostila.preco_centavos / 100).toFixed(2),
      availability: "https://schema.org/InStock",
      seller: { "@type": "Organization", name: EMISSOR.nome },
    },
  };

  return (
    <div className="flex min-h-screen flex-col bg-white font-body">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <CabecalhoSite logado={!!user} />

      <main className="flex-1 bg-[#F6F8FB] py-10 sm:py-14">
        <div className="mx-auto grid max-w-[1080px] gap-8 px-4 sm:px-6 md:grid-cols-[minmax(0,340px)_minmax(0,1fr)] md:gap-12">
          <div className="mx-auto w-full max-w-[300px] md:max-w-none">
            <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl border border-[#D7DEE6] bg-surface-2 shadow-[0_24px_50px_-24px_rgba(11,42,74,0.45)]">
              {capa && (
                <Image
                  src={capa}
                  alt={`Capa da apostila ${apostila.orgao} — ${apostila.cargo}`}
                  fill
                  priority
                  sizes="(min-width: 768px) 340px, 300px"
                  className="object-cover"
                />
              )}
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
            </nav>

            <h1 className="font-display text-[1.9rem] leading-[1.08] font-extrabold text-balance text-[#14213A] sm:text-[2.5rem]">
              {apostila.titulo}
            </h1>
            {apostila.descricao && (
              <p className="mt-3 max-w-[60ch] text-[16px] leading-relaxed text-[#516278]">
                {apostila.descricao}
              </p>
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

            <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-[10px] border border-[#D7DEE6] bg-[#D7DEE6]">
              {fatos.map(([rotulo, valor]) => (
                <div key={rotulo} className="bg-white px-4 py-3">
                  <dt className="text-[11.5px] uppercase tracking-wide text-[#516278]">{rotulo}</dt>
                  <dd className="font-data text-[14px] font-semibold text-[#14213A]">{valor}</dd>
                </div>
              ))}
            </dl>

            <h2 className="mt-8 font-display text-xl font-extrabold text-[#14213A]">
              O que vem na apostila
            </h2>
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

            <div className="mt-8 rounded-xl border border-[#D7DEE6] bg-white p-5">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="font-data text-3xl font-semibold text-[#14213A]">
                    {formatarPreco(apostila.preco_centavos)}
                  </p>
                  <p className="text-[13px] text-[#516278]">Pagamento único por PIX · sem mensalidade</p>
                </div>
                <Link
                  href={jaTem ? `${areaHref}/baixar` : ctaHref}
                  prefetch={false}
                  className="inline-flex items-center gap-2 rounded-lg bg-accent px-7 py-3.5 text-[15px] font-bold text-accent-ink shadow-[0_20px_45px_-20px_rgba(11,42,74,0.35)] transition-colors hover:brightness-105"
                >
                  {jaTem ? "Baixar minha apostila" : "Comprar agora"} <span aria-hidden>→</span>
                </Link>
              </div>
              {!user && (
                <p className="mt-3 text-[12.5px] text-[#516278]">
                  Você cria a conta em menos de um minuto e paga na sequência.
                </p>
              )}
            </div>

            <p className="mt-5 max-w-[62ch] text-[12.5px] leading-relaxed text-[#516278]">
              Material de estudo independente, sem vínculo com a banca ou com a
              prefeitura. O edital oficial sempre prevalece sobre qualquer
              conteúdo da apostila. Vendido por {EMISSOR.nome}, CNPJ {EMISSOR.cnpj}.
            </p>
          </div>
        </div>
      </main>
      <RodapeSite />
    </div>
  );
}
