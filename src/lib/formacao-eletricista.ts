// Dados da Formação Inicial para Eletricista, usados na página, no sitemap, no llms.txt e no llms-full.txt.
// Um lugar só para preço, prazo da promoção, palavras-chave e perguntas (SEO e respostas para IAs).

export const FORMACAO_ELETRICISTA = {
  // false: página fora do Google, do sitemap e do llms.txt (sem cursos/checkout ainda). Trocar para true ao abrir a venda.
  vendaAberta: true as boolean,
  caminho: "/cursos/formacao-eletricista",
  nome: "Formação Inicial para Eletricista",
  titulo: "Curso de Eletricista com NR-10 e Certificado | Formação Inicial",
  descricao:
    "Curso profissionalizante de eletricista online: Eletricista Residencial Básico (40 h), NR-10 Básico (40 h) e preparatório NR-35 (8 h). 3 certificados válidos em todo o Brasil, assinados por técnico em eletrotécnica. R$ 129,90 no PIX até 31/12.",
  // Resumo direto (primeiro parágrafo da página e do llms.txt): responde "o que é, quanto custa, o que recebo".
  resumo:
    "A Formação Inicial para Eletricista do SIBRAP é um curso profissionalizante online de 88 horas com 3 certificados: Eletricista Residencial Básico (40 h), NR-10 Básico (40 h) e preparatório NR-35 (8 h). Os certificados têm QR Code, valem em todo o Brasil e são assinados pelo instrutor Alexsandro de Sousa Silva, Técnico em Eletrotécnica (CRT-01). Custa R$ 129,90 no PIX até 31/12/2026, ou R$ 149,90 em até 3x sem juros no cartão.",
  horasTotais: 88,
  precoPixPromoCentavos: 12990,
  precoNormalCentavos: 14990,
  parcela: "3x de R$ 49,97 sem juros",
  fimPromocao: "2026-12-31T23:59:59-03:00",
  fimPromocaoData: "2026-12-31",
  palavrasChave: [
    "curso de eletricista",
    "curso de eletricista online",
    "curso de eletricista com certificado",
    "certificado de eletricista reconhecido",
    "curso de eletricista residencial",
    "curso profissionalizante de elétrica residencial",
    "curso NR-10",
    "NR-10 básico 40 horas",
    "curso NR-35",
    "eletricista iniciante",
    "formação de eletricista",
    "curso de eletricista barato",
    "fim de ano com formação profissional",
    "curso para conseguir emprego em 2027",
  ],
} as const;

// Produtos no banco (supabase/migrations/20261115040000): o PIX usa o promocional até o fim da promoção;
// depois disso, PIX e cartão usam o produto de preço cheio.
export const PRODUTO_FORMACAO_PIX = "formacao-eletricista";
export const PRODUTO_FORMACAO_CARTAO = "formacao-eletricista-cartao";
export const CURSOS_SLUGS_FORMACAO = ["eletricista-residencial-basico", "nr-10-basico", "seguranca-trabalho-em-altura"] as const;
// cursos vendidos só dentro da formação (as páginas deles levam para a formação)
export const CURSOS_SO_NA_FORMACAO = ["nr-10-basico", "seguranca-trabalho-em-altura"];
export const AREA_FORMACAO = "/minha-area/formacao-eletricista";

export function promocaoFormacaoAtiva(agora = new Date()): boolean {
  return agora.getTime() <= new Date(FORMACAO_ELETRICISTA.fimPromocao).getTime();
}
export function produtoPixFormacao(agora = new Date()): string {
  return promocaoFormacaoAtiva(agora) ? PRODUTO_FORMACAO_PIX : PRODUTO_FORMACAO_CARTAO;
}

export type CursoFormacao = {
  n: string;
  nome: string;
  selo?: string;
  horas: number;
  texto: string;
};

