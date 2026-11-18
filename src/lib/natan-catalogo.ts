// Catálogo do Natan montado no servidor (cursos ativos, cursos pagos, Formação e apostilas publicadas), com cache de 1 hora.
import { criarClienteSupabaseAdmin } from "@/lib/supabase-admin";
import type { ItemCatalogo } from "@/lib/natan";

const reais = (c: number) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
let cache: { em: number; itens: ItemCatalogo[] } | null = null;

export async function catalogoNatan(): Promise<ItemCatalogo[]> {
  if (cache && Date.now() - cache.em < 3600_000) return cache.itens;
  const admin = criarClienteSupabaseAdmin();
  const [{ data: cursos }, { data: pagos }, { data: apostilas }] = await Promise.all([
    admin.from("cursos").select("slug, nome, categoria, carga_horaria_horas, subtitulo").eq("ativo", true),
    admin.from("produtos").select("slug, preco_centavos").eq("ativo", true).or("slug.like.curso-%,slug.eq.formacao-eletricista"),
    admin
      .from("apostilas")
      .select("slug, titulo, cargo, orgao, cidade, uf, inscricoes_ate, produtos(preco_centavos)")
      .eq("status", "publicada")
      .order("ordem"),
  ]);
  const precoCurso = new Map((pagos ?? []).map((p) => [p.slug, p.preco_centavos]));
  const itens: ItemCatalogo[] = [];
  for (const c of cursos ?? []) {
    const preco = precoCurso.get(`curso-${c.slug}`);
    itens.push({
      id: c.slug,
      tipo: preco ? "curso-pago" : "curso-gratis",
      nome: c.nome,
      area: c.categoria ?? "",
      horas: c.carga_horaria_horas,
      detalhe: c.subtitulo ?? "",
      preco: preco ? reais(preco) : null,
      url: `/cursos/${c.slug}`,
    });
  }
  const formacao = precoCurso.get("formacao-eletricista");
  if (formacao) {
    itens.push({
      id: "formacao-eletricista",
      tipo: "formacao",
      nome: "Formação Inicial para Eletricista (Eletricista + NR-10 + NR-35)",
      area: "Construção e manutenção",
      horas: 88,
      detalhe: "3 cursos e 3 certificados num pacote",
      preco: reais(formacao),
      url: "/cursos/formacao-eletricista",
    });
  }
  for (const a of apostilas ?? []) {
    const prod = Array.isArray(a.produtos) ? a.produtos[0] : a.produtos;
    itens.push({
      id: a.slug,
      tipo: "apostila",
      nome: a.titulo,
      area: "Concursos",
      horas: null,
      detalhe: [a.cargo, a.orgao, a.cidade ? `${a.cidade}/${a.uf}` : a.uf].filter(Boolean).join(" · "),
      preco: prod?.preco_centavos ? reais(prod.preco_centavos) : null,
      url: `/apostilas/${a.slug}`,
    });
  }
  cache = { em: Date.now(), itens };
  return itens;
}
