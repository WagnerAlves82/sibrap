// src/lib/curriculo/tipos.ts
//
// Gerador de currículos (/curriculo): tipos, perfis e validação. Usado no navegador
// (formulário e prévia) e no servidor (PDF), por isso não importa nada de Node.
// Regra fixa: o currículo só mostra o que a pessoa escreveu; nada é inventado.

export type Perfil = "jovem" | "medio";
export type Modelo = "classico" | "moderno" | "compacto";
export type Situacao = "cursando" | "concluido" | "interrompido";

export type Formacao = { instituicao: string; curso: string; situacao: Situacao; inicio: string; fim: string };
export type Experiencia = { empresa: string; cargo: string; inicio: string; fim: string; atual: boolean; atividades: string };
export type Atividade = { titulo: string; local: string; periodo: string; descricao: string };
export type Curso = { nome: string; instituicao: string; ano: string; cargaHoraria: string };
export type Idioma = { idioma: string; nivel: string };

export type DadosCurriculo = {
  nome: string;
  cidade: string;
  uf: string;
  telefone: string;
  email: string;
  link: string;
  objetivo: string;
  formacoes: Formacao[];
  experiencias: Experiencia[];
  atividades: Atividade[];
  cursos: Curso[];
  habilidades: string[];
  idiomas: Idioma[];
  adicionais: string;
};

export type Curriculo = { perfil: Perfil; modelo: Modelo; dados: DadosCurriculo };

export const MAX_ITENS = 8;
export const MAX_HABILIDADES = 15;

export const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB",
  "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

export const SITUACOES: Record<Situacao, string> = {
  cursando: "Cursando",
  concluido: "Concluído",
  interrompido: "Interrompido",
};

export const NIVEIS_IDIOMA = ["Básico", "Intermediário", "Avançado", "Fluente"];

export const PERFIS: Record<
  Perfil,
  { titulo: string; resumo: string; tituloObjetivo: string; exemplosObjetivo: string[]; habilidadesSugeridas: string[] }
> = {
  jovem: {
    titulo: "Jovem Aprendiz e Primeiro Emprego",
    resumo: "Para quem está começando e ainda não tem experiência com carteira assinada.",
    tituloObjetivo: "Objetivo profissional",
    exemplosObjetivo: [
      "Busco minha primeira oportunidade como Jovem Aprendiz, para aprender a rotina de uma empresa e desenvolver minhas habilidades.",
      "Busco uma vaga de primeiro emprego na área administrativa, para colocar em prática o que aprendi nos cursos e crescer profissionalmente.",
      "Busco oportunidade como atendente ou auxiliar no comércio, onde eu possa aprender, atender bem os clientes e contribuir com a equipe.",
    ],
    habilidadesSugeridas: [
      "Pontualidade", "Trabalho em equipe", "Facilidade de aprendizado", "Comunicação", "Organização",
      "Informática básica (Word, Excel)", "Internet e e-mail", "Atendimento ao público", "Responsabilidade",
    ],
  },
  medio: {
    titulo: "Nível Médio e Experiência Inicial",
    resumo: "Para quem já tem ensino médio (ou está cursando), cursos e uma ou mais experiências de trabalho.",
    tituloObjetivo: "Resumo profissional",
    exemplosObjetivo: [
      "Profissional com experiência em atendimento ao cliente e rotinas administrativas, em busca de vaga de auxiliar administrativo.",
      "Tenho experiência em estoque e reposição de mercadorias e busco vaga de auxiliar de estoque ou conferente.",
      "Profissional com experiência em vendas e caixa, comunicativo e organizado, em busca de vaga no comércio.",
    ],
    habilidadesSugeridas: [
      "Atendimento ao cliente", "Rotinas administrativas", "Pacote Office", "Controle de estoque", "Caixa e fechamento",
      "Organização de documentos", "Trabalho em equipe", "Resolução de problemas", "Proatividade",
    ],
  },
};

export const MODELOS: Record<Modelo, { titulo: string; resumo: string; temFoto: boolean }> = {
  classico: { titulo: "Clássico", resumo: "Uma coluna, sóbrio, serve para qualquer vaga.", temFoto: true },
  moderno: { titulo: "Moderno", resumo: "Coluna lateral azul com contatos, habilidades e foto.", temFoto: true },
  compacto: { titulo: "Compacto", resumo: "Mais informação em uma página, sem foto.", temFoto: false },
};

export function dadosVazios(): DadosCurriculo {
  return {
    nome: "", cidade: "", uf: "", telefone: "", email: "", link: "", objetivo: "",
    formacoes: [], experiencias: [], atividades: [], cursos: [], habilidades: [], idiomas: [], adicionais: "",
  };
}

export const formacaoVazia = (): Formacao => ({ instituicao: "", curso: "", situacao: "concluido", inicio: "", fim: "" });
export const experienciaVazia = (): Experiencia => ({ empresa: "", cargo: "", inicio: "", fim: "", atual: false, atividades: "" });
export const atividadeVazia = (): Atividade => ({ titulo: "", local: "", periodo: "", descricao: "" });
export const cursoVazio = (): Curso => ({ nome: "", instituicao: "", ano: "", cargaHoraria: "" });
export const idiomaVazio = (): Idioma => ({ idioma: "", nivel: "Básico" });

