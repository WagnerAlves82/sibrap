// Formação Profissional em Portaria e Condomínios (Wagner, 25/11/2026): landing própria, fora da vitrine,
// indexável no Google e usada nos anúncios do Meta (as cidades ficam só na segmentação do anúncio).
// 3 cursos gratuitos + os 3 certificados por R$ 89,90 (separados: R$ 39,90 + R$ 39,90 + R$ 29,90 = R$ 109,70).

export const FORMACAO_PORTARIA = {
  // false: página fora do Google, do sitemap e do llms.txt. Trocar para true ao abrir a venda.
  vendaAberta: true as boolean,
  caminho: "/cursos/formacao-portaria",
  nome: "Formação Profissional em Portaria e Condomínios",
  titulo: "Curso de Porteiro com Certificado | Formação Profissional em Portaria e Condomínios",
  descricao:
    "Curso de porteiro online: Agente de Portaria (60 h), Informática para Portaria e Condomínios (40 h) e LGPD na Prática (20 h). 3 certificados com QR Code por R$ 89,90.",
  resumo:
    "A Formação Profissional em Portaria e Condomínios do SIBRAP é um curso online de 120 horas com 3 certificados: Agente de Portaria (60 h), Informática para Portaria e Condomínios (40 h) e LGPD na Prática: Portarias, Condomínios e Pequenas Empresas (20 h). Os certificados têm QR Code e valem em todo o Brasil como curso livre. Pagamento único de R$ 89,90 no PIX ou em até 3x no cartão.",
  horasTotais: 120,
  precoCentavos: 8990,
  parcela: "3x de R$ 29,97 sem juros",
  palavrasChave: [
    "curso de porteiro",
    "curso de porteiro online",
    "curso de porteiro com certificado",
    "curso de agente de portaria",
    "curso de controlador de acesso",
    "curso para trabalhar em condomínio",
    "curso de portaria e condomínio",
    "informática para porteiro",
    "curso de LGPD",
    "LGPD para condomínios",
  ],
} as const;

export const PRODUTO_FORMACAO_PORTARIA = "formacao-portaria";
export const CURSOS_SLUGS_FORMACAO_PORTARIA = [
  "agente-de-portaria",
  "informatica-para-portaria-e-condominios",
  "lgpd-na-pratica",
] as const;
// separados, os 3 certificados de carga completa custam R$ 39,90 + R$ 39,90 + R$ 29,90
export const PRECO_SEPARADOS_PORTARIA_CENTAVOS = 3990 + 3990 + 2990;
export const AREA_FORMACAO_PORTARIA = "/minha-area/formacao-portaria";

export type CursoFormacaoPortaria = { n: string; nome: string; horas: number; texto: string; foto: string; alt: string };

export const CURSOS_FORMACAO_PORTARIA: readonly CursoFormacaoPortaria[] = [
  {
    n: "1",
    nome: "Agente de Portaria",
    horas: 60,
    foto: "/cursos/portaria/m1a1.webp",
    alt: "Agente de portaria uniformizado na guarita de um condomínio, atento às câmeras",
    texto: "Controle de acesso com simulador, golpes, emergências e incêndio, rádio HT, livro de ocorrências e a lei da portaria.",
  },
  {
    n: "2",
    nome: "Informática para Portaria e Condomínios",
    horas: 40,
    foto: "/cursos/informatica-portaria/card.webp",
    alt: "Porteiro uniformizado usando o computador da recepção, com dois monitores sobre a mesa",
    texto: "Sistema de acesso, câmeras e gravações, planilha de encomendas, golpes digitais, senhas e IA para escrever avisos.",
  },
  {
    n: "3",
    nome: "LGPD na Prática: Portarias, Condomínios e Pequenas Empresas",
    horas: 20,
    foto: "/cursos/lgpd-na-pratica/card.webp",
    alt: "Recepcionista guardando uma pasta de documentos na gaveta da mesa de atendimento",
    texto: "Dados de moradores e visitantes, biometria, câmeras, pedidos da polícia e o que fazer num vazamento, sem juridiquês.",
  },
];

export const PERGUNTAS_FORMACAO_PORTARIA = [
  {
    p: "Qual curso fazer para trabalhar como porteiro?",
    r: "Um curso de agente de portaria com noções de informática e LGPD. A Formação Profissional em Portaria e Condomínios do SIBRAP junta os três em 120 horas online, para quem quer começar ou se destacar em condomínios, empresas e comércio.",
  },
  {
    p: "Quantos certificados eu recebo?",
    r: "Três, um de cada curso, com a carga horária completa (60 h, 40 h e 20 h), QR Code de validação e conteúdo programático.",
  },
  {
    p: "O certificado é reconhecido?",
    r: "Sim, como curso livre de qualificação profissional: vale em todo o território nacional (Lei nº 9.394/1996, art. 42) e tem QR Code para a empresa conferir. Não é diploma de curso técnico.",
  },
  {
    p: "Este curso forma vigilante?",
    r: "Não. Vigilante é profissão regulamentada e exige curso em escola autorizada pela Polícia Federal. A formação prepara para portaria, controle de acesso e condomínios.",
  },
  {
    p: "Quanto custa?",
    r: "R$ 89,90 no PIX ou em até 3x de R$ 29,97 sem juros no cartão, pagamento único. Separados, os três certificados custariam R$ 109,70.",
  },
  {
    p: "Preciso ter experiência?",
    r: "Não. A formação começa do zero, em linguagem simples, e você estuda no celular ou no computador, no seu ritmo.",
  },
] as const;

export const reaisPortaria = (c: number) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
