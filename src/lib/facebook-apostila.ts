// src/lib/facebook-apostila.ts
//
// Texto e hashtags do post de divulgação de uma APOSTILA na Página do Facebook.
// O rodízio (a cada 3 matérias, 1 apostila) fica em /api/social/facebook.

import { formatarDataIso, formatarPreco, type ApostilaVitrine } from "@/lib/apostilas";

const soLetras = (s: string) => s.replace(/[^\p{L}\p{N}]/gu, "");

export function hashtagsApostila(a: Pick<ApostilaVitrine, "cidade" | "uf" | "categoria" | "banca">): string {
  const cidade = soLetras(a.cidade ?? "");
  const tags = [
    cidade ? `#Apostila${cidade}` : null,
    cidade ? `#Concurso${cidade}` : null,
    a.uf ? `#Concurso${a.uf}` : null,
    a.categoria === "Educação" ? "#ConcursoEducação" : null,
    "#Concurso2026",
    "#ApostilaConcurso",
    "#ApostilaPDF",
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
