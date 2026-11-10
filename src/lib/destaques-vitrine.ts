// src/lib/destaques-vitrine.ts
//
// Destaques de linha inteira na vitrine de apostilas: um "quebra-gelo" entre as capas.
// Cada destaque usa as cores da capa da sua apostila. Só aparece se a apostila estiver
// publicada (e sem filtro ativo na vitrine).
//
// Depoimento: só com fala REAL de aluno (texto, nome e cidade autorizados). Sem
// depoimento, o painel da direita mostra um exemplo ilustrativo da correção (redação)
// ou os números da apostila.

export type CoresDestaque = {
  fundo: string; // gradiente/cor do container
  texto: string; // texto principal sobre o fundo
  suave: string; // texto secundário sobre o fundo
  destaque: string; // selo e botão
  destaqueTexto: string; // texto do selo e do botão
};

export type DestaqueVitrine = {
  slug: string;
  selo: string;
  titulo: string;
  descricao: string; // no máx. 3 linhas
  beneficios: string[];
  cores: CoresDestaque;
  painel: { tipo: "redacao"; nota: string } | { tipo: "numeros"; itens: { n: string; t: string }[] };
  depoimento?: { texto: string; autor: string };
};

// Ordem = ordem de aparição. Entram depois do 6º e do 18º card (múltiplos de 6 fecham
// a linha com 2 colunas no celular e com 3 no computador).
export const POSICOES_DESTAQUE = [6, 18];

export const DESTAQUES_VITRINE: DestaqueVitrine[] = [
  {
    slug: "pmsp-soldado",
    selo: "Com Treino de Redação",
    titulo: "Aluno-Soldado PM · PMSP",
    descricao: "Apostila completa na ordem do edital da Vunesp e treino de redação com dicas enquanto você escreve e nota pela grade da banca.",
    beneficios: ["6 correções com nota até a prova", "247 exercícios comentados", "Simulado com questões oficiais"],
    cores: {
      fundo: "linear-gradient(120deg, #5C0A0F 0%, #9E1219 55%, #C4161F 100%)",
      texto: "#FFFFFF",
      suave: "#F6D5D6",
      destaque: "#FFFFFF",
      destaqueTexto: "#9E1219",
    },
    painel: { tipo: "redacao", nota: "31/40" },
  },
  {
    slug: "ibge-recenseador",
    selo: "Novo · 27.279 vagas",
    titulo: "Recenseador · IBGE",
    descricao: "Conhecimentos Técnicos do Censo Agro valem metade da prova. Aqui eles vêm organizados em tabelas de decisão e casos de campo.",
    beneficios: ["Material oficial do 12º Censo Agro", "196 exercícios comentados", "Simulado online"],
    cores: {
      fundo: "linear-gradient(120deg, #002776 0%, #0B3D91 60%, #11509E 100%)",
      texto: "#FFFFFF",
      suave: "#D6E2F5",
      destaque: "#FFDF00",
      destaqueTexto: "#002776",
    },
    painel: {
      tipo: "numeros",
      itens: [
        { n: "30", t: "questões técnicas" },
        { n: "15", t: "de Português" },
        { n: "15", t: "de Matemática" },
      ],
    },
  },
  {
    slug: "pmsc-soldado",
    selo: "Com Treino de Redação",
    titulo: "Soldado PM · PMSC",
    descricao: "Apostila do edital AOCP com as leis atualizadas e treino de redação com dicas ao vivo e nota pela grade da banca.",
    beneficios: ["6 correções com nota até a prova", "450 exercícios comentados", "Legislação atualizada 2026"],
    cores: {
      fundo: "linear-gradient(120deg, #06162B 0%, #0B2340 55%, #12345C 100%)",
      texto: "#FFFFFF",
      suave: "#CFDBEA",
      destaque: "#F5C400",
      destaqueTexto: "#06162B",
    },
    painel: { tipo: "redacao", nota: "Nota por critério" },
  },
];
