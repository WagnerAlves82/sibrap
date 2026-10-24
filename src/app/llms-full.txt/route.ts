import { perguntasVenda } from "@/components/venda-apostila";
import { SITE_URL, blocoCombos, blocoSobre, carregarCatalogo, fatosDe, localDe } from "@/lib/llms";

// Versão completa do llms.txt: um bloco por apostila (fatos, descrição e
// perguntas frequentes), cursos e combos, tudo em texto puro.
export const revalidate = 3600;

export async function GET() {
  const linhas: string[] = ["# SIBRAP — catálogo completo", "", ...blocoSobre(), ""];

  try {
    const { apostilas, cursos } = await carregarCatalogo();

    linhas.push("## Apostilas", "");
    for (const a of apostilas) {
      const local = localDe(a);
      linhas.push(`### Apostila ${a.cargo} — ${a.orgao}${local ? ` (${local})` : ""}`);
      linhas.push(`URL: ${SITE_URL}/apostilas/${a.slug}`);
      linhas.push(`Dados: ${fatosDe(a)}.`);
      if (a.descricao) linhas.push("", a.descricao);
      linhas.push("", "Perguntas frequentes:");
      const faq = perguntasVenda({
        cargo: a.cargo,
        orgao: a.orgao,
        cidade: a.cidade,
        banca: a.banca,
        prova: null,
        dias: null,
        paginas: a.paginas,
        questoes: a.questoes,
        simulados: a.simulados,
        incluiSimulado: true,
        imagem: null,
        precoOriginalCentavos: null,
        precoCentavos: a.preco_centavos ?? 0,
        jaTem: false,
        ctaHref: "",
        ctaRotulo: "",
      });
      for (const [q, r] of faq) linhas.push(`- ${q} ${r}`);
      linhas.push("");
    }

    const combos = blocoCombos(apostilas);
    if (combos.length > 0) linhas.push("## Combos", "", ...combos, "");

    linhas.push("## Cursos gratuitos", "");
    for (const c of cursos) {
      linhas.push(`### ${c.nome}`);
      linhas.push(`URL: ${SITE_URL}/cursos/${c.slug}`);
      linhas.push(`Dados: gratuito; ${c.carga_horaria_horas ? `${c.carga_horaria_horas} horas; ` : ""}100% online; certificado com QR Code de validação em ${SITE_URL}/validar.`);
      if (c.descricao) linhas.push("", c.descricao);
      linhas.push("");
    }
  } catch {
    linhas.push("Catálogo indisponível no momento.");
  }

  return new Response(linhas.join("\n") + "\n", {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
