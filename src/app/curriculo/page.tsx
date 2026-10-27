import type { Metadata } from "next";
import { Suspense } from "react";
import { criarClienteSupabaseServer } from "@/lib/supabase-server";
import { CabecalhoSite, RodapeSite } from "@/components/site-chrome";
import { BlocoAnuncio, ScriptAdsense } from "@/components/adsense";
import { blocoAdsense, clienteAdsense } from "@/lib/adsense";
import { VISITAS_MINIMAS_PARA_EXIBIR } from "@/lib/visitas";
import { LIMITE_GRATIS, precoDownload } from "@/lib/curriculo/servidor";
import { Gerador, type CurriculoSalvo } from "./Gerador";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sibrap.tec.br";
const titulo = "Gerador de currículo grátis: modelo pronto em PDF";
const descricao =
  "Monte seu currículo em minutos, passo a passo, com modelos para Jovem Aprendiz, primeiro emprego e nível médio. Prévia na hora e download em PDF pronto para enviar às empresas.";

export const metadata: Metadata = {
  title: titulo,
  description: descricao,
  keywords: ["gerador de currículo", "currículo grátis", "modelo de currículo", "currículo jovem aprendiz", "currículo primeiro emprego", "currículo em PDF"],
  alternates: { canonical: "/curriculo" },
  openGraph: { title: titulo, description: descricao, url: `${SITE}/curriculo`, type: "website", locale: "pt_BR" },
};

const PERGUNTAS: [string, string][] = [
  ["Quanto custa o gerador de currículo?", "Montar o currículo e ver a prévia é sempre grátis. Para baixar o PDF é preciso uma conta grátis; quando houver cobrança pelo download, o valor aparece no topo da página antes de você começar."],
  ["Preciso ter experiência para fazer o currículo?", "Não. O modelo Jovem Aprendiz e Primeiro Emprego valoriza escolaridade, cursos, habilidades e atividades como projetos da escola e voluntariado."],
  ["Devo colocar foto no currículo?", "Só se a vaga pedir. Muitas empresas preferem currículo sem foto. Aqui a foto é opcional, fica só no seu aparelho e é reduzida automaticamente."],
  ["Meus dados ficam guardados?", "O texto do currículo fica salvo na sua conta para você editar depois, e você pode excluir quando quiser. A foto nunca é enviada para guardar."],
];

export default async function CurriculoPage() {
  const supabase = await criarClienteSupabaseServer();
  const [{ data: userData }, { data: total }] = await Promise.all([supabase.auth.getUser(), supabase.rpc("total_curriculos_gerados")]);
  const user = userData.user;

  let salvo: CurriculoSalvo = null;
  if (user) {
    const { data } = await supabase
      .from("curriculos")
      .select("id, perfil, modelo, dados")
      .order("atualizado_em", { ascending: false })
      .limit(1)
      .maybeSingle();
    salvo = data;
  }

  const gerados = Number(total ?? 0);
  // a partir de 1.000 currículos gerados, cada download é pago (o preço aparece já no topo)
  const precoCentavos = gerados >= LIMITE_GRATIS ? await precoDownload() : null;
  const adsense = clienteAdsense();
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "Gerador de Currículos SIBRAP",
      url: `${SITE}/curriculo`,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      inLanguage: "pt-BR",
      offers: { "@type": "Offer", price: "0", priceCurrency: "BRL" },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: PERGUNTAS.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-surface-2 font-body">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <CabecalhoSite logado={!!user} next="/curriculo" />
      <main className="mx-auto w-full max-w-[1180px] flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <header className="mb-8 max-w-[70ch]">
          <p className="font-data text-xs font-semibold uppercase tracking-[0.2em] text-accent-2">Gerador de currículo{precoCentavos === null ? " · grátis" : ""}</p>
          <h1 className="mt-2 font-display text-3xl font-extrabold text-[#14213A] sm:text-4xl">Seu currículo pronto em alguns cliques.</h1>
          <p className="mt-3 text-[16px] leading-relaxed text-[#516278]">
            Responda algumas perguntas, veja o resultado na hora e baixe em PDF. Feito para quem busca o primeiro emprego ou já tem experiência.
          </p>
          {precoCentavos !== null && (
            <p className="mt-3 text-[14px] font-semibold text-[#14213A]">
              Montar e ver a prévia é grátis. O download do PDF custa {(precoCentavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} no PIX.
            </p>
          )}
          {gerados >= VISITAS_MINIMAS_PARA_EXIBIR && (
            <p className="mt-3 inline-flex border border-[#D7DEE6] bg-white px-3 py-1.5 font-data text-xs font-semibold text-[#516278]">
              {gerados.toLocaleString("pt-BR")} currículos gerados
            </p>
          )}
        </header>

        <Suspense fallback={<div className="min-h-[60vh]" />}>
          <Gerador logado={!!user} emailConta={user?.email ?? null} salvo={salvo} precoCentavos={precoCentavos} />
        </Suspense>

        <BlocoAnuncio cliente={adsense} slot={blocoAdsense("CURRICULO")} className="mt-12" />
        <ScriptAdsense cliente={adsense} />

        <section className="mt-14 max-w-[70ch]">
          <h2 className="font-display text-2xl font-extrabold text-[#14213A]">Perguntas frequentes</h2>
          <div className="mt-4 flex flex-col gap-3">
            {PERGUNTAS.map(([q, a]) => (
              <details key={q} className="border border-[#D7DEE6] bg-white p-4">
                <summary className="cursor-pointer font-semibold text-[#14213A]">{q}</summary>
                <p className="mt-2 text-[15px] leading-relaxed text-[#516278]">{a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>
      <RodapeSite />
    </div>
  );
}
