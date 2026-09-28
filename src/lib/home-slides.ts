// Slides do carrossel da home: concursos em destaque. O texto e os
// números vêm dos editais oficiais; a imagem de fundo do desktop está em
// /public. No celular o slide é desenhado só com código (sem imagem).

export type SlideHome = {
  id: string;
  cidade: string;
  uf: string;
  orgao: string;
  titulo: string; // linha principal
  subtitulo: string;
  banca: string;
  edital: string;
  provaIso: string;
  imagem: string;
  fatos: { rotulo: string; valor: string }[];
  // se houver apostila publicada com esse slug, o CTA aponta para ela
  apostilaSlug?: string;
};

export const SLIDES_HOME: SlideHome[] = [
  {
    id: "chapeco",
    cidade: "Chapecó",
    uf: "SC",
    orgao: "Prefeitura de Chapecó",
    titulo: "Atendente de Central do Cidadão em Chapecó",
    subtitulo: "Concurso Público nº 002/2026 · Edital nº 001/2026 · banca Instituto Objetiva",
    banca: "Instituto Objetiva",
    edital: "Edital 001/2026",
    provaIso: "2026-12-20",
    imagem: "/slide-1-desktop.png",
    fatos: [
      { rotulo: "Vagas", valor: "10 + CR" },
      { rotulo: "Salário", valor: "R$ 2.900,00" },
      { rotulo: "Inscrições até", valor: "29/10/2026" },
      { rotulo: "Prova", valor: "20/12/2026" },
    ],
    apostilaSlug: "chapeco-atendente-central-cidadao",
  },
  {
    id: "sao-jose",
    cidade: "São José",
    uf: "SC",
    orgao: "Prefeitura de São José",
    titulo: "Concurso Prefeitura de São José",
    subtitulo: "Auxiliar de Educação Especial · banca FEPESE",
    banca: "FEPESE",
    edital: "Concurso 001/2026/SMA",
    provaIso: "2026-11-01",
    imagem: "/slide-2-desktop.png",
    fatos: [
      { rotulo: "Vagas", valor: "300" },
      { rotulo: "Salário", valor: "R$ 3.436 a R$ 4.582" },
      { rotulo: "Inscrições até", valor: "16/10/2026" },
      { rotulo: "Prova", valor: "01/11/2026" },
    ],
    apostilaSlug: "sao-jose-auxiliar-educacao-especial",
  },
  {
    id: "cacador",
    cidade: "Caçador",
    uf: "SC",
    orgao: "Prefeitura de Caçador",
    titulo: "Professor de Anos Iniciais em Caçador",
    subtitulo: "Processo seletivo · Edital 01/2026 · banca IBAM",
    banca: "IBAM",
    edital: "Edital 01/2026",
    provaIso: "2026-11-22",
    imagem: "/slide-3-desktop.png",
    fatos: [
      { rotulo: "Cargo", valor: "Professor · Anos Iniciais" },
      { rotulo: "Prova", valor: "22/11/2026" },
    ],
    apostilaSlug: "cacador-professor-anos-iniciais",
  },
];
