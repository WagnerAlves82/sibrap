import type { ApostilaVitrine } from "@/lib/apostilas";

/** Slug da banca para a URL (ex.: "Fundação UNIVALI" -> "fundacao-univali"). */
export function slugDaBanca(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export type BancaResumo = { nome: string; slug: string; apostilas: number };

/** Bancas que têm ao menos uma apostila publicada, em ordem alfabética. */
export function bancasDasApostilas(apostilas: ApostilaVitrine[]): BancaResumo[] {
  const mapa = new Map<string, BancaResumo>();
  for (const a of apostilas) {
    if (!a.banca) continue;
    const slug = slugDaBanca(a.banca);
    const atual = mapa.get(slug);
    if (atual) atual.apostilas += 1;
    else mapa.set(slug, { nome: a.banca, slug, apostilas: 1 });
  }
  return [...mapa.values()].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}
