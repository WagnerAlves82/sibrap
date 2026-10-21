import { slugValido } from "@/lib/apostilas";

// Combos à venda: apostila + videoaulas. O slug do combo é o mesmo da apostila
// (o produto no banco é "combo-<slug>", ver supabase/migrations/20261021180000).
export type Combo = {
  slug: string;
  uf: string;
  precoPadraoCentavos: number;
  videoaulas: string[];
};

export const COMBOS: Record<string, Combo> = {
  "sesa-ap-tecnico-enfermagem": {
    slug: "sesa-ap-tecnico-enfermagem",
    uf: "AP",
    precoPadraoCentavos: 5490,
    videoaulas: ["Informática", "Legislação do SUS"],
  },
};

export function comboPorSlug(slug: string): Combo | null {
  return slugValido(slug) ? (COMBOS[slug] ?? null) : null;
}
