// src/lib/curriculo/secoes.ts
//
// Monta o conteúdo do currículo em seções prontas para desenhar, na ordem certa de cada perfil.
// A prévia (HTML) e o PDF usam a mesma saída, então o que a pessoa vê é o que baixa.
// Seção sem nada preenchido não aparece.

import { PERFIS, SITUACOES, type Curriculo } from "./tipos";

export type Item = { titulo: string; subtitulo?: string; periodo?: string; texto?: string };
export type Secao =
  | { tipo: "texto"; chave: string; titulo: string; texto: string }
  | { tipo: "itens"; chave: string; titulo: string; itens: Item[] }
  | { tipo: "etiquetas"; chave: string; titulo: string; etiquetas: string[] };

export type Documento = {
  nome: string;
  contatos: string[];
  secoes: Secao[];
  /** seções que o modelo Moderno põe na coluna lateral */
  lateral: Secao[];
};

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/** "2024-03" vira "mar/2024"; ano solto fica como está. */
export function mesAno(v: string) {
  const m = /^(\d{4})-(\d{2})$/.exec(v.trim());
  if (!m) return v.trim();
  return `${MESES[Number(m[2]) - 1] ?? m[2]}/${m[1]}`;
}

function periodo(inicio: string, fim: string, atual = false) {
  const i = mesAno(inicio);
  const f = atual ? "atual" : mesAno(fim);
  if (i && f) return `${i} – ${f}`;
  return i || f;
}

export function montarDocumento(c: Curriculo): Documento {
  const d = c.dados;
  const local = [d.cidade.trim(), d.uf].filter(Boolean).join("/");
  const contatos = [local, d.telefone.trim(), d.email.trim(), d.link.trim()].filter(Boolean);

  const objetivo: Secao | null = d.objetivo.trim()
    ? { tipo: "texto", chave: "objetivo", titulo: PERFIS[c.perfil].tituloObjetivo, texto: d.objetivo.trim() }
    : null;

  const formacao: Secao = {
    tipo: "itens",
    chave: "formacao",
    titulo: "Formação",
    itens: d.formacoes
      .filter((f) => f.instituicao.trim() || f.curso.trim())
      .map((f) => ({
        titulo: f.curso.trim(),
        subtitulo: f.instituicao.trim(),
        periodo:
          f.situacao === "concluido"
            ? f.fim.trim() ? `Concluído em ${mesAno(f.fim)}` : SITUACOES.concluido
            : f.situacao === "cursando" && f.fim.trim()
              ? `Cursando · conclusão prevista em ${mesAno(f.fim)}`
              : SITUACOES[f.situacao],
      })),
  };

  const experiencia: Secao = {
    tipo: "itens",
    chave: "experiencia",
    titulo: "Experiência profissional",
    itens: d.experiencias
      .filter((x) => x.empresa.trim() || x.cargo.trim())
      .map((x) => ({
        titulo: x.cargo.trim(),
        subtitulo: x.empresa.trim(),
        periodo: periodo(x.inicio, x.fim, x.atual),
        texto: x.atividades.trim(),
      })),
  };

  const atividades: Secao = {
    tipo: "itens",
    chave: "atividades",
    titulo: "Atividades, projetos e voluntariado",
    itens: d.atividades
      .filter((a) => a.titulo.trim())
      .map((a) => ({ titulo: a.titulo.trim(), subtitulo: a.local.trim(), periodo: a.periodo.trim(), texto: a.descricao.trim() })),
  };

  const cursos: Secao = {
    tipo: "itens",
    chave: "cursos",
    titulo: c.perfil === "jovem" ? "Cursos e qualificações" : "Cursos e certificações",
    itens: d.cursos
      .filter((x) => x.nome.trim())
      .map((x) => ({
        titulo: x.nome.trim(),
        subtitulo: [x.instituicao.trim(), x.cargaHoraria.trim() ? `${x.cargaHoraria.trim().replace(/h$/i, "")}h` : ""].filter(Boolean).join(" · "),
        periodo: x.ano.trim(),
      })),
  };

  const habilidades: Secao = {
    tipo: "etiquetas",
    chave: "habilidades",
    titulo: c.perfil === "jovem" ? "Habilidades" : "Competências",
    etiquetas: d.habilidades.map((h) => h.trim()).filter(Boolean),
  };

  const idiomas: Secao = {
    tipo: "etiquetas",
    chave: "idiomas",
    titulo: "Idiomas",
    etiquetas: d.idiomas.filter((i) => i.idioma.trim()).map((i) => `${i.idioma.trim()} (${i.nivel.toLowerCase()})`),
  };

  const adicionais: Secao | null = d.adicionais.trim()
    ? { tipo: "texto", chave: "adicionais", titulo: "Informações adicionais", texto: d.adicionais.trim() }
    : null;

  const ordem =
    c.perfil === "jovem"
      ? [objetivo, formacao, cursos, habilidades, atividades, idiomas, adicionais]
      : [objetivo, experiencia, formacao, cursos, habilidades, idiomas, adicionais];

  const preenchida = (s: Secao | null): s is Secao =>
    !!s && (s.tipo === "texto" ? !!s.texto : s.tipo === "itens" ? s.itens.length > 0 : s.etiquetas.length > 0);

  const secoes = ordem.filter(preenchida);
  const naLateral = new Set(["habilidades", "idiomas"]);
  return {
    nome: d.nome.trim(),
    contatos,
    secoes,
    lateral: secoes.filter((s) => naLateral.has(s.chave)),
  };
}
