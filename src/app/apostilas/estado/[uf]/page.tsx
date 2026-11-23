import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PaginaApostilas } from "@/components/pagina-apostilas";
import { UFS } from "@/lib/apostilas";
import { UF_NOMES } from "@/lib/busca";

// Uma página por estado (/apostilas/estado/sc), em cache como /apostilas. "br" = concursos nacionais.
export const revalidate = 3600;

function ufValida(bruto: string): string | null {
  const uf = bruto.toUpperCase();
  return uf === "BR" || (UFS as readonly string[]).includes(uf) ? uf : null;
}

export async function generateMetadata({ params }: { params: Promise<{ uf: string }> }): Promise<Metadata> {
  const uf = ufValida((await params).uf);
  if (!uf) return {};
  const onde = uf === "BR" ? "nacionais" : `em ${UF_NOMES[uf]}`;
  return {
    title: uf === "BR" ? "Apostilas para concursos nacionais" : `Apostilas para concursos ${onde} (${uf})`,
    alternates: { canonical: `/apostilas/estado/${uf.toLowerCase()}` },
    description: `Apostilas em PDF para concursos ${onde}: conteúdo do edital, questões comentadas e pagamento único.`,
  };
}

export default async function ApostilasDoEstado({ params }: { params: Promise<{ uf: string }> }) {
  const bruto = (await params).uf;
  const uf = ufValida(bruto);
  if (!uf) notFound();
  return <PaginaApostilas uf={uf} />;
}
