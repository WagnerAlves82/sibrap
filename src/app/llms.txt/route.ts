import { SITE_URL, blocoCombos, blocoSobre, carregarCatalogo, linhaApostila } from "@/lib/llms";

// llms.txt (llmstxt.org): resumo do site pensado pra assistentes de IA
// lerem. Gerado dinamicamente a partir do banco, no mesmo espírito do
// sitemap.ts. A versão completa (com perguntas e respostas) fica em
// /llms-full.txt.
export const revalidate = 3600;

export async function GET() {
  const linhas: string[] = [];

  linhas.push("# SIBRAP — Sistema Brasileiro de Aprendizagem Profissional");
  linhas.push("");
  linhas.push(
    "> Apostilas em PDF para concursos públicos de todo o Brasil (municipais e estaduais), com questões comentadas, gabarito e simulado online, e cursos livres gratuitos com certificado validável por QR Code."
  );
  linhas.push("");
  for (const l of blocoSobre()) linhas.push(l, "");

  linhas.push("## Páginas principais");
  linhas.push(`- [Página inicial](${SITE_URL}): apresentação do SIBRAP e vitrine das apostilas.`);
  linhas.push(`- [Apostilas](${SITE_URL}/apostilas): catálogo completo de apostilas para concursos públicos.`);
  linhas.push(`- [Bancas](${SITE_URL}/bancas): apostilas organizadas por banca organizadora.`);
  linhas.push(`- [Cursos gratuitos](${SITE_URL}/cursos): cursos livres com certificado, sem custo.`);
  linhas.push(`- [Notícias](${SITE_URL}/noticias): notícias sobre concursos públicos (vagas efetivas) e processos seletivos (contratações temporárias).`);
  linhas.push(`- [Versão completa deste resumo](${SITE_URL}/llms-full.txt): todas as apostilas, cursos e perguntas frequentes em um só arquivo.`);
  linhas.push("");

  try {
    const { apostilas, cursos } = await carregarCatalogo();
    if (apostilas.length > 0) {
      linhas.push("## Apostilas publicadas");
      for (const a of apostilas) linhas.push(linhaApostila(a));
      linhas.push("");
      const combos = blocoCombos(apostilas);
      if (combos.length > 0) {
        linhas.push("## Combos (apostila + videoaulas)");
        linhas.push(...combos);
        linhas.push("");
      }
    }
    if (cursos.length > 0) {
      linhas.push("## Cursos gratuitos");
      for (const c of cursos) {
        const horas = c.carga_horaria_horas ? ` (${c.carga_horaria_horas} horas, gratuito, com certificado)` : " (gratuito, com certificado)";
        linhas.push(`- [${c.nome}](${SITE_URL}/cursos/${c.slug})${horas}${c.descricao ? `: ${c.descricao}` : ""}`);
      }
      linhas.push("");
    }
  } catch {
    // sem a chave de serviço (ex.: build local): fica só com as páginas fixas
  }

  linhas.push("## Outras páginas");
  linhas.push(`- [Sobre o SIBRAP](${SITE_URL}/sobre)`);
  linhas.push(`- [Contato](${SITE_URL}/contato)`);
  linhas.push(`- [Termos de uso](${SITE_URL}/termos)`);
  linhas.push(`- [Política de privacidade](${SITE_URL}/privacidade)`);
  linhas.push(`- [Validar certificado](${SITE_URL}/validar)`);

  return new Response(linhas.join("\n") + "\n", {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