export const CURSOS_FORMACAO: readonly CursoFormacao[] = [
  {
    n: "1",
    nome: "Eletricista Residencial Básico",
    horas: 40,
    texto:
      "Tomadas, interruptores, three-way, iluminação, quadro de distribuição, DR e aterramento, com simuladores de ligação.",
  },
  {
    n: "2",
    nome: "NR-10 Básico: Segurança em Instalações e Serviços em Eletricidade",
    selo: "NR-10",
    horas: 40,
    texto:
      "Os 15 temas do Anexo III da NR-10: choque e arco elétrico, desenergização, aterramento, EPI e EPC, primeiros socorros e responsabilidades.",
  },
  {
    n: "3",
    nome: "Segurança no Trabalho em Altura",
    selo: "Preparatório NR-35",
    horas: 8,
    texto:
      "Análise de risco, permissão de trabalho, cinturão e talabarte, ancoragem, acidentes típicos e noções de resgate.",
  },
];

// Perguntas no formato em que as pessoas buscam (Google, ChatGPT, Gemini): resposta direta na primeira frase.
export const PERGUNTAS_FORMACAO = [
  {
    p: "Qual curso de eletricista fazer para começar do zero?",
    r: "Um curso de eletricista residencial básico com NR-10. A Formação Inicial para Eletricista do SIBRAP junta os dois e ainda inclui o preparatório NR-35, em 88 horas online, para quem nunca trabalhou com elétrica.",
  },
  {
    p: "Quantos certificados eu recebo?",
    r: "Três: um de cada curso, com a carga horária completa (40 h, 40 h e 8 h), QR Code de validação e assinatura eletrônica do instrutor Alexsandro de Sousa Silva, Técnico em Eletrotécnica (CRT-01).",
  },
  {
    p: "O certificado de eletricista é reconhecido?",
    r: "Sim, como curso livre de qualificação profissional: vale em todo o território nacional (Lei nº 9.394/1996, art. 42), tem carga horária, conteúdo programático no verso e QR Code para a empresa conferir. Não é diploma de curso técnico.",
  },
  {
    p: "O curso de NR-35 vale como treinamento da empresa?",
    r: "Não. Desde julho de 2026 o Ministério do Trabalho exige que o treinamento de NR-35 seja todo presencial. O nosso curso de 8 h é preparatório: você chega no treinamento da empresa já sabendo o conteúdo, e isso conta no currículo e na entrevista.",
  },
  {
    p: "Quanto ganha um eletricista iniciante?",
    r: "De R$ 2.100 a R$ 2.700 por mês com carteira assinada, do piso de eletricista auxiliar à média de eletricista de instalações (Novo CAGED 2026). Por conta própria, o ganho depende dos serviços atendidos.",
  },
  {
    p: "Quanto custa o curso de eletricista com NR-10?",
    r: "R$ 129,90 no PIX até 31/12/2026 (promoção de fim de ano). Depois, ou no cartão, R$ 149,90 em até 3x de R$ 49,97 sem juros. Pagamento único, sem mensalidade, com os 3 cursos e os 3 certificados.",
  },
  {
    p: "Preciso ter experiência ou estudo?",
    r: "Não. A formação começa do zero, em linguagem simples, e você estuda no celular ou no computador, no seu ritmo.",
  },
] as const;

export const reaisFormacao = (c: number) =>
  (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/** Linhas para o llms.txt / llms-full.txt. */
export function blocoLlmsFormacao(site: string, completo = false): string[] {
  const f = FORMACAO_ELETRICISTA;
  if (!f.vendaAberta) return [];
  const l = [
    `## ${f.nome} (curso de eletricista com NR-10)`,
    "",
    `URL: ${site}${f.caminho}`,
    "",
    f.resumo,
    "",
  ];
  for (const c of CURSOS_FORMACAO)
    l.push(`- ${c.nome} (${c.horas} h): ${c.texto}`);
  l.push("");
  if (completo) {
    for (const q of PERGUNTAS_FORMACAO) l.push(`- ${q.p} ${q.r}`);
    l.push("");
  }
  return l;
}