const LIMITES = { curto: 120, medio: 200, longo: 900 };

const texto = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/\s+$/g, "").slice(0, max) : "");
const lista = <T,>(v: unknown, f: (x: Record<string, unknown>) => T, max = MAX_ITENS): T[] =>
  Array.isArray(v) ? v.slice(0, max).filter((x) => x && typeof x === "object").map((x) => f(x as Record<string, unknown>)) : [];

/** Limpa o que veio do navegador (tamanhos, tipos e quantidade de itens). */
export function normalizar(entrada: unknown): Curriculo | null {
  if (!entrada || typeof entrada !== "object") return null;
  const c = entrada as Record<string, unknown>;
  const perfil = c.perfil === "jovem" || c.perfil === "medio" ? c.perfil : null;
  const modelo = c.modelo === "classico" || c.modelo === "moderno" || c.modelo === "compacto" ? c.modelo : null;
  if (!perfil || !modelo || !c.dados || typeof c.dados !== "object") return null;
  const d = c.dados as Record<string, unknown>;
  const { curto, medio, longo } = LIMITES;
  return {
    perfil,
    modelo,
    dados: {
      nome: texto(d.nome, curto),
      cidade: texto(d.cidade, curto),
      uf: UFS.includes(String(d.uf)) ? String(d.uf) : "",
      telefone: texto(d.telefone, 30),
      email: texto(d.email, curto),
      link: texto(d.link, medio),
      objetivo: texto(d.objetivo, 600),
      formacoes: lista(d.formacoes, (x) => ({
        instituicao: texto(x.instituicao, curto),
        curso: texto(x.curso, curto),
        situacao: (["cursando", "concluido", "interrompido"].includes(String(x.situacao)) ? x.situacao : "concluido") as Situacao,
        inicio: texto(x.inicio, 10),
        fim: texto(x.fim, 10),
      })),
      experiencias: lista(d.experiencias, (x) => ({
        empresa: texto(x.empresa, curto),
        cargo: texto(x.cargo, curto),
        inicio: texto(x.inicio, 10),
        fim: texto(x.fim, 10),
        atual: x.atual === true,
        atividades: texto(x.atividades, longo),
      })),
      atividades: lista(d.atividades, (x) => ({
        titulo: texto(x.titulo, curto),
        local: texto(x.local, curto),
        periodo: texto(x.periodo, 40),
        descricao: texto(x.descricao, longo),
      })),
      cursos: lista(d.cursos, (x) => ({
        nome: texto(x.nome, curto),
        instituicao: texto(x.instituicao, curto),
        ano: texto(x.ano, 10),
        cargaHoraria: texto(x.cargaHoraria, 10),
      }), 12),
      habilidades: Array.isArray(d.habilidades)
        ? d.habilidades.slice(0, MAX_HABILIDADES).map((h) => texto(h, 60)).filter(Boolean)
        : [],
      idiomas: lista(d.idiomas, (x) => ({
        idioma: texto(x.idioma, 40),
        nivel: NIVEIS_IDIOMA.includes(String(x.nivel)) ? String(x.nivel) : "Básico",
      }), 5),
      adicionais: texto(d.adicionais, 400),
    },
  };
}

export type Erros = Partial<Record<"nome" | "contato" | "email" | "telefone" | "cidade" | "objetivo" | "formacao" | "experiencia", string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function apenasDigitos(v: string) {
  return v.replace(/\D/g, "");
}

/** Campos obrigatórios por perfil. Experiência é opcional no Jovem Aprendiz. */
export function validar(c: Curriculo): Erros {
  const d = c.dados;
  const e: Erros = {};
  if (d.nome.trim().split(/\s+/).length < 2) e.nome = "Escreva seu nome completo.";
  if (!d.telefone.trim() && !d.email.trim()) e.contato = "Informe ao menos um telefone ou e-mail.";
  if (d.email.trim() && !EMAIL.test(d.email.trim())) e.email = "Confira o e-mail.";
  const dig = apenasDigitos(d.telefone);
  if (d.telefone.trim() && (dig.length < 10 || dig.length > 11)) e.telefone = "Confira o telefone com DDD.";
  if (!d.cidade.trim() || !d.uf) e.cidade = "Informe cidade e estado.";
  if (d.objetivo.trim().length < 20) e.objetivo = `Escreva o ${PERFIS[c.perfil].tituloObjetivo.toLowerCase()} (uma ou duas frases).`;
  if (!d.formacoes.some((f) => f.instituicao.trim() && f.curso.trim())) e.formacao = "Informe ao menos uma formação (escola e nível ou curso).";
  if (c.perfil === "medio" && !d.experiencias.some((x) => x.empresa.trim() && x.cargo.trim())) {
    e.experiencia = "Informe ao menos uma experiência (empresa e cargo). Se ainda não tem, use o perfil Jovem Aprendiz e Primeiro Emprego.";
  }
  return e;
}

/** Formata (47) 99999-9999 enquanto a pessoa digita. */
export function formatarTelefone(v: string) {
  const d = apenasDigitos(v).slice(0, 11);
  if (d.length <= 2) return d ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}
