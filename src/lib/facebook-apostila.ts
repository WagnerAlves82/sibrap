// src/lib/facebook-apostila.ts
//
// Texto e hashtags do post de divulgação de uma APOSTILA na Página do Facebook.
// O rodízio (a cada 3 matérias, 1 apostila) fica em /api/social/facebook.

import { formatarDataIso, formatarPreco, type ApostilaVitrine } from "@/lib/apostilas";

const soLetras = (s: string) => s.replace(/[^\p{L}\p{N}]/gu, "");

// Nome do estado em hashtag (sem acento), para alcançar quem busca pelo estado.
const ESTADO_TAG: Record<string, string> = {
  AC: "Acre", AL: "Alagoas", AP: "Amapá", AM: "Amazonas", BA: "Bahia", CE: "Ceará", DF: "DistritoFederal",
  ES: "EspíritoSanto", GO: "Goiás", MA: "Maranhão", MT: "MatoGrosso", MS: "MatoGrossoDoSul", MG: "MinasGerais",
  PA: "Pará", PB: "Paraíba", PR: "Paraná", PE: "Pernambuco", PI: "Piauí", RJ: "RioDeJaneiro",
  RN: "RioGrandeDoNorte", RS: "RioGrandeDoSul", RO: "Rondônia", RR: "Roraima", SC: "SantaCatarina",
  SP: "SãoPaulo", SE: "Sergipe", TO: "Tocantins",
};

// Primeiro as hashtags da localidade (cidade, estado), depois as do tema.
export function hashtagsApostila(a: Pick<ApostilaVitrine, "cidade" | "uf" | "categoria" | "banca">): string {
  const cidade = soLetras(a.cidade ?? "");
  const estado = a.uf ? ESTADO_TAG[a.uf] : undefined;
  const tags = [
    cidade ? `#Apostila${cidade}` : null,
    cidade ? `#Concurso${cidade}` : null,
    estado ? `#${estado}` : null,
    a.uf ? `#Concurso${a.uf}` : null,
    a.categoria === "Educação" ? "#ConcursoEducação" : null,
    "#Concurso2026",
    "#ApostilaConcurso",
    "#SIBRAP",
  ];
  return [...new Set(tags.filter((t): t is string => !!t))].slice(0, 8).join(" ");
}

export function montarTextoApostila(
  a: ApostilaVitrine,
  links: { apostila: string; materia: string | null },
  hoje = new Date()
): string {
  const local = [a.cidade, a.uf].filter(Boolean).join(" (") + (a.cidade && a.uf ? ")" : "");
  const titulo = `Apostila ${a.cargo ?? a.titulo} — ${local}`.trim();

  const partes: string[] = [];
  if (a.paginas) partes.push(`${a.paginas} páginas`);
  if (a.questoes) partes.push(`${a.questoes} questões comentadas`);
  if (a.simulados) partes.push(`${a.simulados} simulado(s)`);
  const conteudo = partes.length
    ? `Material completo em PDF feito a partir do edital: ${partes.join(", ")}.`
    : "Material completo em PDF feito a partir do edital.";

  const agora = hoje.toISOString().slice(0, 10);
  const inscricoes =
    a.inscricoes_ate && a.inscricoes_ate >= agora ? `⏰ Inscrições até ${formatarDataIso(a.inscricoes_ate)}.` : null;
  const prova = a.data_prova && a.data_prova >= agora ? `📝 Prova em ${formatarDataIso(a.data_prova)}.` : null;

  const preco =
    a.preco_original_centavos && a.preco_original_centavos > a.preco_centavos
      ? `💰 De ${formatarPreco(a.preco_original_centavos)} por ${formatarPreco(a.preco_centavos)} (PIX).`
      : `💰 ${formatarPreco(a.preco_centavos)} no PIX.`;

  return [
    `📘 ${titulo}`,
    conteudo,
    [inscricoes, prova].filter(Boolean).join(" ") || null,
    preco,
    `👉 Garanta a sua: ${links.apostila}`,
    links.materia ? `📰 Entenda o concurso: ${links.materia}` : null,
    hashtagsApostila(a),
  ]
    .filter((p): p is string => !!p)
    .join("\n\n");
}
