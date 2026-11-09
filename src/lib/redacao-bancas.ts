// src/lib/redacao-bancas.ts
//
// Grade de correção e temas de cada apostila com redação, e contagem de linhas.
// Sem dependência de servidor: usado pela tela do editor e pelo corretor.

export const CARACTERES_POR_LINHA = 68; // média de uma linha manuscrita na folha de redação
export const MIN_LINHAS_CORRECAO = 7;
export const MAX_SUGESTOES_POR_REDACAO = 25;
export const MAX_CARACTERES = 4500;

export type Criterio = { nome: string; max: number; descricao: string };
export type Banca = { nome: string; linhasMin: number; linhasMax: number; criterios: Criterio[]; temas: string[] };

const TEMAS_SEGURANCA = [
  "Os desafios da segurança pública nas grandes cidades brasileiras",
  "A relação entre polícia e comunidade na prevenção da violência",
  "O uso de câmeras corporais por policiais: transparência e proteção",
  "Violência contra a mulher: como ampliar a proteção às vítimas",
  "Golpes digitais e o crescimento dos crimes pela internet",
  "A influência das redes sociais na disseminação de notícias falsas",
  "Juventude, educação e prevenção da criminalidade",
  "Trânsito seguro: responsabilidade do Estado e do cidadão",
];
const TEMAS_ADMINISTRACAO = [
  "A transformação digital dos serviços públicos e o atendimento ao cidadão",
  "Ética e transparência na administração pública",
  "Os desafios do atendimento ao público com qualidade e cordialidade",
  "Inclusão digital como condição para o acesso a direitos",
  "Desenvolvimento sustentável na Amazônia: emprego e preservação",
  "A importância do concurso público para a eficiência do Estado",
  "Saúde mental no ambiente de trabalho",
  "O papel da educação na redução das desigualdades regionais",
];

/** Grade por apostila (slug). A soma dos máximos é a nota máxima da prova. */
export const BANCAS: Record<string, Banca> = {
  "pmsp-soldado": {
    nome: "Vunesp",
    linhasMin: 20,
    linhasMax: 30,
    temas: TEMAS_SEGURANCA,
    criterios: [
      { nome: "Tema e gênero", max: 10, descricao: "Desenvolve o tema proposto em texto dissertativo-argumentativo, sem fuga ou tangência." },
      { nome: "Estrutura e coerência", max: 10, descricao: "Introdução, desenvolvimento e conclusão; progressão das ideias; argumentos consistentes." },
      { nome: "Coesão", max: 10, descricao: "Uso de conectivos, retomadas e paragrafação que ligam as ideias." },
      { nome: "Norma-padrão", max: 10, descricao: "Ortografia, acentuação, pontuação, concordância, regência e crase." },
    ],
  },
  "pmsc-soldado": {
    nome: "Instituto AOCP",
    linhasMin: 20,
    linhasMax: 30,
    temas: TEMAS_SEGURANCA,
    criterios: [
      { nome: "Aspectos macroestruturais", max: 12, descricao: "Adequação ao tema e ao gênero dissertativo, argumentação, coerência e estrutura dos parágrafos." },
      { nome: "Aspectos microestruturais", max: 8, descricao: "Norma-padrão: ortografia, acentuação, pontuação, concordância, regência, crase e coesão." },
    ],
  },
  "sead-ap-assistente-administrativo": {
    nome: "IDCAP",
    linhasMin: 20,
    linhasMax: 30,
    temas: TEMAS_ADMINISTRACAO,
    criterios: [
      { nome: "Conteúdo e argumentação", max: 10, descricao: "Pertinência ao tema, consistência e repertório dos argumentos." },
      { nome: "Estrutura e coesão", max: 10, descricao: "Organização em parágrafos, progressão e articulação das ideias." },
      { nome: "Norma-padrão", max: 10, descricao: "Ortografia, acentuação, pontuação, concordância, regência e crase." },
    ],
  },
};

export function bancaDa(slug: string | null | undefined): Banca {
  return (slug && BANCAS[slug]) || BANCAS["pmsp-soldado"];
}

export function contarLinhas(texto: string): number {
  return texto
    .split(/\n/)
    .reduce((n, p) => n + (p.trim() ? Math.max(1, Math.ceil(p.trim().length / CARACTERES_POR_LINHA)) : 0), 0);
}
