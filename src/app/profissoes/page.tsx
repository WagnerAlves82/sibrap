import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CabecalhoSite, RodapeSite } from "@/components/site-chrome";
import { criarClienteSupabasePublico } from "@/lib/supabase-publico";
import { capaDoGuia, listarGuias } from "@/lib/profissoes";

export const revalidate = 3600;

const DESCRICAO =
  "Guias de profissões: o que faz, quanto ganha, o que diz a lei e como começar. Eletricista, auxiliar administrativo, informática e outras áreas.";

export const metadata: Metadata = {
  title: "Profissões: o que faz, quanto ganha e como começar",
  description: DESCRICAO,
  alternates: { canonical: "/profissoes" },
  openGraph: {
    title: "Profissões: o que faz, quanto ganha e como começar | SIBRAP",
    description: DESCRICAO,
    url: "/profissoes",
    type: "website",
    locale: "pt_BR",
    images: ["/opengraph-image"],
  },
};

export default async function ProfissoesPage() {
  const guias = await listarGuias(criarClienteSupabasePublico());
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.sibrap.tec.br";
  const lista = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Guias de profissões",
    itemListElement: guias.map((g, i) => ({ "@type": "ListItem", position: i + 1, url: `${siteUrl}/profissoes/${g.slug}`, name: g.titulo })),
  };
  return (
    <div className="flex min-h-screen flex-col bg-white font-body">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(lista) }} />
      <CabecalhoSite />
      <main className="flex-1 py-12 sm:py-14">
        <div className="mx-auto max-w-[1180px] px-4 sm:px-6">
          <p className="font-data text-xs font-semibold uppercase tracking-[0.2em] text-accent-2">Profissões</p>
          <h1 className="mt-2 font-display text-[2rem] font-extrabold text-[#14213A] sm:text-[2.6rem]">O que faz, quanto ganha e como começar.</h1>
          <p className="mt-2 mb-8 max-w-[60ch] text-[15.5px] leading-relaxed text-[#516278]">
            Um guia por profissão, com o que diz a lei e o caminho para entrar na área.
          </p>
          {guias.length === 0 ? (
            <p className="text-[#516278]">Os primeiros guias estão a caminho.</p>
          ) : (
            <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {guias.map((g) => {
                const capa = capaDoGuia(g);
                return (
                  <li key={g.id}>
                    <Link
                      href={`/profissoes/${g.slug}`}
                      className="group flex h-full flex-col border border-[#D7DEE6] bg-white transition-shadow hover:shadow-[0_16px_36px_-22px_rgba(11,42,74,0.35)]"
                    >
                      <span className="relative block aspect-[16/9] w-full overflow-hidden bg-surface-2">
                        {capa && (
                          <Image
                            src={capa}
                            alt=""
                            fill
                            sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw"
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        )}
                      </span>
                      <span className="flex flex-1 flex-col p-4">
                        <span className="font-data text-[11px] font-semibold uppercase tracking-wide text-accent-2">{g.area}</span>
                        <span className="mt-1 font-display text-[17px] font-extrabold leading-snug text-[#14213A]">{g.titulo}</span>
                        <span className="mt-1.5 line-clamp-3 text-[14px] leading-relaxed text-[#516278]">{g.resumo}</span>
                        <span className="mt-3 self-end text-[13.5px] font-bold text-brand">Ler o guia →</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>
      <RodapeSite />
    </div>
  );
}
