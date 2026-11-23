import type { Metadata } from "next";
import { PaginaApostilas } from "@/components/pagina-apostilas";

// Página igual para todos os visitantes: a Vercel guarda em cache e refaz no máximo a cada 1 h
// (gasta CPU só nessa hora, não a cada visita). Nada de cookies aqui — ver src/lib/supabase-publico.ts.
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Apostilas para concursos públicos",
  alternates: { canonical: "/apostilas" },
  description:
    "Apostilas em PDF por estado, montadas a partir do edital, com questões e gabarito comentado. Pagamento único.",
};

export default function ApostilasPage() {
  return <PaginaApostilas />;
}
