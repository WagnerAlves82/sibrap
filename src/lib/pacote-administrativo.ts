// Pacote Administrativo: 4 cursos gratuitos de escritório + os 4 certificados num pagamento só.
// Wagner, 18/11/2026: nasceu do pedido da aluna Juliene. Enquanto ela não paga, o produto custa R$ 44,99
// (complemento dos R$ 44,91 que ela já pagou no Secretariado = R$ 89,90) e a página fica fora do Google.
// Depois do pagamento dela: preço R$ 69,90 (aqui E no produto `pacote-administrativo` no banco) e vendaAberta = true.

export const PACOTE_ADM = {
  vendaAberta: false as boolean,
  caminho: "/cursos/pacote-administrativo",
  area: "/minha-area/pacote-administrativo",
  produto: "pacote-administrativo",
  nome: "Pacote Administrativo",
  titulo: "Pacote ADM: 5 cursos de escritório com certificado",
  descricao:
    "Redação Oficial, Arquivo, Departamento Pessoal, Auxiliar de RH e IA para o Trabalho Administrativo. Cursos grátis e os 5 certificados de 20 h num pagamento único no PIX.",
  precoCentavos: 4499,
} as const;

export type CursoPacote = { slug: string; nome: string; horas: number; texto: string; certificadoCentavos: number; foto: string; alt: string };

export const CURSOS_PACOTE_ADM: readonly CursoPacote[] = [
  {
    slug: "redacao-oficial-documentos-publicos",
    foto: "/cursos/redacao-oficial/pacote.webp",
    alt: "Mão assinando um documento oficial ao lado de um carimbo",
    nome: "Redação Oficial e Documentos Públicos",
    horas: 20,
    texto: "Padrão ofício, pronomes de tratamento, requerimento, declaração, certidão, ata e despacho.",
    certificadoCentavos: 2990,
  },
  {
    slug: "arquivo-gestao-de-documentos",
    foto: "/cursos/arquivo-gestao/pacote.webp",
    alt: "Arquivista digitalizando documentos numa sala de arquivo",
    nome: "Arquivo e Gestão de Documentos",
    horas: 20,
    texto: "Três idades, métodos de arquivamento, tabela de temporalidade, protocolo, digitalização e LGPD.",
    certificadoCentavos: 2990,
  },
  {
    slug: "auxiliar-de-departamento-pessoal",
    foto: "/cursos/auxiliar-de-departamento-pessoal/pacote.webp",
    alt: "Holerite impresso, calculadora e carteira de trabalho digital no celular sobre a mesa",
    nome: "Auxiliar de Departamento Pessoal",
    horas: 20,
    texto: "Folha com INSS e IRRF, FGTS Digital, eSocial, férias, 13º, rescisão e rotina mensal do DP.",
    certificadoCentavos: 2990,
  },
  {
    slug: "auxiliar-de-recursos-humanos",
    foto: "/cursos/auxiliar-de-recursos-humanos/pacote.webp",
    alt: "Mão indicando a linha de assinatura numa ficha de admissão, ao lado de um crachá",
    nome: "Auxiliar de Recursos Humanos",
    horas: 20,
    texto: "Admissão e eSocial, ponto e horas extras, holerite, férias, 13º, benefícios e desligamento.",
    certificadoCentavos: 2990,
  },
  {
    slug: "inteligencia-artificial-trabalho-administrativo",
    foto: "/cursos/ia-administrativo/card.webp",
    alt: "Assistente administrativa usando um assistente de IA no notebook",
    nome: "IA para o Trabalho Administrativo",
    horas: 20,
    texto: "Prompts, e-mails e atas, resumos de contratos, fórmulas de planilha e LGPD no uso da IA.",
    certificadoCentavos: 2990,
  },
];

export const HORAS_PACOTE_ADM = CURSOS_PACOTE_ADM.reduce((s, c) => s + c.horas, 0);
export const SEPARADOS_PACOTE_ADM = CURSOS_PACOTE_ADM.reduce((s, c) => s + c.certificadoCentavos, 0);

export const reaisPacote = (c: number) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
