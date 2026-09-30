import { criarClienteSupabaseAdmin } from "@/lib/supabase-admin";

// llms.txt (llmstxt.org): resumo do site pensado pra assistentes de IA
// lerem. Gerado dinamicamente pra listar as apostilas e cursos realmente
// publicados, no mesmo espírito do sitemap.ts.
export const revalidate = 3600;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sibrap.tec.br";

export async function GET() {
  const linhas: string[] = [];

  linhas.push("# SIBRAP — Sistema Brasileiro de Aprendizagem Profissional");
  linhas.push("");
  linhas.push(
    "> Apostilas em PDF para concursos públicos municipais (com questões comentadas, gabarito e simulado online) e cursos livres gratuitos, com certificado com QR Code de validação."
  );
  linhas.push("");
  linhas.push(
    "Cada apostila é focada em um cargo e edital específico de um concurso municipal real, com preço fixo (pagamento único, sem mensalidade) e conteúdo na ordem do próprio edital. Quem compra também tem acesso a um Ambiente Virtual de Aprendizagem (AVA) por apostila: simulado online, cronograma de estudos e missões."
  );
  linhas.push("");

  linhas.push("## Páginas principais");
  linhas.push(`- [Página inicial](${siteUrl}): apresentação do SIBRAP e vitrine das apostilas.`);
  linhas.push(`- [Apostilas](${siteUrl}/apostilas): catálogo completo de apostilas para concursos públicos.`);
  linhas.push(`- [Cursos gratuitos](${siteUrl}/cursos): cursos livres com certificado, sem custo.`);
  linhas.push(`- [Blog](${siteUrl}/blog): conteúdo sobre concursos públicos e preparação.`);
  linhas.push("");

  try {
    const admin = criarClienteSupabaseAdmin();

    const { data: apostilas } = await admin
      .from("apostilas")
      .select("slug, titulo, orgao, cidade, uf, cargo, descricao")
      .eq("status", "publicada")
      .order("ordem");
    if (apostilas && apostilas.length > 0) {
      linhas.push("## Apostilas publicadas");
      for (const a of apostilas) {
        const local = [a.cidade, a.uf].filter(Boolean).join("/");
        linhas.push(
          `- [${a.titulo} — ${a.orgao}${local ? ` (${local})` : ""}](${siteUrl}/apostilas/${a.slug}): ${a.descricao ?? `apostila para o cargo de ${a.cargo}.`}`
        );
      }
      linhas.push("");
    }

    const { data: cursos } = await admin
      .from("cursos")
      .select("slug, titulo, descricao")
      .eq("ativo", true);
    if (cursos && cursos.length > 0) {
      linhas.push("## Cursos gratuitos");
      for (const c of cursos) {
        linhas.push(`- [${c.titulo}](${siteUrl}/cursos/${c.slug})${c.descricao ? `: ${c.descricao}` : ""}`);
      }
      linhas.push("");
    }
  } catch {
    // sem a chave de serviço (ex.: build local): fica só com as páginas fixas
  }

  linhas.push("## Outras páginas");
  linhas.push(`- [Termos de uso](${siteUrl}/termos)`);
  linhas.push(`- [Política de privacidade](${siteUrl}/privacidade)`);
  linhas.push(`- [Validar certificado](${siteUrl}/validar)`);

  return new Response(linhas.join("\n") + "\n", {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
