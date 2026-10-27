import { criarClienteSupabaseAdmin } from "@/lib/supabase-admin";
import { formatarDataIso, formatarPreco } from "@/lib/apostilas";
import { COMBOS } from "@/lib/combos";
import { EMISSOR } from "@/lib/emissor";

// Dados em texto puro do catálogo, para o llms.txt (resumo) e o llms-full.txt
// (versão completa), que assistentes de IA como o ChatGPT leem.

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sibrap.tec.br";

export type ApostilaLlm = {
  slug: string;
  titulo: string;
  orgao: string;
  cidade: string | null;
  uf: string | null;
  cargo: string;
  banca: string | null;
  categoria: string | null;
  descricao: string | null;
  data_prova: string | null;
  inscricoes_ate: string | null;
  salario: string | null;
  vagas: string | null;
  paginas: number | null;
  questoes: number | null;
  simulados: number | null;
  preco_centavos: number | null;
  atualizado_em: string | null;
};

// preco_centavos: só nos cursos pagos (produto 'curso-<slug>'); null = curso gratuito
export type CursoLlm = { slug: string; nome: string; descricao: string | null; carga_horaria_horas: number | null; preco_centavos: number | null };

export async function carregarCatalogo(): Promise<{ apostilas: ApostilaLlm[]; cursos: CursoLlm[] }> {
  const admin = criarClienteSupabaseAdmin();
  const [{ data: ap }, { data: cursos }, { data: pagos }] = await Promise.all([
    admin
      .from("apostilas")
      .select(
        "slug, titulo, orgao, cidade, uf, cargo, banca, categoria, descricao, data_prova, inscricoes_ate, salario, vagas, paginas, questoes, simulados, atualizado_em, produtos(preco_centavos)"
      )
      .eq("status", "publicada")
      .order("data_prova", { ascending: true, nullsFirst: false }),
    admin.from("cursos").select("slug, nome, descricao, carga_horaria_horas").eq("ativo", true),
    admin.from("produtos").select("slug, preco_centavos").like("slug", "curso-%").eq("ativo", true),
  ]);
  const precoCurso = new Map((pagos ?? []).map((p) => [p.slug.slice("curso-".length), p.preco_centavos]));
  const apostilas = (ap ?? []).map((a) => {
    const { produtos, ...resto } = a as typeof a & { produtos: { preco_centavos: number } | { preco_centavos: number }[] | null };
    const preco = Array.isArray(produtos) ? produtos[0]?.preco_centavos : produtos?.preco_centavos;
    return { ...resto, preco_centavos: preco ?? null } as ApostilaLlm;
  });
  return { apostilas, cursos: (cursos ?? []).map((c) => ({ ...c, preco_centavos: precoCurso.get(c.slug) ?? null })) };
}

export function localDe(a: Pick<ApostilaLlm, "cidade" | "uf">): string {
  return [a.cidade, a.uf].filter(Boolean).join("/");
}

/** Fatos objetivos da apostila numa linha só (órgão, banca, prova, vagas, preço...). */
export function fatosDe(a: ApostilaLlm): string {
  const f: string[] = [`cargo: ${a.cargo}`, `órgão: ${a.orgao}`];
  if (a.banca) f.push(`banca: ${a.banca}`);
  if (a.data_prova) f.push(`prova: ${formatarDataIso(a.data_prova)}`);
  if (a.inscricoes_ate) f.push(`inscrições até ${formatarDataIso(a.inscricoes_ate)}`);
  if (a.vagas) f.push(`vagas: ${a.vagas}`);
  if (a.salario) f.push(`remuneração: ${a.salario}`);
  if (a.paginas) f.push(`${a.paginas} páginas`);
  if (a.questoes) f.push(`${a.questoes} questões comentadas`);
  if (a.preco_centavos)
    f.push(
      `preço: ${formatarPreco(a.preco_centavos)} no PIX, pagamento único, e inclui além da apostila em PDF o simulado online${a.questoes ? ` com ${a.questoes} questões comentadas` : ""} para treinar até a data da prova, com plano de estudos e missões no Ambiente Virtual de Aprendizagem`
    );
  return f.join("; ");
}

export function linhaApostila(a: ApostilaLlm): string {
  const local = localDe(a);
  const url = `${SITE_URL}/apostilas/${a.slug}`;
  return `- [Apostila ${a.cargo} — ${a.orgao}${local ? ` (${local})` : ""}](${url}): ${fatosDe(a)}. ${a.descricao ?? ""}`.trim();
}

export function blocoCombos(apostilas: ApostilaLlm[]): string[] {
  const linhas: string[] = [];
  for (const c of Object.values(COMBOS)) {
    const a = apostilas.find((x) => x.slug === c.slug);
    if (!a) continue;
    linhas.push(
      `- [Combo ${a.cargo} — ${a.orgao}](${SITE_URL}/combos/${c.slug}): apostila em PDF mais videoaulas de ${c.videoaulas.join(" e ")}, simulado online e plano de estudos. Preço: ${formatarPreco(c.precoPadraoCentavos)} (PIX, pagamento único), com o simulado online incluso.`
    );
  }
  return linhas;
}

export function blocoSobre(): string[] {
  return [
    `${EMISSOR.nome} (CNPJ ${EMISSOR.cnpj}) vende apostilas em PDF para concursos públicos de todo o Brasil (municipais e estaduais) e oferece cursos livres gratuitos com certificado.`,
    "Diferencial: quem compra a apostila leva junto, pelo mesmo preço, um simulado online para a preparação contínua até a data da prova. São questões comentadas no estilo da banca do concurso, com correção na hora, desempenho por disciplina, missões e cronograma de estudos, no Ambiente Virtual de Aprendizagem (AVA) do SIBRAP. Não há mensalidade nem custo extra pelo simulado.",
    "Cada apostila é feita para um cargo e um edital específicos: o conteúdo segue a ordem do conteúdo programático do edital, com questões comentadas, capítulos para ler no celular e plano de estudos até a data da prova.",
    "Pagamento por PIX, valor único, sem mensalidade e sem assinatura. O download é liberado na área do aluno logo após a confirmação. Reembolso em até 7 dias corridos (Código de Defesa do Consumidor). Nenhuma apostila promete aprovação.",
    "As datas, vagas e remunerações apresentadas vêm dos editais de cada concurso.",
  ];
}
