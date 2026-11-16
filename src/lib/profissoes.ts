import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { capaExternaValida, urlCapa } from "@/lib/blog";

// Canal "Profissões": guias diários sobre uma profissão (o que faz, quanto ganha, o que diz a lei, como começar),
// com oferta discreta do curso ligado. Tabela própria: public.guias_profissoes.
export type GuiaProfissao = Database["public"]["Tables"]["guias_profissoes"]["Row"];
export type PerguntaGuia = { pergunta: string; resposta: string };

export const COLUNAS_GUIA_LISTA = "id,slug,titulo,profissao,area,resumo,capa_path,capa_url,publicado_em,atualizado_em";
export type GuiaLista = Pick<
  GuiaProfissao,
  "id" | "slug" | "titulo" | "profissao" | "area" | "resumo" | "capa_path" | "capa_url" | "publicado_em" | "atualizado_em"
>;

export async function listarGuias(supabase: SupabaseClient<Database>, limite = 200): Promise<GuiaLista[]> {
  const { data } = await supabase
    .from("guias_profissoes")
    .select(COLUNAS_GUIA_LISTA)
    .eq("status", "publicada")
    .order("publicado_em", { ascending: false })
    .limit(limite);
  return data ?? [];
}

export function capaDoGuia(g: Pick<GuiaProfissao, "capa_url" | "capa_path">): string | null {
  if (capaExternaValida(g.capa_url)) return g.capa_url;
  // foto do próprio site (ex.: /cursos/formacao-eletricista/card-eletricista.webp)
  if (g.capa_path?.startsWith("/")) return g.capa_path;
  return urlCapa(g.capa_path);
}

export function perguntasDoGuia(g: Pick<GuiaProfissao, "faq">): PerguntaGuia[] {
  if (!Array.isArray(g.faq)) return [];
  return g.faq.flatMap((x) => {
    if (x && typeof x === "object" && !Array.isArray(x) && typeof x.pergunta === "string" && typeof x.resposta === "string") {
      return [{ pergunta: x.pergunta, resposta: x.resposta }];
    }
    return [];
  });
}
