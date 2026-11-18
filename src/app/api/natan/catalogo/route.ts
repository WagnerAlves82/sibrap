// Catálogo do Natan para o funil de botões (plano B quando a IA não responde). Sem cookies; cache de 1 hora.
import { catalogoNatan } from "@/lib/natan-catalogo";

export const revalidate = 3600;

export async function GET() {
  return Response.json(await catalogoNatan(), { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } });
}
