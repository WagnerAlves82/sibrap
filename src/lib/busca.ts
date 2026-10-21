// Busca do site: sem acento, sem diferença entre maiúsculas e minúsculas, e todas as palavras digitadas
// precisam aparecer (ex.: "apostila curitiba" acha a apostila de Curitiba).

export const UF_NOMES: Record<string, string> = {
  AC: "Acre", AL: "Alagoas", AP: "Amapá", AM: "Amazonas", BA: "Bahia", CE: "Ceará", DF: "Distrito Federal",
  ES: "Espírito Santo", GO: "Goiás", MA: "Maranhão", MT: "Mato Grosso", MS: "Mato Grosso do Sul", MG: "Minas Gerais",
  PA: "Pará", PB: "Paraíba", PR: "Paraná", PE: "Pernambuco", PI: "Piauí", RJ: "Rio de Janeiro", RN: "Rio Grande do Norte",
  RS: "Rio Grande do Sul", RO: "Rondônia", RR: "Roraima", SC: "Santa Catarina", SP: "São Paulo", SE: "Sergipe", TO: "Tocantins",
};

export function normalizar(t: string): string {
  return t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/** Palavras da busca (sem acento); palavras genéricas como "de" e "do" não contam. */
export function termosDaBusca(q: string): string[] {
  return normalizar(q)
    .split(/[^a-z0-9]+/)
    .filter((p) => p.length > 1 && !["de", "do", "da", "dos", "das", "em", "no", "na", "para", "por", "com"].includes(p));
}

/** Verdadeiro se todos os termos aparecem no texto (já normalizado ou não). */
export function casaComTermos(texto: string, termos: string[]): boolean {
  if (termos.length === 0) return true;
  const base = normalizar(texto);
  return termos.every((t) => base.includes(t));
}

export function textoDaApostila(a: { titulo: string; orgao: string; cargo: string; cidade: string | null; banca: string | null; uf: string; categoria: string }): string {
  return `${a.titulo} ${a.orgao} ${a.cargo} ${a.cidade ?? ""} ${a.banca ?? ""} ${a.uf} ${UF_NOMES[a.uf] ?? ""} ${a.categoria} apostila`;
}

export function textoDoPost(p: { titulo: string; resumo: string | null; categoria: string; uf: string | null; regiao?: string | null }): string {
  return `${p.titulo} ${p.resumo ?? ""} ${p.categoria} ${p.uf ?? ""} ${p.uf ? UF_NOMES[p.uf] ?? "" : ""} ${p.regiao ?? ""}`;
}
