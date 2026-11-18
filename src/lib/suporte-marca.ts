// Suporte Especializado do curso Registre Sua Marca no INPI (pedido do Wagner, 16/11/2026).
// Serviço avulso pago (produto 'suporte-registro-marca', R$ 59,90): atendimento remoto pelo AnyDesk,
// iniciado em até 24 horas corridas após o pagamento. Termos completos: TERMOS_SUPORTE abaixo.

export const CURSO_MARCA = "registro-de-marca-inpi";
export const PRODUTO_SUPORTE_MARCA = "suporte-registro-marca";
export const AREA_SUPORTE_MARCA = `/minha-area/cursos/${CURSO_MARCA}/suporte`;
export const ANYDESK_DOWNLOAD = "https://anydesk.com/pt/downloads";

export const TERMOS_SUPORTE: { titulo: string; itens: string[] }[] = [
  {
    titulo: "O que está incluído",
    itens: [
      "1 sessão de até 1 h 30 min por acesso remoto.",
      "1 pedido: uma marca, uma apresentação (nominativa, mista ou figurativa) e uma classe.",
      "Cadastro no e-INPI, emissão da GRU, preenchimento do e-Marcas, escolha da classe e dos itens, Classificação de Viena, protocolo e entrega do PDF com o número do processo.",
    ],
  },
  {
    titulo: "O que não está incluído",
    itens: [
      "As taxas do INPI (GRUs), pagas pelo próprio aluno à União.",
      "Criação ou edição de logotipo.",
      "Resposta a oposição, cumprimento de exigência, recurso, notificação ou ação judicial.",
      "Garantia de concessão: a decisão do pedido é exclusiva do INPI.",
      "Representação perante o INPI. O atendimento é assistência técnica: o pedido é feito em nome e com o login do próprio titular.",
    ],
  },
  {
    titulo: "Prazo de atendimento",
    itens: [
      "O atendimento começa em até 24 horas corridas (inclusive sábados, domingos e feriados) após a confirmação do pagamento.",
      "Entramos em contato por e-mail para combinar o horário dentro desse prazo.",
      "Se você não responder ou não estiver disponível no horário combinado, o prazo se considera cumprido e um novo horário é combinado conforme a agenda.",
    ],
  },
  {
    titulo: "Acesso remoto (AnyDesk)",
    itens: [
      "O atendimento usa o AnyDesk, gratuito. O link de instalação e o passo a passo aparecem nesta página após o pagamento, antes da sessão.",
      "A conexão só acontece com você presente, aceitando na sua tela. Você pode encerrar a qualquer momento.",
      "Senhas, dados bancários e pagamentos são digitados por você. Não pedimos, não anotamos e não guardamos senhas.",
      "A sessão não é gravada. Ao final, a conexão é encerrada e você pode desinstalar o programa.",
    ],
  },
  {
    titulo: "Responsabilidade e reembolso",
    itens: [
      "Você declara que as informações do pedido são verdadeiras e que exerce a atividade pedida (art. 128 da Lei 9.279/1996).",
      "Arrependimento: até 7 dias da compra, se o atendimento ainda não tiver sido realizado (CDC, art. 49).",
      "Se não iniciarmos o atendimento em 24 horas corridas por motivo nosso, o reembolso é integral.",
      "Depois da sessão realizada e do protocolo feito, não há reembolso.",
      "Os dados vistos na sessão são usados só para o pedido, conforme a LGPD (Lei 13.709/2018).",
    ],
  },
];
